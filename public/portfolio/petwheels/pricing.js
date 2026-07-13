/* Petwheels — pricing calculator.
 *
 * Turns the customizer parameters into an estimated printed weight per part,
 * then into a price. The measured weights come from CadQuery builds at the
 * parameter extremes — see weight-sheet.pdf in the repo root.
 *
 * Weight model
 * ------------
 * Print weight tracks part VOLUME (at a fixed infill %, walls and infill both
 * scale with size), and each morph parameter scales the part's linear
 * dimensions linearly. Volume goes with the cube of linear size, so the
 * cube root of the weight — a "linear size" proxy — is (multi)linear in the
 * normalized parameters:
 *
 *   weight(t₁..tₖ) = ( Σ_corners  r_c · Π_i (cᵢ ? tᵢ : 1−tᵢ) ) ^ EXPONENT
 *
 * Per part, the 2^k corner values r_c of that multilinear form are fitted to
 * the measured rows by least squares. Rows measured at broken parameter
 * values (the 0.25 / 0.5 runs where CadQuery failed at the extreme) are
 * handled naturally: the fit extrapolates the missing 0/1 corners along the
 * cube-law curve.
 *
 * Editing anything in PARTS[].data (changing a gram value, adding rows) or
 * CONFIG just changes the next quote — curves are refitted on demand.
 *
 * Parameters are normalized 0..1 over the same mm ranges the morph targets /
 * cad/params.py use (RANGES below). 0 and 1 = the morph-target extremes.
 *
 * Price (placeholder formula, tweak in CONFIG):
 *   material = totalKg × materialPricePerKg   (R$140 / kg)
 *   price    = material × priceMultiplier     (× 5)
 */
(function () {
  'use strict';

  // ===================== EDITABLE CONFIG =====================
  const CONFIG = {
    materialPricePerKg: 140,  // R$ per kg of filament
    priceMultiplier:    5,    // final price = material cost × this
    exponent:           3,    // weight ≈ (linear size)^exponent (3 = volume)
    // Flat add-on prices (R$) — added on top of material × multiplier when
    // the matching toggle is on. Keys match the quote opts / PARTS.optional.
    accessories: {
      legSupport: 15,   // rear leg slings (fabric; the printed part is weighed)
      backStrap:  25,   // back strap that keeps the dog in place
      collar:     70,   // padded collar
    },
  };

  // Normalization ranges (mm, except thickness = ThicknessFactor).
  // Must match the morph ranges in script.js / cad/params.py.
  const RANGES = {
    scale:     { min: 120, max: 600 },  // Thigh_Circumference mm
    height:    { min: 120, max: 600 },  // Height mm
    length:    { min: 200, max: 700 },  // Length mm
    width:     { min:  50, max: 300 },  // Width mm
    radius:    { min:  35, max: 120 },  // Wheel_Radius mm
    thickness: { min: 1.0, max: 2.0 },  // ThicknessFactor
  };

  // ===================== EDITABLE WEIGHT DATA =====================
  // One entry per printed part. `params` lists which normalized parameters
  // drive the part's weight; each data row is [[param values...], grams] in
  // the same order. Values like 0.25 / 0.5 are fine — the fit extrapolates.
  // `qty`: the chair is mirrored (left + right of every part) except the
  // LegSupport, which is a single U-shaped piece.
  const PARTS = [
    {
      id: 'main', label: 'Main', qty: 2, params: ['scale'],
      data: [
        [[0], 22],
        [[1], 891],
      ],
    },
    {
      id: 'seat', label: 'Seat', qty: 2, params: ['scale'],
      data: [
        [[0], 9],
        [[1], 484],
      ],
    },
    {
      id: 'arm', label: 'Arm + Buttons', qty: 2, params: ['scale', 'height'],
      data: [
        [[0, 0],   16],
        [[0, 1],   48],
        [[1, 0.5], 313],
        [[1, 1],   385],
      ],
    },
    {
      id: 'armHub', label: 'Arm Hub', qty: 2, params: ['scale', 'height'],
      data: [
        [[0, 0],   12],
        [[0, 1],   25],
        [[1, 0.5], 255],
        [[1, 1],   297],
      ],
    },
    {
      id: 'sideBar', label: 'Side Bar', qty: 2, params: ['scale', 'length'],
      data: [
        [[0, 0], 17],
        [[0, 1], 60],
        [[1, 0], 65],
        [[1, 1], 262],
      ],
    },
    {
      id: 'sideBarBand', label: 'Side Bar Band', qty: 2, params: ['scale', 'length'],
      data: [
        [[0, 0], 5],
        [[0, 1], 7],
        [[1, 0], 21],
        [[1, 1], 31],
      ],
    },
    {
      id: 'wheel', label: 'Wheel', qty: 2, params: ['radius', 'thickness'],
      data: [
        [[0, 0], 22],
        [[0, 1], 49],
        [[1, 0], 317],
        [[1, 1], 485],
      ],
    },
    {
      id: 'tire', label: 'Tire', qty: 2, params: ['radius', 'thickness'],
      data: [
        [[0, 0], 13],
        [[0, 1], 41],
        [[1, 0], 105],
        [[1, 1], 156],
      ],
    },
    {
      id: 'legSupport', label: 'Leg Support', qty: 1, optional: 'legSupport',
      params: ['scale', 'height', 'width'],
      data: [
        [[0, 0,   0],    19],
        [[0, 0,   1],    46],
        [[0, 1,   1],    57],
        [[0, 1,   0],    30],
        [[1, 1,   1],    299],
        [[1, 0,   0.25], 165],
        [[1, 0.5, 0.5],  209],
        [[1, 0,   1],    247],
      ],
    },
  ];

  // ===================== FITTING =====================

  // Multilinear basis of corner c (bitmask over params) at point t.
  const cornerBasis = (c, t) => {
    let p = 1;
    for (let i = 0; i < t.length; i++) p *= ((c >> i) & 1) ? t[i] : 1 - t[i];
    return p;
  };

  // Least squares via normal equations + Gaussian elimination with partial
  // pivoting. A is n×m (n rows = data points, m = 2^k corners), b is n.
  function solveLeastSquares(A, b) {
    const n = A.length, m = A[0].length;
    const M = Array.from({ length: m }, () => new Float64Array(m + 1));
    for (let i = 0; i < m; i++) {
      for (let j = 0; j < m; j++) {
        let s = 0;
        for (let r = 0; r < n; r++) s += A[r][i] * A[r][j];
        M[i][j] = s;
      }
      let s = 0;
      for (let r = 0; r < n; r++) s += A[r][i] * b[r];
      M[i][m] = s;
    }
    for (let col = 0; col < m; col++) {
      let piv = col;
      for (let r = col + 1; r < m; r++) if (Math.abs(M[r][col]) > Math.abs(M[piv][col])) piv = r;
      if (Math.abs(M[piv][col]) < 1e-12) continue; // degenerate — leave 0
      [M[col], M[piv]] = [M[piv], M[col]];
      for (let r = 0; r < m; r++) {
        if (r === col) continue;
        const f = M[r][col] / M[col][col];
        for (let cc = col; cc <= m; cc++) M[r][cc] -= f * M[col][cc];
      }
    }
    const x = new Float64Array(m);
    for (let i = 0; i < m; i++) x[i] = Math.abs(M[i][i]) > 1e-12 ? M[i][m] / M[i][i] : 0;
    return x;
  }

  // Fit a part's corner coefficients in "linear size" space (weight^(1/exp)).
  function fitPart(part, exponent) {
    const m = 1 << part.params.length;
    const A = part.data.map(([pt]) => {
      const row = new Array(m);
      for (let c = 0; c < m; c++) row[c] = cornerBasis(c, pt);
      return row;
    });
    const b = part.data.map(([, grams]) => Math.pow(Math.max(0, grams), 1 / exponent));
    return solveLeastSquares(A, b);
  }

  // Weight in grams of one part at normalized params t (object keyed by
  // RANGES names). Fits are cheap (≤8×8 solve), so recompute every call —
  // edits to PARTS/CONFIG always take effect immediately.
  function partWeight(part, t) {
    const coeffs = fitPart(part, CONFIG.exponent);
    const pt = part.params.map((name) => t[name] ?? 0);
    let r = 0;
    for (let c = 0; c < coeffs.length; c++) r += coeffs[c] * cornerBasis(c, pt);
    return Math.pow(Math.max(0, r), CONFIG.exponent);
  }

  // The 0/1 corner weights implied by the fit — including the corners the
  // sheet couldn't measure directly (extrapolated from the 0.25/0.5 runs).
  function fittedCorners(partId) {
    const part = PARTS.find((p) => p.id === partId);
    if (!part) return null;
    const coeffs = fitPart(part, CONFIG.exponent);
    const out = [];
    for (let c = 0; c < coeffs.length; c++) {
      const pt = part.params.map((_, i) => ((c >> i) & 1));
      out.push({ at: pt, grams: Math.pow(Math.max(0, coeffs[c]), CONFIG.exponent) });
    }
    return out;
  }

  // ===================== QUOTING =====================

  const clamp01 = (x) => Math.max(0, Math.min(1, x));
  const normalize = (value, name) => {
    const r = RANGES[name];
    return clamp01((value - r.min) / (r.max - r.min));
  };

  // Quote from normalized 0..1 params. opts.legSupport=false drops parts
  // whose `optional` flag matches; each opts key that is not false also adds
  // its CONFIG.accessories price on top of the printed-material price.
  function quoteNormalized(t, opts = {}) {
    const parts = [];
    let totalGrams = 0;
    for (const part of PARTS) {
      if (part.optional && opts[part.optional] === false) continue;
      const unitGrams = partWeight(part, t);
      const grams = unitGrams * part.qty;
      totalGrams += grams;
      parts.push({
        id: part.id, label: part.label, qty: part.qty,
        params: part.params.slice(),
        at: part.params.map((n) => t[n] ?? 0),   // the normalized values used
        unitGrams: Math.round(unitGrams * 10) / 10,
        totalGrams: Math.round(grams * 10) / 10,
      });
    }
    const accessories = [];
    let accessoriesBRL = 0;
    for (const [id, price] of Object.entries(CONFIG.accessories)) {
      if (opts[id] === false) continue;
      accessories.push({ id, priceBRL: price });
      accessoriesBRL += price;
    }
    const materialBRL = (totalGrams / 1000) * CONFIG.materialPricePerKg;
    const priceBRL = materialBRL * CONFIG.priceMultiplier + accessoriesBRL;
    return {
      params: t,
      parts,
      accessories,
      totalGrams: Math.round(totalGrams),
      materialBRL: Math.round(materialBRL * 100) / 100,
      accessoriesBRL,
      priceBRL: Math.round(priceBRL * 100) / 100,
      priceCents: Math.round(priceBRL * 100),
    };
  }

  // Quote from raw values (mm / factor) — the shape script.js works in.
  function quoteMm(input) {
    const t = {
      scale:     normalize(input.thighMm,         'scale'),
      height:    normalize(input.heightMm,        'height'),
      length:    normalize(input.lengthMm,        'length'),
      width:     normalize(input.widthMm,         'width'),
      radius:    normalize(input.radiusMm,        'radius'),
      thickness: normalize(input.thicknessFactor, 'thickness'),
    };
    return quoteNormalized(t, {
      legSupport: input.legSupport !== false,
      backStrap:  input.backStrap  !== false,
      collar:     input.collar     !== false,
    });
  }

  // Debug: every measured sheet row evaluated back through the fitted curve.
  // `sheet` vs `model` should match exactly when a part has as many data rows
  // as corners (all of them currently do); a delta means the data became
  // overdetermined and the least-squares fit is compromising.
  function partDiagnostics(partId) {
    const part = PARTS.find((p) => p.id === partId);
    if (!part) return null;
    const rows = part.data.map(([pt, grams]) => {
      const t = {};
      part.params.forEach((n, i) => { t[n] = pt[i]; });
      return {
        at: pt.slice(),
        sheet: grams,
        model: Math.round(partWeight(part, t) * 10) / 10,
      };
    });
    return { id: part.id, label: part.label, qty: part.qty,
             params: part.params.slice(), rows, corners: fittedCorners(partId) };
  }

  const formatBRL = (cents) =>
    (Number(cents || 0) / 100).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' });

  // ===================== EXPORT =====================
  const root = (typeof window !== 'undefined') ? window : globalThis;
  root.Petwheels = root.Petwheels || {};
  root.Petwheels.pricing = {
    config: CONFIG,
    ranges: RANGES,
    parts: PARTS,
    quoteMm,
    quoteNormalized,
    partWeight: (id, t) => {
      const part = PARTS.find((p) => p.id === id);
      return part ? partWeight(part, t) : 0;
    },
    fittedCorners,
    partDiagnostics,
    formatBRL,
  };
})();
