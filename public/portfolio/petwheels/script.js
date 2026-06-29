/* Petwheels — customizer interactions */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));

  // ============ MODEL CATALOG ============
  // Single source of truth for the wheelchair models shown in the viewport's
  // dropdown. Edit names / descriptions / thumbnails / glb paths here — the
  // dropdown and trigger pill are rendered from this on boot, so HTML doesn't
  // need to change when you add or rename a model.
  //   id          — unique slug used as data-model and as the GLB-swap key.
  //   name        — short name shown as the option title in the dropdown.
  //   displayName — name shown in the viewer's header pill (the trigger).
  //                 Falls back to `name` if omitted. Lets the dropdown stay
  //                 terse ("Flow") while the header reads as a product
  //                 ("Petwheels Flow"), or vice-versa.
  //   description — secondary line under the name in the dropdown.
  //   thumbnail   — relative path to the option's small image.
  //   glb         — relative path to the .glb (reserved for when there's
  //                 more than one model; currently every entry uses the
  //                 same file).
  const MODELS = [
    {
      id:          'zephyr',
      name:        'Petwheels Frontier',
      displayName: 'Frontier',
      description: 'Rear-leg wheelchair',
      thumbnail:   'assets/petwheels-dog.png',
      glb:         'assets/petwheels.glb',
    },
  ];

  // ============ FILAMENT CATALOG ============
  // Filaments by stock type. The Style step shows the `rigid` palette for the
  // PLA/PETG slots (Main / Support / Frame parts) and the `flexible` palette
  // for the TPU slot (Flexible parts). Each entry's properties drive BOTH
  // the live PBR material in the canvas AND the visual thumbnail in the
  // swatch list / chip preview.
  //
  //   name      — clean display label. Don't append "(Metallic)" etc here —
  //               labels are auto-derived from `tags` and shown as badges
  //               beside the name in the row title.
  //   color     — sRGB hex. The thumbnail uses this directly for CSS color;
  //               the script converts it to linear space when assigning to
  //               PBR albedo for the canvas render.
  //   roughness — 0 = mirror, 1 = chalk. Silks ~0.25, glossy PETG ~0.5,
  //               standard ~0.55, matte ~0.9.
  //   metallic  — 0 = dielectric (plastic), 1 = metal. Silks 0.05–0.10,
  //               metallics 0.65–0.85.
  //   tags      — optional array of label keys. Drives BOTH the thumbnail
  //               finish AND the badges rendered beside the chosen name.
  //               Supported keys (composable):
  //                 'metallic'   — diagonal mirror-sheen overlay
  //                 'matte'      — no overlay (flat colour)
  //                 'dual-color' — base becomes a gradient from `color`
  //                                to `sheen`. Combine with 'metallic' to
  //                                get a metallic dual-color filament.
  //   sheen     — second sRGB hex for dual-color filaments. Ignored unless
  //               the 'dual-color' tag is present.
  const FILAMENTS = {
    rigid: [
      { name: 'Sky Blue',        color: '#399cff', roughness: 0.35, metallic: 0.70, tags: ['metallic'] },
      { name: 'Pure White',      color: '#F5F5F5', roughness: 0.55, metallic: 0.00 },
      { name: 'Black',           color: '#000000', roughness: 0.55, metallic: 0.49 },
      { name: 'Black',           color: '#000000', roughness: 0.80, metallic: 0.49, tags: ['matte'] },
      { name: 'Sunshine Yellow', color: '#FACC15', roughness: 0.55, metallic: 0.00 },
      { name: 'Purple',          color: '#652ba8', roughness: 0.30, metallic: 0.70, tags: ['metallic'] },
      { name: 'Wood',            color: '#744f3a', roughness: 0.80, metallic: 0.49, tags: ['matte'] },
      { name: 'Green/Yellow',    color: '#57cc33', roughness: 0.35, metallic: 0.45, tags: ['dual-color'], sheen: '#FACC15' },
      { name: 'Copper',          color: '#bd6b3b', roughness: 0.30, metallic: 0.70, tags: ['metallic'] },
      { name: 'Red',             color: '#972929', roughness: 0.30, metallic: 0.70, tags: ['metallic'] },
      { name: 'Navy Blue',       color: '#3e536e', roughness: 0.30, metallic: 0.70, tags: ['metallic'] },
      { name: 'Silver',          color: '#93989e', roughness: 0.35, metallic: 0.65, tags: ['metallic'] },
      { name: 'Gold',            color: '#ac8a3f', roughness: 0.35, metallic: 0.65, tags: ['metallic'] },
    ],
    flexible: [
      { name: 'Black', color: '#000000', roughness: 0.50, metallic: 0.49 },
      { name: 'White', color: '#d3d4d7', roughness: 0.50, metallic: 0.00 },
    ],
  };

  // ============ STATE ============
  let rig = null;   // parametric assembly + morph rig; assigned after glb load

  // Auto wheel radius from height (mm) — piecewise linear, mirrors
  // params.py Wheel_Radius when Auto_Wheel_Radius=True. Hoisted to module
  // scope so the radius-offset slider handlers can use it too.
  const autoWheelRadius = (hmm) =>
    hmm <= 250
      ? 35 + ((hmm - 100) / (250 - 100)) * (55 - 35)
      : 55 + ((hmm - 250) / (500 - 250)) * (110 - 55);
  const RADIUS_MIN = 35;
  const RADIUS_MAX = 120;

  const state = {
    screen: 'steps',            // welcome | steps — this embed starts on the steps
    step: 'measure',            // measure | style | review
    unit: 'cm',
    wheel: 75,
    harness: 'padded',
    harnessLabel: 'Padded',
    legSupport: true,
    includeCollar: true,
    dogVisible: true,           // "Full view" vs "Wheelchair only"
    measuresVisible: true,      // measurement overlay toggle (ruler button)
    // length/height/width/thigh in cm (UI units). thickness is ThicknessFactor (1.0–2.0).
    // radiusManual: when true, radiusOffset (mm) is layered on top of the auto
    // wheel radius and the internal height is shortened by the same amount.
    measures: {
      length: 32, height: 25, width: 8, thigh: 20, thickness: 1.2,
      radiusManual: false, radiusOffset: 0,
    },
  };

  // ============ NAVIGATION ============
  const showScreen = (name) => {
    state.screen = name === 'welcome' ? 'welcome' : 'steps';
    $$('.panel-screen').forEach((s) => {
      s.classList.toggle('is-active', s.dataset.screen === state.screen);
    });
    if (name !== 'welcome') setStep(name);
  };

  const setStep = (step) => {
    state.step = step;
    const order = ['measure', 'style', 'review'];
    const idx = order.indexOf(step);
    $$('.step').forEach((s) => {
      const i = order.indexOf(s.dataset.step);
      s.classList.toggle('is-active', s.dataset.step === step);
      s.classList.toggle('is-done', i < idx);
    });
    $$('.step-body').forEach((b) => {
      b.classList.toggle('is-active', b.dataset.body === step);
    });
    // The measurement overlay only makes sense on the Measure step — show it
    // there, hide it on Style/Review. (projectDimensions reads this each frame.)
    state.measuresVisible = (step === 'measure');
    const mBtn = document.getElementById('toggleMeasures');
    if (mBtn) mBtn.classList.toggle('is-active', state.measuresVisible);
    // Refresh the summary with the latest measurements/options on entry.
    if (step === 'review') updateReview();
  };

  $$('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => showScreen(btn.dataset.go));
  });
  $$('.step').forEach((s) => {
    s.addEventListener('click', () => showScreen(s.dataset.step));
  });

  // ============ MEASUREMENTS ============
  const updateRangeFill = (input) => {
    const min = +input.min, max = +input.max, val = +input.value;
    const p = ((val - min) / (max - min)) * 100;
    input.style.setProperty('--p', p + '%');
  };
  // Display formatter for measurement values. cm → 1 decimal (27.2), in → 1
  // decimal too (10.7). Used both for read-only spans and the editable input.
  const CM_PER_IN = 2.54;
  const formatVal = (val) =>
    state.unit === 'in' ? (val / CM_PER_IN).toFixed(1) : val.toFixed(1);

  $$('input[type=range][data-measure]').forEach((input) => {
    const key = input.dataset.measure;
    updateRangeFill(input);
    input.addEventListener('input', () => {
      state.measures[key] = +input.value;
      updateRangeFill(input);
      updateMeasureOutputs();
      updateChips();
      updateReview();
      updatePrintStats();
      // Height changes the auto wheel radius, which moves the valid
      // offset window — re-tune the radius-offset slider before pushing
      // the rest of the update through to the rig.
      if (key === 'height') syncRadiusOffsetRange();
      if (rig) rig.update();
    });
  });

  // Thickness lives in step 1 too (per spec) but is a unit-less factor — own
  // handler. The displayed/typed value matches the slider 1:1 (no conversion).
  const thicknessInput = $('#rangeThickness');
  if (thicknessInput) {
    updateRangeFill(thicknessInput);
    const thicknessOut = $('#valThickness');
    thicknessInput.addEventListener('input', () => {
      state.measures.thickness = +thicknessInput.value;
      updateRangeFill(thicknessInput);
      if (thicknessOut && document.activeElement !== thicknessOut) {
        thicknessOut.value = state.measures.thickness.toFixed(2);
      }
      if (rig) rig.update();
    });
    if (thicknessOut) thicknessOut.value = state.measures.thickness.toFixed(2);
  }

  // -------- typeable numeric inputs --------
  // The value display next to each slider is a real <input>. Typing is
  // tolerant: any chars are accepted while editing (with a red tint when the
  // value can't parse), and the field commits on blur / Enter — clamping to
  // the slider's range and snapping to its step. Escape reverts.
  // Accept up to 4 leading digits + optional . or , + 2 trailing digits.
  // EU-style commas are normalised to dots in commit().
  const NUM_RE = /^\d{0,4}([.,]\d{0,2})?$/;

  const clampSnap = (v, min, max, step) => {
    v = Math.max(min, Math.min(max, v));
    v = Math.round(v / step) * step;
    return +v.toFixed(6);
  };

  // Wires an editable <input.field-value> to its <input type="range">. The
  // value is stored in `state.measures[key]` in CM (or the slider's native
  // unit), and the display converts when the cm/in unit is toggled.
  //   `unit: 'cm'` — slider is cm, input displays cm or in, parse converts.
  //   `unit: null` — no conversion; what you type is what gets stored.
  //   `format` — formatter used to write to the input field after commit.
  function bindNumericInput({ inputId, sliderId, key, unit, format }) {
    const input = $('#' + inputId);
    const slider = $('#' + sliderId);
    if (!input || !slider) return;

    const min = +slider.min;
    const max = +slider.max;
    const step = +slider.step || 0.1;

    const writeDisplay = () => {
      if (document.activeElement === input) return;
      input.value = format(state.measures[key]);
    };

    input.addEventListener('input', () => {
      // Visual feedback only — we don't fight the cursor while typing.
      input.classList.toggle('is-invalid',
        input.value !== '' && !NUM_RE.test(input.value));
    });

    const commit = () => {
      input.classList.remove('is-invalid');
      // Tolerate EU-style decimal commas: "42,3" → 42.3.
      const raw = parseFloat(String(input.value).replace(',', '.'));
      if (!isFinite(raw)) { writeDisplay(); return; }
      // Convert from the displayed unit to the slider's native unit.
      let v = (unit === 'cm' && state.unit === 'in') ? raw * CM_PER_IN : raw;
      v = clampSnap(v, min, max, step);
      if (v === state.measures[key]) { writeDisplay(); return; }
      state.measures[key] = v;
      slider.value = v;
      updateRangeFill(slider);
      writeDisplay();
      // Drive the same downstream chain the slider's input handler does.
      if (unit === 'cm') {
        updateMeasureOutputs();
        updateChips();
        updateReview();
        updatePrintStats();
        if (key === 'height') syncRadiusOffsetRange();
      }
      if (rig) rig.update();
    };

    input.addEventListener('change', commit);
    input.addEventListener('blur', commit);
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); input.blur(); }
      else if (e.key === 'Escape') {
        e.preventDefault();
        input.classList.remove('is-invalid');
        writeDisplay();
        input.blur();
      }
    });
  }

  // Length / Height / Hip width / Thigh girth — all cm-backed sliders.
  ['length', 'height', 'width', 'thigh'].forEach((key) => {
    const cap = key.charAt(0).toUpperCase() + key.slice(1);
    bindNumericInput({
      inputId:  'val'   + cap,
      sliderId: 'range' + cap,
      key,
      unit:     'cm',
      format:   formatVal,
    });
  });

  // Thickness — unit-less factor with 2-decimal display.
  bindNumericInput({
    inputId:  'valThickness',
    sliderId: 'rangeThickness',
    key:      'thickness',
    unit:     null,
    format:   (v) => v.toFixed(2),
  });

  // Wheel radius: an offset slider that's locked until the user clicks the
  // lock icon. The radius itself is always auto-derived from height; the
  // unlock just lets you ride an offset on top of that auto value, either
  // via the slider or by typing into the value field.
  const radiusLockBtn    = $('#radiusLock');
  const radiusValueInput = $('#valRadius');
  const radiusOffsetInput = $('#rangeRadiusOffset');

  // Current effective R (mm) = auto + (manual ? offset : 0), clamped to
  // morph bounds.
  const computeCurrentR = () => {
    const autoR = autoWheelRadius(state.measures.height * 10);
    const off = state.measures.radiusManual ? +state.measures.radiusOffset || 0 : 0;
    return Math.max(RADIUS_MIN, Math.min(RADIUS_MAX, autoR + off));
  };
  // Render the current R in the active display unit (cm or in), 1 decimal.
  // Internal storage stays in mm; the field is just a view.
  const formatRadius = (mm) => {
    const cm = mm / 10;
    return (state.unit === 'in' ? cm / CM_PER_IN : cm).toFixed(1);
  };
  const writeRadiusDisplay = () => {
    if (!radiusValueInput || document.activeElement === radiusValueInput) return;
    radiusValueInput.value = formatRadius(computeCurrentR());
  };

  // Dynamic offset range — at every height, the offset is bounded so that
  // effective R stays inside [RADIUS_MIN, RADIUS_MAX]. That's what makes
  // the slider physically stop at the cap instead of letting you keep
  // dragging while the wheel stays frozen and the structure keeps growing.
  // In auto mode we leave the bounds alone (slider is locked at 0 anyway)
  // so dragging height doesn't yank the slider value off 0.
  function syncRadiusOffsetRange() {
    if (!radiusOffsetInput) return;
    if (state.measures.radiusManual) {
      const autoR = autoWheelRadius(state.measures.height * 10);
      const min = Math.ceil(RADIUS_MIN - autoR);
      const max = Math.floor(RADIUS_MAX - autoR);
      radiusOffsetInput.min = String(min);
      radiusOffsetInput.max = String(max);
      let v = +radiusOffsetInput.value;
      if (v < min) v = min;
      else if (v > max) v = max;
      if (v !== +radiusOffsetInput.value) {
        radiusOffsetInput.value = v;
        state.measures.radiusOffset = v;
      }
    }
    updateRangeFill(radiusOffsetInput);
  }

  if (radiusLockBtn && radiusOffsetInput && radiusValueInput) {
    syncRadiusOffsetRange();

    const refreshLockUI = () => {
      const on = state.measures.radiusManual;
      radiusOffsetInput.disabled = !on;
      // Disabled (not readonly) — the input can't focus while locked, so the
      // pink focus ring never lights up and the field reads as inactive.
      radiusValueInput.disabled  = !on;
      radiusLockBtn.classList.toggle('is-unlocked', on);
      radiusLockBtn.setAttribute('aria-pressed', String(on));
      radiusLockBtn.setAttribute('aria-label', on ? 'Lock back to auto' : 'Unlock manual radius');
      radiusLockBtn.setAttribute('title',      on ? 'Lock back to auto' : 'Unlock to fine-tune');
    };

    radiusLockBtn.addEventListener('click', () => {
      state.measures.radiusManual = !state.measures.radiusManual;
      if (!state.measures.radiusManual) {
        // Snap the offset back to zero when going back to auto, so unlocking
        // again starts from "no override" rather than wherever the slider sat.
        state.measures.radiusOffset = 0;
        radiusOffsetInput.value = 0;
      }
      syncRadiusOffsetRange();
      refreshLockUI();
      writeRadiusDisplay();
      if (rig) rig.update();
    });

    radiusOffsetInput.addEventListener('input', () => {
      state.measures.radiusOffset = +radiusOffsetInput.value;
      updateRangeFill(radiusOffsetInput);
      writeRadiusDisplay();
      if (rig) rig.update();
    });

    // Typing the effective R commits an offset under the hood. NUM_RE is
    // already defined above for the cm/in fields — same tolerance applies.
    radiusValueInput.addEventListener('input', () => {
      radiusValueInput.classList.toggle('is-invalid',
        radiusValueInput.value !== '' && !NUM_RE.test(radiusValueInput.value));
    });
    const commitRadius = () => {
      radiusValueInput.classList.remove('is-invalid');
      if (!state.measures.radiusManual) { writeRadiusDisplay(); return; }
      const raw = parseFloat(String(radiusValueInput.value).replace(',', '.'));
      if (!isFinite(raw)) { writeRadiusDisplay(); return; }
      // Typed value is in the currently-active display unit (cm or in).
      // Convert back to mm before clamping into the morph's [35,120] range.
      const cmVal = state.unit === 'in' ? raw * CM_PER_IN : raw;
      const mmVal = cmVal * 10;
      const R = Math.max(RADIUS_MIN, Math.min(RADIUS_MAX, mmVal));
      const autoR = autoWheelRadius(state.measures.height * 10);
      // Snap to the offset slider's 1 mm grid; the slider's min/max were
      // already constrained to keep R within bounds by syncRadiusOffsetRange.
      const off = clampSnap(R - autoR, +radiusOffsetInput.min, +radiusOffsetInput.max, 1);
      state.measures.radiusOffset = off;
      radiusOffsetInput.value = String(off);
      updateRangeFill(radiusOffsetInput);
      writeRadiusDisplay();
      if (rig) rig.update();
    };
    radiusValueInput.addEventListener('change', commitRadius);
    radiusValueInput.addEventListener('blur',   commitRadius);
    radiusValueInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); radiusValueInput.blur(); }
      else if (e.key === 'Escape') {
        e.preventDefault();
        radiusValueInput.classList.remove('is-invalid');
        writeRadiusDisplay();
        radiusValueInput.blur();
      }
    });

    refreshLockUI();
    writeRadiusDisplay();
  }

  function updateMeasureOutputs() {
    Object.entries(state.measures).forEach(([k, v]) => {
      // Thickness, radius offset and the manual-radius toggle have their own
      // displays — skip them in the measurement loop.
      if (k === 'thickness' || k === 'radiusOffset' || k === 'radiusManual') return;
      const out = $('#val' + k.charAt(0).toUpperCase() + k.slice(1));
      if (!out) return;
      // Don't overwrite the user's in-progress typing.
      if (document.activeElement === out) return;
      const txt = formatVal(v);
      if (out.tagName === 'INPUT') out.value = txt;
      else out.textContent = txt;
    });
    // Re-tag every cm/in unit — leave × (thickness) alone. The radius card
    // now follows the toggle too (cm or in, never mm).
    $$('.field-output .unit').forEach((u) => {
      if (u.textContent.trim() === '×') return;
      u.textContent = state.unit;
    });
  }

  $$('.unit-btn').forEach((btn) => {
    btn.addEventListener('click', () => {
      $$('.unit-btn').forEach((b) => b.classList.remove('is-active'));
      btn.classList.add('is-active');
      state.unit = btn.dataset.unit;
      updateMeasureOutputs();
      updateChips();
      // Radius display is unit-aware too — re-render in the new unit.
      writeRadiusDisplay();
    });
  });

  // ============ STYLE ============
  // Each material row carries data-mat="m1..m4". The chip shows the current
  // color; clicking it expands the swatch strip in place. Picking a swatch
  // re-tints rig.materials[matSlot], updates the chip, and collapses the
  // strip. Only one strip open at a time.
  const closeAllMaterialSwatches = () => {
    $$('.material-row').forEach((row) => {
      const chip = row.querySelector('.material-chip');
      const swatches = row.querySelector('.material-swatches');
      if (chip) chip.setAttribute('aria-expanded', 'false');
      if (swatches) swatches.hidden = true;
    });
  };

  // sRGB-encoded hex → CSS hex (just clamped 0–1 floats with 2-digit hex).
  // The component values here are already in sRGB, so this is for *display*
  // colors (chip backgrounds, CSS variables, etc).
  const color3ToHex = (c) => {
    if (!c) return '';
    const ch = (v) => Math.round(Math.max(0, Math.min(1, v)) * 255)
                          .toString(16).padStart(2, '0');
    return '#' + ch(c.r) + ch(c.g) + ch(c.b);
  };

  // Stamp finish classes from a filament's `tags`. Drives both the swatch
  // shape and the chip preview's gradient. Composable — a filament tagged
  // ['metallic', 'dual-color'] gets both .has-metallic and .has-dual-color,
  // so the metallic sheen draws on top of the dual-color base via the
  // ::before pseudo / element layering.
  const applyFinishClasses = (el, tags) => {
    if (!el) return;
    el.classList.remove('has-matte', 'has-standard', 'has-metallic', 'has-dual-color');
    if (tags.includes('metallic'))     el.classList.add('has-metallic');
    else if (tags.includes('matte'))   el.classList.add('has-matte');
    else                               el.classList.add('has-standard');
    if (tags.includes('dual-color'))   el.classList.add('has-dual-color');
  };

  // Title-case a tag key for the badge label: 'dual-color' → 'Dual Color'.
  const tagLabel = (tag) =>
    tag.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

  // Render the row title as filament name + tag badges. No tags → name only.
  // Called when the user picks a filament.
  const renderRowTitle = (titleEl, filament) => {
    if (!titleEl || !filament) return;
    const tags = filament.tags || [];
    const badges = tags.map((tag) =>
      `<span class="material-tag material-tag-${tag}">${tagLabel(tag)}</span>`
    ).join('');
    titleEl.innerHTML = escapeHtmlAttr(filament.name) + badges;
  };

  // Sync each chip's CSS color to its material's current albedo. Boot-time
  // only — we don't know which catalog filament the .glb defaults match, so
  // the chip just shows the right color in a generic standard finish until
  // the user explicitly picks one (after which the click handler sets tags).
  const syncMaterialChips = () => {
    if (!rig || !rig.materials) return;
    $$('.material-row').forEach((row) => {
      const mat = rig.materials[row.dataset.mat];
      const chipColor = row.querySelector('.material-chip-color');
      if (!mat || !mat.albedoColor || !chipColor) return;
      chipColor.style.setProperty('--c', color3ToHex(mat.albedoColor.toGammaSpace()));
      applyFinishClasses(chipColor, []);  // default → has-standard
    });
  };
  // Exposed for the rig-load hook below to call once the materials exist.
  window.__pwSyncMaterialChips = syncMaterialChips;

  // Render the popover list into each material row from the FILAMENTS
  // catalog. Each row's data-filament picks which palette to use (rigid
  // for PLA/PETG on m1-m3, flexible for TPU on m4). Each item is a row of
  // color square + name; data-* attributes carry the raw filament record
  // so the click handler can apply color + roughness + metallic in one
  // shot without a re-lookup.
  const escapeHtmlAttr = (s) => String(s).replace(/[&<>"']/g, (c) => (
    { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
  ));
  const renderSwatches = () => {
    $$('.material-row').forEach((row) => {
      const type = row.dataset.filament || 'rigid';
      const palette = FILAMENTS[type] || [];
      const container = row.querySelector('.material-swatches');
      if (!container) return;
      container.innerHTML = palette.map((f, idx) => {
        const tags  = f.tags || [];
        // Mirror of applyFinishClasses, inlined into the markup so the
        // popover renders with the right thumbnail finish on first paint.
        let cls = '';
        if (tags.includes('metallic'))    cls += ' has-metallic';
        else if (tags.includes('matte'))  cls += ' has-matte';
        else                              cls += ' has-standard';
        if (tags.includes('dual-color'))  cls += ' has-dual-color';
        // Inline CSS vars carry the base color and (when dual) the sheen,
        // so the gradient rules in CSS resolve without JS touching style
        // on each item later.
        const cssVars = `--c:${f.color}` + (f.sheen ? `;--c2:${f.sheen}` : '');
        return (
          '<button class="material-swatch-item" type="button" ' +
            `data-idx="${idx}" ` +
            `data-color="${f.color}" ` +
            `data-roughness="${f.roughness}" ` +
            `data-metallic="${f.metallic}" ` +
            `data-tags="${tags.join(',')}" ` +
            (f.sheen ? `data-sheen="${f.sheen}" ` : '') +
            `data-name="${escapeHtmlAttr(f.name)}">` +
            `<span class="material-swatch-color${cls}" style="${cssVars}"></span>` +
            `<span class="material-swatch-name">${escapeHtmlAttr(f.name)}</span>` +
          '</button>'
        );
      }).join('');
    });
  };
  renderSwatches();

  $$('.material-row').forEach((row) => {
    const matSlot = row.dataset.mat;
    const chip = row.querySelector('.material-chip');
    const chipColor = row.querySelector('.material-chip-color');
    const swatches = row.querySelector('.material-swatches');
    if (!chip || !swatches) return;

    chip.addEventListener('click', (e) => {
      e.stopPropagation();
      const wasOpen = !swatches.hidden;
      closeAllMaterialSwatches();
      if (!wasOpen) {
        swatches.hidden = false;
        chip.setAttribute('aria-expanded', 'true');
      }
    });

    // Event-delegated item click so we don't have to re-bind after the
    // catalog re-renders.
    swatches.addEventListener('click', (e) => {
      const item = e.target.closest('.material-swatch-item');
      if (!item) return;
      e.stopPropagation();
      const hex       = item.dataset.color;
      const roughness = parseFloat(item.dataset.roughness);
      const metallic  = parseFloat(item.dataset.metallic);
      const sheen     = item.dataset.sheen || '';
      const tags      = (item.dataset.tags || '').split(',').filter(Boolean);
      const name      = item.dataset.name || '';
      if (!hex) return;
      if (chipColor) {
        // Write CSS vars (not backgroundColor) so the CSS rules — including
        // the .has-dual-color gradient — pick up both base and sheen.
        chipColor.style.setProperty('--c', hex);
        chipColor.style.setProperty('--c2', sheen || hex);
        applyFinishClasses(chipColor, tags);
      }
      // Row title becomes the filament name + tag badges.
      const titleEl = row.querySelector('.material-title');
      renderRowTitle(titleEl, { name, tags });

      const mat = rig && rig.materials && rig.materials[matSlot];
      if (mat) {
        // sRGB hex → linear for PBR albedo. Without toLinearSpace() the
        // renderer would gamma-encode the already-sRGB value and the result
        // looks washed out (lighter / "pastel") in the canvas.
        mat.albedoColor = BABYLON.Color3.FromHexString(hex).toLinearSpace();
        if (isFinite(roughness)) mat.roughness = roughness;
        if (isFinite(metallic))  mat.metallic  = metallic;
      }
      // Mark only the clicked item as selected within this row.
      swatches.querySelectorAll('.material-swatch-item').forEach((s) => s.classList.remove('is-selected'));
      item.classList.add('is-selected');
      swatches.hidden = true;
      chip.setAttribute('aria-expanded', 'false');
    });
  });

  // Close on outside click / Escape.
  document.addEventListener('click', (e) => {
    if (e.target.closest('.material-row')) return;
    closeAllMaterialSwatches();
  });
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') closeAllMaterialSwatches();
  });

  // Rear-leg slings = LegSupportStrap visibility (source + mirror clone).
  // Default ON. Disabling hides both halves; the bbox predicate filters
  // disabled meshes so the camera framing follows the new silhouette.
  $('#legSupport').addEventListener('change', (e) => {
    state.legSupport = e.target.checked;
    const revLeg = $('#revLeg2'); if (revLeg) revLeg.textContent = state.legSupport ? 'Yes' : 'No';
    const strapSrc = scene.getMeshByName('LegSupportStrap');
    const strapMir = scene.getMeshByName('LegSupportStrap_mir');
    if (strapSrc) strapSrc.setEnabled(state.legSupport);
    if (strapMir) strapMir.setEnabled(state.legSupport);
  });

  // Collar — toggle is wired now, but the mesh isn't in the .glb yet. When
  // it lands (probably named "Collar"), the commented setEnabled lines
  // below will start mattering.
  const collarToggle = $('#includeCollar');
  if (collarToggle) {
    collarToggle.addEventListener('change', (e) => {
      state.includeCollar = e.target.checked;
      const collarSrc = scene.getMeshByName('Collar');
      const collarMir = scene.getMeshByName('Collar_mir');
      if (collarSrc) collarSrc.setEnabled(state.includeCollar);
      if (collarMir) collarMir.setEnabled(state.includeCollar);
    });
  }

  // ============ DERIVED UI ============
  function updateChips() {
    // The floating spec-chips were removed from the viewport; this remains as
    // a no-op tolerant of the elements being absent so we don't fight the
    // rest of the update chain. Re-enable simply by adding the IDs back.
    const set = (id, txt) => { const e = $(id); if (e) e.textContent = txt; };
    set('#chipLength', formatVal(state.measures.length) + ' ' + state.unit);
    set('#chipHeight', formatVal(state.measures.height) + ' ' + state.unit);
    set('#chipWidth',  formatVal(state.measures.width)  + ' ' + state.unit);
    set('#chipThigh',  formatVal(state.measures.thigh)  + ' ' + state.unit);
  }
  function updateReview() {
    $('#revLength').textContent = formatVal(state.measures.length);
    $('#revHeight').textContent = formatVal(state.measures.height);
    $('#revWidth').textContent = formatVal(state.measures.width);
    $('#revThigh').textContent = formatVal(state.measures.thigh);
    $('#revThickness').textContent = state.measures.thickness.toFixed(2);
    const revRadius = $('#revRadius');
    if (revRadius) revRadius.textContent = formatRadius(computeCurrentR());
    const revLeg = $('#revLeg2');
    if (revLeg) revLeg.textContent = state.legSupport ? 'Yes' : 'No';
    const revCollar = $('#revCollar');
    if (revCollar) revCollar.textContent = state.includeCollar ? 'Yes' : 'No';
    // Measurement rows share the active unit (cm/in); thickness is a × factor.
    $$('.rev-unit').forEach((e) => { e.textContent = state.unit; });
  }
  function updatePrintStats() {
    const size = state.measures.length + state.measures.height;
    const time = Math.max(8, Math.round(size * 0.25 + 2));
    const filament = Math.max(140, Math.round(size * 5 + 60));
    const tEl = $('#statTime'); if (tEl) tEl.textContent = '~' + time + 'h';
    const fEl = $('#statFilament'); if (fEl) fEl.textContent = '~' + filament + ' g';
  }

  updateChips();
  updateMeasureOutputs();
  updateReview();
  updatePrintStats();

  // ============ NAV SCROLL ============
  const nav = $('.nav');
  if (nav) {
    const onScroll = () => {
      nav.style.boxShadow = window.scrollY > 8 ? '0 6px 18px -10px rgba(15,18,38,.15)' : 'none';
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ============ BABYLON VIEWER ============
  const canvas = $('#renderCanvas');
  const loader = $('#vpLoader');
  if (!canvas || typeof BABYLON === 'undefined') return;

  const engine = new BABYLON.Engine(canvas, true, {
    preserveDrawingBuffer: true,
    stencil: true,
    alpha: true,
    premultipliedAlpha: false,
    antialias: true,
  });
  // Disable Babylon's default black loading UI — we use our own spinner.
  BABYLON.SceneLoader.ShowLoadingScreen = false;
  engine.loadingScreen = {
    displayLoadingUI: () => { },
    hideLoadingUI: () => { },
    loadingUIBackgroundColor: '',
    loadingUIText: '',
  };
  const scene = new BABYLON.Scene(engine);
  scene.clearColor = new BABYLON.Color4(0, 0, 0, 0);
  scene.autoClear = true;

  // camera — flatter (narrower) FOV for a less fisheye look. Beta is the
  // polar angle from +Y: π/2 is horizon-level, smaller values look down on
  // the model. π/2.55 (~70°) sits between horizon and a clear top-down.
  const camera = new BABYLON.ArcRotateCamera(
    'cam',
    -Math.PI / 2,            // look from +Z toward origin
    Math.PI / 2.4,
    6,
    new BABYLON.Vector3(0, 0.6, 0),
    scene
  );
  camera.fov = 0.45;          // narrower than default 0.8
  camera.minZ = 0.05;
  // No camera inputs — zoom is button-only, pointer drag rotates the MODEL (below)
  camera.inputs.clear();
  camera.lowerRadiusLimit = 1.5;
  camera.upperRadiusLimit = 20;

  // IBL — environment.env (prefiltered HDR cube)
  const envTex = BABYLON.CubeTexture.CreateFromPrefilteredData('assets/environment.env', scene);
  scene.environmentTexture = envTex;
  scene.environmentIntensity = 2.0;

  // Soft directional fill
  const dir = new BABYLON.DirectionalLight('dir', new BABYLON.Vector3(-0.4, -0.9, -0.3), scene);
  dir.intensity = 0.35;

  // Post: subtle grain (dithering) + tiny chromatic aberration so the render
  // isn't pancake-flat. Values are intentionally low — should be felt, not seen.
  const pipeline = new BABYLON.DefaultRenderingPipeline('petwheelsFX', true, scene, [camera]);
  pipeline.samples = 4;
  pipeline.grainEnabled = true;
  pipeline.grain.intensity = 6;
  pipeline.grain.animated = true;
  pipeline.chromaticAberrationEnabled = true;
  pipeline.chromaticAberration.aberrationAmount = 8;
  pipeline.chromaticAberration.radialIntensity = 1.2;

  // ============ MODEL ROTATION (portfolio-style) ============
  // Y rotates freely (accumulates on drag).
  // X "peeks" up to ±15° with progressive resistance, then springs back on release.
  const PEEK_MAX = Math.PI / 12;
  const PEEK_RESISTANCE = 6;
  const ROT_SPEED = 0.006;
  const SPRING_STRENGTH = 0.08;
  // Rotated 180° (a half-turn) from the prior orientation: -0.7π − π = -1.7π.
  // This faces the wheelchair the other way around the Y axis.
  const INITIAL_Y = -Math.PI * 1.7;

  let modelRoot = null;
  let originalQuat = null;
  let accumulatedY = 0;
  let peekX = 0;
  let isDragging = false;
  let lastX = 0, lastY = 0;
  let activePointerId = null;
  let initialRadius = 6;
  let idleAnim = null;

  const applyModelRotation = () => {
    if (!modelRoot || !originalQuat) return;
    const right = camera.getDirection(BABYLON.Axis.X);
    right.y = 0;
    if (right.lengthSquared() < 1e-6) right.set(1, 0, 0);
    right.normalize();
    const yQ = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, accumulatedY);
    const xQ = BABYLON.Quaternion.RotationAxis(right, peekX);
    modelRoot.rotationQuaternion = xQ.multiply(yQ.multiply(originalQuat));
  };

  // Auto-frame state.
  //   bboxCenterLocal — bbox center expressed in modelRoot's LOCAL frame.
  //     Cached at every param change and re-projected to world each frame, so
  //     camera.target tracks the model's center cleanly even while the user
  //     rotates modelRoot (otherwise rotating around the world origin makes
  //     the model orbit out of view).
  //   autoFitRadius   — pure bbox auto-fit baseline. Rebuilt by frameCamera()
  //     on every call, including slider edits, so the chassis stays framed
  //     as it morphs.
  //   userZoomFactor  — multiplicative offset on top of the auto-fit. Wheel
  //     and +/- buttons mutate this; slider edits leave it alone. So a user
  //     who's zoomed in 50% stays zoomed in 50% when they tweak Length —
  //     the goal radius is autoFitRadius * userZoomFactor each frame.
  //   camGoalRadius   = autoFitRadius * userZoomFactor (derived, clamped).
  const ZOOM_FACTOR     = 1.15;       // baseline = bbox fit × this
  const ZOOM_FACTOR_MIN = 0.3;        // how far the user can zoom in
  const ZOOM_FACTOR_MAX = 3.0;        // how far out
  const FOLLOW_LERP     = 0.12;       // per-frame ease for the radius only
  let bboxCenterLocal = null;   // current center (eased toward the goal each frame)
  let bboxCenterGoal  = null;   // target center from the latest frameCamera()
  let autoFitRadius   = null;
  let userZoomFactor  = 1.0;
  let camGoalRadius   = null;

  // Live dimension overlay (spatial HTML/SVG annotations). See the DIMENSION
  // OVERLAY block below tickCameraFollow.
  let dims      = [];     // persistent [{ key, label, a, b, el }] (local-frame anchors)
  let dimOverlay = null;
  let dimSvg    = null;
  let dimDrag   = null;   // active endpoint drag (mode 'linear' | 'thigh')
  const THIGH_DRAG_CM_PER_PX = 0.1;   // thigh drag sensitivity (cm per px of horizontal travel)
  const DIM_IDENTITY = BABYLON.Matrix.Identity();   // reused by Vector3.Project

  // Re-derive camGoalRadius from the current auto fit + user factor, then
  // clamp into the camera's allowed radius window. Called by frameCamera
  // (after recomputing autoFitRadius from the new bbox) and by the wheel /
  // +/- button handlers (after mutating userZoomFactor).
  const applyZoom = () => {
    if (autoFitRadius == null) return;
    const goal = autoFitRadius * userZoomFactor;
    camGoalRadius = Math.max(camera.lowerRadiusLimit,
                             Math.min(camera.upperRadiusLimit, goal));
  };
  const applyUserZoom = (mult) => {
    userZoomFactor = Math.max(ZOOM_FACTOR_MIN,
                              Math.min(ZOOM_FACTOR_MAX, userZoomFactor * mult));
    applyZoom();
  };

  // Compute world bbox + cache its center in modelRoot-local space, clamp the
  // radius limits, and (optionally) re-snap the auto-fit zoom goal.
  //
  //   instant   — snap camera.target / camera.radius this frame (no easing).
  //                Used on first load so we don't fly in.
  //   resetZoom — push camGoalRadius back to the natural auto-fit. Slider
  //                edits pass false: they re-center but preserve whatever
  //                zoom level the user has dialed in (wheel / +/- buttons).
  //                Reset View passes true to restore the default framing.
  const frameCamera = (instant = false, resetZoom = false) => {
    if (!modelRoot) return;
    modelRoot.computeWorldMatrix(true);

    // Build the bbox in modelRoot's LOCAL frame, not world. We take each
    // mesh's 8 world bbox corners and transform them through invMR — that
    // cancels whatever rotation the user has dragged into modelRoot. Why:
    // rotation drag does NOT call frameCamera, so autoFitRadius stays at
    // its pre-rotation value. If we used the world bbox, the first slider
    // event after rotation would re-derive a *differently shaped* AABB
    // (since X/Y/Z extents now face the camera in a different combination)
    // and the lerp would snap the radius — visible as a sudden zoom step.
    // Thickness's step=0.05 fires 10-20× more events than other sliders,
    // which is why it looked thickness-specific. With a rotation-invariant
    // local bbox, no slider can re-fit on rotation alone.
    const predicate = (m) =>
      m && m.isEnabled && m.isEnabled() &&
      m.isVisible !== false &&
      m.getTotalVertices && m.getTotalVertices() > 0;

    const invMR = BABYLON.Matrix.Invert(modelRoot.getWorldMatrix());
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    const tmp = new BABYLON.Vector3();
    scene.meshes.forEach((m) => {
      if (!predicate(m)) return;
      if (m.morphTargetManager) {
        try { m.refreshBoundingInfo({ applyMorph: true }); }
        catch (_) { try { m.refreshBoundingInfo(false, true); } catch (__) {} }
      }
      m.computeWorldMatrix(true);
      const corners = m.getBoundingInfo().boundingBox.vectorsWorld;
      for (let i = 0; i < corners.length; i++) {
        BABYLON.Vector3.TransformCoordinatesToRef(corners[i], invMR, tmp);
        if (tmp.x < minX) minX = tmp.x;
        if (tmp.y < minY) minY = tmp.y;
        if (tmp.z < minZ) minZ = tmp.z;
        if (tmp.x > maxX) maxX = tmp.x;
        if (tmp.y > maxY) maxY = tmp.y;
        if (tmp.z > maxZ) maxZ = tmp.z;
      }
    });
    if (!isFinite(minX) || !isFinite(maxX)) return;

    // Target anchor. X is always 0 (the chair + mirrored dog are symmetric
    // across the sagittal plane). Z is forced to 0 for the chair alone —
    // otherwise the SideBar's Length morph drags the Z center forward and the
    // mass reads as off-center. But the dog extends well forward of the chassis,
    // so when it's shown we DO follow the real Z center to keep the whole thing
    // framed. The goal is eased toward in tickCameraFollow (smooth toggle).
    const cy = (minY + maxY) * 0.5;
    const dogShown = (state.dogVisible !== false) && dog && dog.ready;
    const cz = dogShown ? (minZ + maxZ) * 0.5 : 0;
    bboxCenterGoal = new BABYLON.Vector3(0, cy, cz);
    if (instant || !bboxCenterLocal) bboxCenterLocal = bboxCenterGoal.clone();

    // Auto-fit baseline. Horizontal span uses sqrt(x² + z²) — the model's
    // diagonal in its horizontal plane — so any Y-axis rotation projects
    // to at most this width. That's what keeps the fit stable through
    // rotation drag.
    const sx = maxX - minX;
    const sy = maxY - minY;
    const sz = maxZ - minZ;
    const aspect = (engine.getRenderWidth() || 1) / (engine.getRenderHeight() || 1);
    const halfV = Math.tan(camera.fov / 2);
    const halfH = halfV * aspect;
    const horizontalSpan = Math.sqrt(sx * sx + sz * sz);
    const fitDistance = Math.max(sy * 0.5 / halfV, horizontalSpan * 0.5 / halfH, 0.5);
    autoFitRadius = fitDistance * ZOOM_FACTOR;
    camera.lowerRadiusLimit = fitDistance * 0.6;
    camera.upperRadiusLimit = fitDistance * 4;

    // Reset View / first frame / canvas resize all wipe the user's manual
    // offset back to 1× — anything else preserves it, so wheel/+- zooms
    // survive slider edits.
    if (resetZoom || instant) userZoomFactor = 1.0;
    applyZoom();

    if (instant) {
      BABYLON.Vector3.TransformCoordinatesToRef(
        bboxCenterLocal, modelRoot.getWorldMatrix(), camera.target,
      );
      camera.radius = camGoalRadius;
    }
  };

  // Re-project the cached bbox center to world EVERY frame (cheap matrix*vec)
  // so rotation drag stays glued to the model's actual center.
  //
  // IMPORTANT: force the world matrix to refresh this tick. Without it,
  // getWorldMatrix() returns the previous render's cached matrix (the cache
  // invalidates inside scene.render(), which happens AFTER this tick), so
  // during fast rotation the camera target lags the model by one frame and
  // the whole scene wiggles. computeWorldMatrix(true) is cheap for a single
  // root transform — much cheaper than a frame of visible jitter.
  const tickCameraFollow = () => {
    if (bboxCenterLocal && modelRoot) {
      // Ease the local center toward its goal so a re-frame (dog toggle, etc.)
      // glides instead of snapping. The lerp is on the rotation-invariant LOCAL
      // center, so rotation drag still tracks instantly (goal already reached).
      if (bboxCenterGoal) {
        BABYLON.Vector3.LerpToRef(bboxCenterLocal, bboxCenterGoal, FOLLOW_LERP, bboxCenterLocal);
      }
      modelRoot.computeWorldMatrix(true);
      BABYLON.Vector3.TransformCoordinatesToRef(
        bboxCenterLocal, modelRoot.getWorldMatrix(), camera.target,
      );
    }
    if (camGoalRadius != null) {
      camera.radius += (camGoalRadius - camera.radius) * FOLLOW_LERP;
    }
  };

  // ============ DIMENSION OVERLAY (dog-driven) ============
  // Spatial HTML/SVG measurement annotations. Anchors come from the dog mesh's
  // color-marked vertices (HeightColor / WidthColor / LengthColor / GroundColor),
  // whose positions are solved every update and stored in modelRoot's LOCAL frame
  // (rotation-invariant, so they survive drag without re-solving). Each frame we
  // transform them to world, project to screen, and draw a white line capped by
  // two bullets with the parameter value (no label) at the midpoint.
  //   • Height — floor point (below the height vertex, local Y=0) → height vertex.
  //   • Length — height vertex → length vertex.
  //   • Width  — width vertex → its mirror across the sagittal plane (both shown).
  // Length renders on the mirror half facing the camera; height renders on the
  // OPPOSITE half so the two don't overlap (they share the withers vertex). Both
  // flip together on rotation. Width spans both halves. Each endpoint bullet is a
  // drag handle that edits the matching param. See the DOG block for the solve.
  const DIM_DEFS = [
    { key: 'height' },
    { key: 'length' },
    { key: 'width' },
    { key: 'thigh' },
  ];
  // Thigh measurement comes from the chair's "TighUI" line mesh — an open oval
  // outline (a LINES mesh) that scales with the thigh param via its Scale morph.
  // We render the WHOLE outline by projecting every edge each frame (so the UI
  // line matches the 3D shape exactly), put the two bullets on the widest gap of
  // the outline, and use its centroid as the radial drag pivot.
  const _tv = new BABYLON.Vector3(), _tw = new BABYLON.Vector3();
  let thighUI = null;
  function setupThighUI() {
    thighUI = null;
    const mesh = scene.meshes.find((m) =>
      m && m.name && m.name.toLowerCase().replace(/[^a-z]/g, '').includes('tighui'));
    if (!mesh) { console.warn('[thigh] TighUI mesh not found'); return; }
    const basis = mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind);
    const indices = mesh.getIndices();
    if (!basis || !indices) { console.warn('[thigh] TighUI missing geometry'); return; }
    const d2 = (a, b) => {
      const dx = basis[3*a]-basis[3*b], dy = basis[3*a+1]-basis[3*b+1], dz = basis[3*a+2]-basis[3*b+2];
      return dx*dx + dy*dy + dz*dz;
    };
    // Open ends = vertices used by exactly one LINES segment.
    const deg = new Map();
    for (let k = 0; k + 1 < indices.length; k += 2) {
      deg.set(indices[k], (deg.get(indices[k]) || 0) + 1);
      deg.set(indices[k + 1], (deg.get(indices[k + 1]) || 0) + 1);
    }
    const ends = [];
    deg.forEach((d, vi) => { if (d === 1) ends.push(vi); });
    // Bullets bracket the widest gap. The outline is split into arcs, so the
    // open ends pair up into gaps (nearest cross-arc ends); pick the largest.
    let gapA = ends[0] != null ? ends[0] : 0, gapB = ends[1] != null ? ends[1] : 0;
    if (ends.length === 4) {
      const [p, q, r, s] = ends;
      const prs = [[[p,q],[r,s]], [[p,r],[q,s]], [[p,s],[q,r]]];
      let bestSum = Infinity, bestPr = prs[0];
      prs.forEach((pr) => {
        const sum = d2(pr[0][0], pr[0][1]) + d2(pr[1][0], pr[1][1]);
        if (sum < bestSum) { bestSum = sum; bestPr = pr; }
      });
      const g = d2(bestPr[0][0], bestPr[0][1]) >= d2(bestPr[1][0], bestPr[1][1]) ? bestPr[0] : bestPr[1];
      gapA = g[0]; gapB = g[1];
    } else if (ends.length > 2) {
      let best = Infinity;
      for (let i=0;i<ends.length;i++) for (let j=i+1;j<ends.length;j++) {
        const dd = d2(ends[i], ends[j]); if (dd < best) { best = dd; gapA = ends[i]; gapB = ends[j]; }
      }
    } else if (ends.length === 2) { gapA = ends[0]; gapB = ends[1]; }
    const mgr = mesh.morphTargetManager;
    let scaleTarget = null;
    if (mgr) for (let i = 0; i < mgr.numTargets; i++) {
      const t = mgr.getTarget(i);
      if (t.name && t.name.toLowerCase().includes('scale')) { scaleTarget = t; break; }
    }
    const sp = scaleTarget ? scaleTarget.getPositions() : null;
    const n = basis.length / 3;
    const bc = new BABYLON.Vector3(), sc = new BABYLON.Vector3();
    for (let i = 0; i < basis.length; i += 3) bc.addInPlaceFromFloats(basis[i], basis[i + 1], basis[i + 2]);
    bc.scaleInPlace(1 / n);
    if (sp) { for (let i = 0; i < sp.length; i += 3) sc.addInPlaceFromFloats(sp[i], sp[i + 1], sp[i + 2]); sc.scaleInPlace(1 / n); }
    else sc.copyFrom(bc);
    thighUI = {
      mesh, indices, basis, scalePos: sp, scaleTarget, vertexCount: n,
      gapA, gapB, basisCentroid: bc, scaleCentroid: sc, proj: new Array(n),
    };
    console.log('[thigh] ready', { mesh: mesh.name, ends, gapA, gapB, verts: n, hasScaleMorph: !!sp });
  }
  const SVG_NS = 'http://www.w3.org/2000/svg';
  const svgEl = (tag, cls) => {
    const e = document.createElementNS(SVG_NS, tag);
    if (cls) e.setAttribute('class', cls);
    return e;
  };

  // Apply a measurement value (cm) from a non-slider source (endpoint drag),
  // driving the exact same downstream chain the slider's input handler does so
  // the model, side panel, chips, review and print stats all stay in sync.
  const capKey = (key) => key.charAt(0).toUpperCase() + key.slice(1);
  function setMeasure(key, value) {
    const slider = $('#range' + capKey(key));
    if (!slider) return;
    const v = clampSnap(value, +slider.min, +slider.max, +slider.step || 0.1);
    if (v === state.measures[key]) return;
    state.measures[key] = v;
    slider.value = v;
    updateRangeFill(slider);
    const input = $('#val' + capKey(key));
    if (input && document.activeElement !== input) input.value = formatVal(v);
    updateMeasureOutputs();
    updateChips();
    updateReview();
    updatePrintStats();
    if (key === 'height') syncRadiusOffsetRange();
    if (rig) rig.update();
  }

  const endDimDrag = () => {
    if (!dimDrag) return;
    dimDrag = null;
    window.removeEventListener('pointermove', onDimDragMove);
    window.removeEventListener('pointerup', endDimDrag);
  };
  function onDimDragMove(e) {
    if (!dimDrag) return;
    if (dimDrag.mode === 'thigh') {
      // Thigh: drag right = bigger, left = smaller. Plain horizontal mapping.
      setMeasure(dimDrag.key, dimDrag.startVal + (e.clientX - dimDrag.startX) * THIGH_DRAG_CM_PER_PX);
    } else {
      // Straight dims: project the pointer's travel onto the line direction
      // (fixed at grab time), convert px → cm, and add to the starting value.
      const dx = e.clientX - dimDrag.startX, dy = e.clientY - dimDrag.startY;
      const proj = dx * dimDrag.dirX + dy * dimDrag.dirY;
      setMeasure(dimDrag.key, dimDrag.startVal + proj * dimDrag.cmPerPx);
    }
  }
  function startDimDrag(rec, which, e) {
    const sa = rec.sa, sb = rec.sb;
    if (!sa || !sb) return;
    e.preventDefault();
    e.stopPropagation();   // don't let the canvas start a model rotation
    const startVal = state.measures[rec.key];
    if (rec.center) {
      // Thigh: simple horizontal drag (right = increase, left = decrease).
      dimDrag = { mode: 'thigh', key: rec.key, rec, startX: e.clientX, startVal };
    } else {
      const dragged = which === 'a' ? sa : sb;
      const anchor  = which === 'a' ? sb : sa;
      const dx = dragged.x - anchor.x, dy = dragged.y - anchor.y;
      const lenPx = Math.hypot(dx, dy);
      if (lenPx < 1) return;
      dimDrag = {
        mode: 'linear', key: rec.key, rec,
        startX: e.clientX, startY: e.clientY,
        dirX: dx / lenPx, dirY: dy / lenPx, cmPerPx: startVal / lenPx, startVal,
      };
    }
    try { e.target.setPointerCapture(e.pointerId); } catch (_) {}
    window.addEventListener('pointermove', onDimDragMove);
    window.addEventListener('pointerup', endDimDrag);
  }

  function ensureDimDom() {
    dimOverlay = dimOverlay || $('#dimOverlay');
    if (!dimOverlay || dims.length) return;
    dimSvg = svgEl('svg', 'dim-svg');
    dimSvg.setAttribute('preserveAspectRatio', 'none');
    dimOverlay.appendChild(dimSvg);
    DIM_DEFS.forEach((def) => {
      const isThigh = def.key === 'thigh';
      const g = svgEl('g', 'dim-g');
      // Straight dims use a <line>; the thigh uses a <path> tracing the outline.
      // Each has a wide, transparent twin as the hover/drag hit target.
      let line = null, hit = null, path = null, hitPath = null, hitEl;
      if (isThigh) {
        hitPath = svgEl('path', 'dim-hit-path');
        path = svgEl('path', 'dim-path');
        g.append(hitPath, path);
        hitEl = hitPath;
      } else {
        hit = svgEl('line', 'dim-hit');
        line = svgEl('line', 'dim-line');
        g.append(hit, line);
        hitEl = hit;
      }
      const dotA = svgEl('circle', 'dim-dot'); dotA.setAttribute('r', '4.5');
      const dotB = svgEl('circle', 'dim-dot'); dotB.setAttribute('r', '4.5');
      // Wide, transparent grab targets over each bullet — drag to change the param.
      const grabA = svgEl('circle', 'dim-grab'); grabA.setAttribute('r', '13');
      const grabB = svgEl('circle', 'dim-grab'); grabB.setAttribute('r', '13');
      g.append(dotA, dotB, grabA, grabB);
      dimSvg.appendChild(g);
      const label = document.createElement('div');
      label.className = 'dim-label';
      const valEl = document.createElement('span');
      valEl.className = 'dim-label-val';
      label.appendChild(valEl);
      dimOverlay.appendChild(label);
      const rec = { key: def.key, hoverCount: 0, sa: null, sb: null, center: null,
        el: { g, hit, line, path, hitPath, dotA, dotB, grabA, grabB, label, valEl } };
      // Hovering the line/outline OR either bullet lights it up and shows the value.
      [hitEl, grabA, grabB].forEach((t) => {
        t.addEventListener('mouseenter', () => { rec.hoverCount++; });
        t.addEventListener('mouseleave', () => { rec.hoverCount = Math.max(0, rec.hoverCount - 1); });
      });
      // Drag a bullet → that endpoint. Drag the line/outline → whichever bullet is
      // nearer (so the direction logic matches the end you grabbed toward).
      grabA.addEventListener('pointerdown', (e) => startDimDrag(rec, 'a', e));
      grabB.addEventListener('pointerdown', (e) => startDimDrag(rec, 'b', e));
      hitEl.addEventListener('pointerdown', (e) => {
        if (!rec.sa || !rec.sb || !dimSvg) return;
        const r = dimSvg.getBoundingClientRect();
        const px = e.clientX - r.left, py = e.clientY - r.top;
        const da = (px - rec.sa.x) ** 2 + (py - rec.sa.y) ** 2;
        const db = (px - rec.sb.x) ** 2 + (py - rec.sb.y) ** 2;
        startDimDrag(rec, da <= db ? 'a' : 'b', e);
      });
      dims.push(rec);
    });
  }

  const setSeg = (line, x1, y1, x2, y2) => {
    line.setAttribute('x1', x1.toFixed(1)); line.setAttribute('y1', y1.toFixed(1));
    line.setAttribute('x2', x2.toFixed(1)); line.setAttribute('y2', y2.toFixed(1));
  };
  const setDot = (c, x, y) => { c.setAttribute('cx', x.toFixed(1)); c.setAttribute('cy', y.toFixed(1)); };
  const hideDim = (el) => { el.g.style.opacity = '0'; el.label.style.opacity = '0'; };

  // Thigh segment: project EVERY vertex of the TighUI line mesh (morphed by its
  // live Scale influence) to screen, then stitch the LINES edges into an SVG path
  // so the UI outline matches the 3D shape exactly. Like the height line, it's
  // mirrored across the sagittal plane onto the half facing AWAY from the camera
  // (flips with rotation). `a`/`b` are the gap bullets, `center` the centroid
  // (radial drag pivot). `projWorld` takes a WORLD point.
  function thighSeg(projWorld, MR, camPos) {
    const t = thighUI;
    if (!t || !t.mesh) return null;
    t.mesh.computeWorldMatrix(true);
    const MW = t.mesh.getWorldMatrix();
    const invMR = BABYLON.Matrix.Invert(MR);
    const inf = (t.scaleTarget && isFinite(t.scaleTarget.influence)) ? t.scaleTarget.influence : 0;
    // Morphed centroid (mesh-local) — used for the mirror test + the pivot.
    _tv.copyFrom(t.scaleCentroid).subtractInPlace(t.basisCentroid).scaleInPlace(inf).addInPlace(t.basisCentroid);
    const cMesh = _tv.clone();
    BABYLON.Vector3.TransformCoordinatesToRef(cMesh, MW, _tw);          // centroid world
    const cWorldDist = BABYLON.Vector3.DistanceSquared(_tw, camPos);
    const cLocal = BABYLON.Vector3.TransformCoordinates(_tw, invMR);     // → modelRoot-local
    const cMirror = BABYLON.Vector3.TransformCoordinates(new BABYLON.Vector3(-cLocal.x, cLocal.y, cLocal.z), MR);
    const mirror = BABYLON.Vector3.DistanceSquared(cMirror, camPos) > cWorldDist;
    // Bake the optional reflection (across modelRoot-local X=0) into one matrix.
    const Mfinal = mirror
      ? MW.multiply(invMR).multiply(BABYLON.Matrix.Scaling(-1, 1, 1)).multiply(MR)
      : MW;
    const b = t.basis, sp = t.scalePos, P = t.proj;
    for (let vi = 0; vi < t.vertexCount; vi++) {
      const i = 3 * vi;
      let x = b[i], y = b[i + 1], z = b[i + 2];
      if (sp) { x += inf * (sp[i] - x); y += inf * (sp[i + 1] - y); z += inf * (sp[i + 2] - z); }
      _tv.set(x, y, z);
      BABYLON.Vector3.TransformCoordinatesToRef(_tv, Mfinal, _tw);
      P[vi] = projWorld(_tw);
    }
    const idx = t.indices;
    let dstr = '';
    for (let k = 0; k + 1 < idx.length; k += 2) {
      const p0 = P[idx[k]], p1 = P[idx[k + 1]];
      if (p0 && p1) dstr += 'M' + p0.x.toFixed(1) + ' ' + p0.y.toFixed(1) + 'L' + p1.x.toFixed(1) + ' ' + p1.y.toFixed(1);
    }
    BABYLON.Vector3.TransformCoordinatesToRef(cMesh, Mfinal, _tw);       // centroid → screen
    return { pathD: dstr, a: P[t.gapA], b: P[t.gapB], center: projWorld(_tw), val: state.measures.thigh };
  }

  // Project the dog's saved vertices and draw the three measurement lines.
  // Runs after scene.render() so the camera's transform matrix is current.
  function projectDimensions() {
    dimOverlay = dimOverlay || $('#dimOverlay');
    if (!dimOverlay || !modelRoot) return;
    // Only show while customizing, once the dog is solved, and while the ruler
    // toggle is on. The measures work with OR without the dog (the dog's vertices
    // are still solved when it's hidden), so this no longer keys off dog view.
    if (state.screen !== 'steps' || !dog || !dog.ready || !state.measuresVisible) {
      if (dimOverlay.style.display !== 'none') dimOverlay.style.display = 'none';
      if (dimDrag) endDimDrag();
      return;
    }
    if (dimOverlay.style.display === 'none') dimOverlay.style.display = '';
    ensureDimDom();

    const hw = engine.getRenderWidth(), hh = engine.getRenderHeight();
    if (!hw || !hh) return;
    const toCss = engine.getHardwareScalingLevel();
    const vp = camera.viewport.toGlobal(hw, hh);
    const tm = scene.getTransformMatrix();
    const idM = DIM_IDENTITY;
    const camPos = camera.position;
    const fwd = camera.getDirection(BABYLON.Axis.Z);
    modelRoot.computeWorldMatrix(true);
    const MR = modelRoot.getWorldMatrix();

    // Local (modelRoot-frame) → world; mirror reflects across local X = 0.
    const toWorld = (pLocal) => BABYLON.Vector3.TransformCoordinates(pLocal, MR);
    const mirrorLocal = (pLocal) => new BABYLON.Vector3(-pLocal.x, pLocal.y, pLocal.z);
    const dist2 = (p) => BABYLON.Vector3.DistanceSquared(p, camPos);

    // Which mirror half faces the camera (proxy: the height vertex). Length sits
    // on that NEAR half; the height line goes on the OPPOSITE half so the two
    // never share a screen region (they'd otherwise overlap at the shared withers
    // vertex and fight for hover). Both flip together as the model rotates, so
    // the height stays on the opposite side from length in any view.
    const hL = dog.localFinal.height;
    const useMirror = dist2(toWorld(mirrorLocal(hL))) < dist2(toWorld(hL));
    const near = (role) => (useMirror ? mirrorLocal(dog.localFinal[role]) : dog.localFinal[role]);
    const far  = (role) => (useMirror ? dog.localFinal[role] : mirrorLocal(dog.localFinal[role]));

    const heightNear = near('height');   // length anchors here (near half)
    const lengthL    = near('length');
    const heightFar  = far('height');     // the height line lives on the far half
    // Height is measured withers → ground at the model origin (local Y = 0),
    // straight down below the (far-half) withers vertex.
    const floorFar   = new BABYLON.Vector3(heightFar.x, 0, heightFar.z);
    const widthA     = dog.localFinal.width;
    const widthB     = mirrorLocal(widthA);

    const projWorld = (w) => {
      if (BABYLON.Vector3.Dot(w.subtract(camPos), fwd) <= 0) return null;
      const sp = BABYLON.Vector3.Project(w, idM, tm, vp);
      return { x: sp.x * toCss, y: sp.y * toCss };
    };
    const proj = (pLocal) => projWorld(toWorld(pLocal));

    const segs = {
      height: { a: proj(floorFar),   b: proj(heightFar), val: state.measures.height },
      length: { a: proj(heightNear), b: proj(lengthL),   val: state.measures.length },
      width:  { a: proj(widthA),     b: proj(widthB),    val: state.measures.width },
      thigh:  thighSeg(projWorld, MR, camPos),
    };
    dims.forEach((d) => {
      const s = segs[d.key], el = d.el;
      if (!s || !s.a || !s.b) { hideDim(el); d.sa = d.sb = d.center = null; return; }
      if (d.key === 'thigh') {
        if (!s.pathD) { hideDim(el); d.sa = d.sb = d.center = null; return; }
        el.path.setAttribute('d', s.pathD);
        el.hitPath.setAttribute('d', s.pathD);
      } else {
        setSeg(el.line, s.a.x, s.a.y, s.b.x, s.b.y);
        setSeg(el.hit,  s.a.x, s.a.y, s.b.x, s.b.y);
      }
      setDot(el.dotA, s.a.x, s.a.y);
      setDot(el.dotB, s.b.x, s.b.y);
      setDot(el.grabA, s.a.x, s.a.y);
      setDot(el.grabB, s.b.x, s.b.y);
      // Remember the endpoints (CSS px) so a grab can anchor to them. `center`
      // (thigh only) is the radial drag pivot — null for the straight dims.
      d.sa = { x: s.a.x, y: s.a.y };
      d.sb = { x: s.b.x, y: s.b.y };
      d.center = s.center || null;
      // Dimmed by default; lit (value shown) while hovering the line/bullets or
      // while this dimension is being dragged.
      const lit = d.hoverCount > 0 || (dimDrag && dimDrag.rec === d);
      el.g.style.opacity = lit ? '1' : '0.5';
      el.label.style.opacity = lit ? '1' : '0';
      // Label at the centroid for the thigh oval, else the line midpoint.
      const lx = s.center ? s.center.x : (s.a.x + s.b.x) / 2;
      const ly = s.center ? s.center.y : (s.a.y + s.b.y) / 2;
      el.label.style.left = lx + 'px';
      el.label.style.top  = ly + 'px';
      el.valEl.textContent = formatVal(s.val) + ' ' + state.unit;
    });
  }

  // ============ DOG (parametric companion mesh) ============
  // petwheelsDog.glb is half a dog (the −X sagittal half), placed at the same
  // origin as the wheelchair chassis and mirrored by the same plane. It carries
  // 4 single-vertex color markers (Height/Width/Length/Ground) and 4 morph
  // targets (Height, Length, Width, Scale). We parse the glb ourselves (Babylon
  // only loads COLOR_0) to recover the marker vertices + their morph deltas, then
  // solve the morph weights so the measured distances match the user's params:
  //   • Scale  = the chair's normalized thigh-scale weight (bulk follows chair).
  //   • Width  = solved so the centre-most vertex sits on the mirror plane
  //             (X=0), keeping the mirrored seam closed — not tied to the param.
  //   • Height = solved so the ground vertex (paw bottom) sits on the floor (Y=0).
  //   • Length = |height vertex − length vertex| = length param.
  // Everything is solved in modelRoot-local units.
  let dog = null;
  const DOG_UNIT  = 0.01;   // metres per cm (world is metres; params are cm). Tunable.
  const DOG_WMIN  = -0.5;   // morph-weight clamp (allow mild extrapolation to hit targets)
  const DOG_WMAX  = 2.0;
  const dogNorm = (s) => (s || '').toLowerCase().replace(/[-_\s]/g, '');
  const clampW = (x) => Math.max(DOG_WMIN, Math.min(DOG_WMAX, isFinite(x) ? x : 0));

  // Parse the dog glb binary: recover the 3 color-marked vertices, their base
  // positions and per-morph deltas (sparse-aware). Returns { roles, markers }:
  //   • markers — by color index (COLOR_0/1/2 = Height/Width/Length, the Blender
  //     attribute order); these are the overlay's measurement anchors.
  //   • roles   — by dominant morph; these are the vertices the solver drives.
  // The two differ: a marker isn't necessarily moved most by its own morph.
  async function parseDogMarkers(url) {
    const ab = await (await fetch(url)).arrayBuffer();
    const dv = new DataView(ab);
    const total = dv.getUint32(8, true);
    let off = 12, json = null, binOffset = 0;
    while (off < total) {
      const clen = dv.getUint32(off, true), ctype = dv.getUint32(off + 4, true);
      if (ctype === 0x4E4F534A) json = JSON.parse(new TextDecoder().decode(new Uint8Array(ab, off + 8, clen)));
      else if (ctype === 0x004E4942) binOffset = off + 8;
      off += 8 + clen;
    }
    if (!json) return null;
    const g = json;
    const prim = g.meshes[0].primitives[0];
    const names = (g.meshes[0].extras && g.meshes[0].extras.targetNames) || [];
    const ncOf = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
    const cSize = { 5120: 1, 5121: 1, 5122: 2, 5123: 2, 5125: 4, 5126: 4 };
    const readC = (p, ct) => {
      switch (ct) {
        case 5126: return dv.getFloat32(p, true);
        case 5125: return dv.getUint32(p, true);
        case 5123: return dv.getUint16(p, true);
        case 5121: return dv.getUint8(p);
        case 5122: return dv.getInt16(p, true);
        case 5120: return dv.getInt8(p);
      }
      return 0;
    };
    const accVec3 = (ai, vi) => {
      const a = g.accessors[ai], nc = ncOf[a.type];
      let v = [0, 0, 0];
      if (a.bufferView != null) {
        const bv = g.bufferViews[a.bufferView];
        const stride = bv.byteStride || cSize[a.componentType] * nc;
        const base = binOffset + (bv.byteOffset || 0) + (a.byteOffset || 0) + vi * stride;
        v = [dv.getFloat32(base, true), dv.getFloat32(base + 4, true), dv.getFloat32(base + 8, true)];
      }
      if (a.sparse) {
        const s = a.sparse;
        const ibv = g.bufferViews[s.indices.bufferView], ict = s.indices.componentType, ib = cSize[ict];
        const ibase = binOffset + (ibv.byteOffset || 0) + (s.indices.byteOffset || 0);
        const vbv = g.bufferViews[s.values.bufferView];
        const vbase = binOffset + (vbv.byteOffset || 0) + (s.values.byteOffset || 0);
        for (let k = 0; k < s.count; k++) {
          if (readC(ibase + k * ib, ict) === vi) {
            const p = vbase + k * 4 * nc;
            v = [dv.getFloat32(p, true), dv.getFloat32(p + 4, true), dv.getFloat32(p + 8, true)];
            break;
          }
        }
      }
      return v;
    };
    // brightest vertex (max R+G+B) in a COLOR accessor = the white marker
    const markedVi = (ai) => {
      const a = g.accessors[ai], nc = ncOf[a.type], bv = g.bufferViews[a.bufferView];
      const cs = cSize[a.componentType], stride = bv.byteStride || cs * nc;
      const base = binOffset + (bv.byteOffset || 0) + (a.byteOffset || 0);
      let bestVi = 0, best = -Infinity;
      for (let vi = 0; vi < a.count; vi++) {
        let sum = 0;
        for (let c = 0; c < Math.min(nc, 3); c++) sum += readC(base + vi * stride + c * cs, a.componentType);
        if (sum > best) { best = sum; bestVi = vi; }
      }
      return bestVi;
    };
    const POS = prim.attributes.POSITION;
    const V = (a) => new BABYLON.Vector3(a[0], a[1], a[2]);
    const mag = (a) => Math.hypot(a[0], a[1], a[2]);
    // Blender color-attribute order is HeightColor, WidthColor, LengthColor,
    // GroundColor, so the exported COLOR_0..3 map to these roles by index. The
    // overlay anchors + height solve MUST use this order — the morph-magnitude
    // heuristic below does NOT recover it (e.g. the front height marker is the
    // vertex the Length morph stretches the most). GroundColor is the bottom of
    // the paw; (height marker → ground marker) is the true height span.
    const SEMANTIC_BY_INDEX = ['height', 'width', 'length', 'ground'];
    const colorKeys = Object.keys(prim.attributes)
      .filter((k) => /^COLOR_/.test(k))
      .sort((a, b) => (+a.split('_')[1]) - (+b.split('_')[1]));
    const roles = {};    // morph-control vertices, for the length/width solve (by dominant morph)
    const markers = {};  // semantic measurement anchors, for the overlay + height solve (by color index)
    colorKeys.forEach((k, idx) => {
      const vi = markedVi(prim.attributes[k]);
      const d = {};
      prim.targets.forEach((t, ti) => { d[names[ti] || ('M' + ti)] = accVec3(t.POSITION, vi); });
      const entry = {
        vi, base: V(accVec3(POS, vi)),
        d: { Height: V(d.Height || [0,0,0]), Length: V(d.Length || [0,0,0]),
             Width: V(d.Width || [0,0,0]), Scale: V(d.Scale || [0,0,0]) },
      };
      // Overlay: which measurement this marker annotates (explicit Blender order).
      const sem = SEMANTIC_BY_INDEX[idx];
      if (sem) markers[sem] = entry;
      // Solver: which morph drives this vertex (so the length/width weight solve
      // can move it). The ground marker is overlay/height-solve only — keep it
      // out of the heuristic so it can't clobber a length/width role.
      if (sem && sem !== 'ground') {
        const cand = [['height', mag(d.Height || [0,0,0])],
                      ['length', mag(d.Length || [0,0,0])],
                      ['width',  mag(d.Width  || [0,0,0])]].sort((x, y) => y[1] - x[1]);
        roles[cand[0][0]] = entry;
      }
    });
    return { roles, markers };
  }

  // Wheel-bottom Y in modelRoot-local space (tracks wheel-radius changes).
  function dogFloorLocalY(MRinv) {
    let minY = Infinity;
    const t = new BABYLON.Vector3();
    ['Tire', 'Rim', 'Tire_mir', 'Rim_mir'].forEach((nm) => {
      const m = scene.getMeshByName(nm);
      if (!m) return;
      m.computeWorldMatrix(true);
      try { m.refreshBoundingInfo({ applyMorph: true }); } catch (_) {}
      const cs = m.getBoundingInfo().boundingBox.vectorsWorld;
      for (let i = 0; i < cs.length; i++) {
        BABYLON.Vector3.TransformCoordinatesToRef(cs[i], MRinv, t);
        if (t.y < minY) minY = t.y;
      }
    });
    return isFinite(minY) ? minY : 0;
  }

  // Solve the dog's morph weights to match the current params, then store the
  // marker vertices in modelRoot-local space for the overlay + mirror the half.
  function updateDog() {
    if (!dog || !dog.mesh) return;
    const m = state.measures;
    const UNIT = dog.UNIT || DOG_UNIT;          // live-tunable: PW.dog.UNIT = …; PW.updateDog()
    const FLOOR_OFF = dog.floorOffset || 0;     // live-tunable nudge for the floor reference
    const w = (window.PW && window.PW.computeWeights) ? window.PW.computeWeights(m) : null;
    const mesh = dog.mesh;
    modelRoot.computeWorldMatrix(true);
    const MR = modelRoot.getWorldMatrix();
    const MRinv = BABYLON.Matrix.Invert(MR);
    mesh.computeWorldMatrix(true);
    const Mdl = mesh.getWorldMatrix().multiply(MRinv);   // dog-mesh-local → modelRoot-local

    dog.floorLocalY = dogFloorLocalY(MRinv);

    const R = dog.roles, Rm = dog.markers;
    const T = (v) => BABYLON.Vector3.TransformCoordinates(v, Mdl);
    const N = (v) => BABYLON.Vector3.TransformNormal(v, Mdl);
    const deltas = (e) => ({ Height: N(e.d.Height), Length: N(e.d.Length), Width: N(e.d.Width), Scale: N(e.d.Scale) });
    const baseL = {}, dL = {};   // solver: morph-control vertices (length/width)
    const baseM = {}, dM = {};   // overlay + height solve: semantic measurement markers
    ['height', 'length', 'width'].forEach((role) => {
      baseL[role] = T(R[role].base);   dL[role] = deltas(R[role]);
    });
    ['height', 'length', 'width', 'ground'].forEach((role) => {
      baseM[role] = T(Rm[role].base);  dM[role] = deltas(Rm[role]);
    });

    // 1) Scale — chair's normalized scale weight.
    const wS = w ? w.scale : 0;
    // 2) Width — keep the mirrored seam closed. The dog is the half on `side` of
    //    the sagittal plane (modelRoot-local X=0); its mirror reflects across it.
    //    As Scale/Length deform the body the centre seam drifts off the plane,
    //    leaving the gap/overlap you see when the halves don't meet. Solve wW so
    //    the centre-most vertex (nearest the plane from the dog's side) lands
    //    exactly on X=0, i.e. max over vertices of s·X(v,wW) == 0. X is linear in
    //    wW (X = A + wW·B), so the binding vertex is the smallest -A/B with B>0.
    const side = (baseM.width.x >= 0) ? 1 : -1;
    let wW = 0;
    if (dog.basisPos && dog.widthPos) {
      const basis = dog.basisPos, wp = dog.widthPos, sp = dog.scalePos;
      // modelRoot-local X is row 0 of Mdl: X = m0·x + m4·y + m8·z + m12.
      const mm = Mdl.m, m0 = mm[0], m4 = mm[4], m8 = mm[8], m12 = mm[12];
      // Find the centre-most vertex = the one nearest the mirror plane from the
      // dog's side (minimum side·X). X at wW=0 is `seamA`, its rate of change per
      // unit width weight is `seamB`. Then wW puts it exactly on the plane (X=0).
      let seamSX = Infinity, seamA = 0, seamB = 0;
      for (let i = 0, n = basis.length; i < n; i += 3) {
        const bx = basis[i], by = basis[i + 1], bz = basis[i + 2];
        // Mesh-local position after the known Scale morph (Length is Z-dominant,
        // so its X effect on the seam is negligible and it's solved next anyway).
        const px = sp ? bx + wS * (sp[i] - bx) : bx;
        const py = sp ? by + wS * (sp[i + 1] - by) : by;
        const pz = sp ? bz + wS * (sp[i + 2] - bz) : bz;
        const Ax = m0 * px + m4 * py + m8 * pz + m12;                        // X at wW=0
        const sx = side * Ax;
        if (sx < seamSX) {
          seamSX = sx;
          seamA = Ax;
          seamB = m0 * (wp[i] - bx) + m4 * (wp[i + 1] - by) + m8 * (wp[i + 2] - bz); // dX/dwW
        }
      }
      if (Math.abs(seamB) > 1e-9) wW = clampW(-seamA / seamB);
    }
    // 3) Height — the Height morph extends the leg so the GroundColor marker
    //    (bottom of the paw, markers.ground) lands on the floor plane, i.e. at
    //    the same Y as the height line's bottom bullet (local Y = 0). The body
    //    rides up with the chair as the height param grows, so the paw must
    //    reach further down to stay planted — that's what makes the dog taller.
    //    Solve wH so groundY(wH) == FLOOR_OFF (the floor). Only Scale + Height
    //    move the ground marker in Y (Length/Width deltas are 0 there).
    const groundBaseY = baseM.ground.y + wS * dM.ground.Scale.y;
    const groundSlope = dM.ground.Height.y;                        // < 0: paw drops as wH rises
    const wH = clampW(Math.abs(groundSlope) > 1e-9 ? (FLOOR_OFF - groundBaseY) / groundSlope : 0);
    // 4) Length — |heightVtx − lengthVtx| = length·UNIT. lengthVtx is linear in
    //    wL, so |(C − HP) + wL·D|² = target² is a quadratic in wL.
    const HP = baseL.height.clone()
      .addInPlace(dL.height.Scale.scale(wS))
      .addInPlace(dL.height.Width.scale(wW))
      .addInPlace(dL.height.Height.scale(wH));
    const C = baseL.length.clone()
      .addInPlace(dL.length.Scale.scale(wS))
      .addInPlace(dL.length.Width.scale(wW));
    const D = dL.length.Length;
    const E = C.subtract(HP);
    const target = m.length * UNIT;
    const qa = D.lengthSquared(), qb = 2 * BABYLON.Vector3.Dot(E, D), qc = E.lengthSquared() - target * target;
    let wL = 0;
    if (qa > 1e-12) {
      const disc = qb * qb - 4 * qa * qc;
      if (disc >= 0) {
        const sq = Math.sqrt(disc);
        const r1 = (-qb + sq) / (2 * qa), r2 = (-qb - sq) / (2 * qa);
        const pool = [r1, r2].filter((r) => isFinite(r));
        const inR = pool.filter((r) => r >= DOG_WMIN && r <= DOG_WMAX);
        (inR.length ? inR : pool).sort((x, y) => Math.abs(x - 0.5) - Math.abs(y - 0.5));
        wL = pool.length ? (inR.length ? inR[0] : pool[0]) : 0;
      } else {
        wL = -qb / (2 * qa);   // unreachable target → closest distance
      }
    }
    wL = clampW(wL);

    // Apply influences on the dog's own morph targets.
    const setInf = (name, v) => { const t = dog.targets[name]; if (t) t.influence = v; };
    setInf('scale', wS); setInf('height', wH); setInf('length', wL); setInf('width', wW);
    dog.weights = { wS, wH, wL, wW };

    // Store the three SEMANTIC marker vertices (Blender Height/Width/LengthColor)
    // in modelRoot-local space for the overlay. These are distinct from the
    // morph-control vertices the solver used above, but follow the same solved
    // weights — applying the global morph weights to each marker's own deltas
    // gives its true post-morph position.
    ['height', 'length', 'width', 'ground'].forEach((role) => {
      dog.localFinal[role].copyFrom(baseM[role])
        .addInPlace(dM[role].Scale.scale(wS))
        .addInPlace(dM[role].Height.scale(wH))
        .addInPlace(dM[role].Length.scale(wL))
        .addInPlace(dM[role].Width.scale(wW));
    });

    // Mirror instance: copy the dog's in-root transform (mirrorRoot's −X scaling
    // reflects it), matching the wheelchair's mirror update.
    if (dog.inst) {
      const sRoot = mesh.getWorldMatrix().multiply(MRinv);
      const ts = new BABYLON.Vector3(), tq = new BABYLON.Quaternion(), tt = new BABYLON.Vector3();
      sRoot.decompose(ts, tq, tt);
      dog.inst.position.copyFrom(tt);
      dog.inst.rotationQuaternion = dog.inst.rotationQuaternion || new BABYLON.Quaternion();
      dog.inst.rotationQuaternion.copyFrom(tq);
      dog.inst.scaling.copyFrom(ts);
      dog.inst.computeWorldMatrix(true);
    }
  }

  // Load + wire the dog: parse markers, append to scene, recolor white, parent
  // to the chassis origin, mirror, and hook into the rig's update cycle.
  async function setupDog() {
    try {
      const parsed = await parseDogMarkers('assets/petwheelsDog.glb');
      const roles = parsed && parsed.roles, markers = parsed && parsed.markers;
      if (!roles || !roles.height || !roles.length || !roles.width
          || !markers || !markers.height || !markers.length || !markers.width || !markers.ground) {
        console.warn('[dog] marker parse incomplete — skipping', parsed);
        return;
      }
      await BABYLON.SceneLoader.AppendAsync('assets/', 'petwheelsDog.glb', scene);
      let mesh = scene.getMeshByName('PetWheelsDog-3');
      if (!mesh || !mesh.morphTargetManager) {
        // Fall back to any newly-loaded mesh that looks like the dog (has the
        // 4-target morph manager), in case the exporter renamed the node.
        mesh = scene.meshes.find((x) => /dog/i.test(x.name) && x.morphTargetManager
          && x.morphTargetManager.numTargets >= 3) || mesh;
      }
      if (!mesh) { console.warn('[dog] dog mesh not found after load'); return; }

      // Drop the vertex colors (COLOR_0's white marker would otherwise tint the
      // mesh) and apply the requested white material.
      try { mesh.removeVerticesData(BABYLON.VertexBuffer.ColorKind); } catch (_) {}
      mesh.hasVertexAlpha = false;
      const mat = new BABYLON.PBRMaterial('dogMat', scene);
      mat.albedoColor = new BABYLON.Color3(1, 1, 1);
      mat.metallic = 0.5; mat.roughness = 0.5; mat.backFaceCulling = false;
      mesh.material = mat;

      const PW = (window.PW && window.PW.nodes) || {};
      const petwheels = PW.petwheels, mirrorRoot = PW.mirrorRoot;
      const dogRoot = mesh.parent;   // gltf __root__ for the dog import
      if (petwheels) {
        mesh.parent = petwheels;     // share the chassis origin
        // The dog glb authored PetWheelsDog-3 at the SAME node translation the
        // Petwheels group already carries (~[0.065, 0.201, 0]). Reparenting kept
        // the dog's local translation, so that offset got applied twice — the dog
        // landed ~0.2 m too high in Y. Zero the local translation so the dog's
        // origin coincides exactly with the Petwheels/main-group origin. (Keep
        // scaling + rotation — only the doubled translation is wrong.) This is
        // also what un-pins the height/width morph solves, which were saturating
        // because the inflated marker Y/X sat outside the reachable range.
        mesh.position.set(0, 0, 0);
      }
      if (dogRoot && dogRoot !== petwheels && dogRoot.name === '__root__'
          && (!dogRoot.getChildMeshes || dogRoot.getChildMeshes().length === 0)) {
        try { dogRoot.dispose(); } catch (_) {}
      }

      let inst = null;
      if (mirrorRoot) {
        inst = mesh.createInstance('PetWheelsDog_mir');
        inst.parent = mirrorRoot;
        inst.rotationQuaternion = new BABYLON.Quaternion();
        inst.alwaysSelectAsActiveMesh = true;
      }

      const mgr = mesh.morphTargetManager;
      const targets = {};
      if (mgr) for (let i = 0; i < mgr.numTargets; i++) {
        const t = mgr.getTarget(i);
        targets[dogNorm(t.name)] = t;
      }

      dog = {
        mesh, inst, roles, markers, targets,
        localFinal: { height: new BABYLON.Vector3(), length: new BABYLON.Vector3(), width: new BABYLON.Vector3(), ground: new BABYLON.Vector3() },
        // Cached vertex data for the seam (width) solve — basis positions and the
        // Scale/Width morph target positions (deltas = target − basis).
        basisPos: mesh.getVerticesData(BABYLON.VertexBuffer.PositionKind),
        scalePos: targets.scale ? targets.scale.getPositions() : null,
        widthPos: targets.width ? targets.width.getPositions() : null,
        floorLocalY: 0, weights: {}, ready: false,
        UNIT: DOG_UNIT, floorOffset: 0,   // live-tunable from the console
      };

      // Hook into the rig so every slider change re-solves the dog. Guard the
      // dog step so a solver error can never break the wheelchair's update.
      if (rig && typeof rig.update === 'function') {
        const orig = rig.update;
        rig.update = function () {
          orig.apply(this, arguments);
          try { updateDog(); } catch (e) { console.error('[dog] update failed', e); }
        };
      }
      updateDog();
      dog.ready = true;
      window.PW = window.PW || {};
      window.PW.dog = dog;
      window.PW.updateDog = updateDog;
      // Honour the current view tab and frame instantly (no fly-in on load).
      applyDogVisibility(true);
      console.log('[dog] ready', {
        roles: Object.keys(roles).reduce((o, k) => (o[k] = roles[k].vi, o), {}),
        targets: Object.keys(targets), floorLocalY: +dog.floorLocalY.toFixed(4),
        weights: dog.weights,
      });
    } catch (e) {
      console.error('[dog] setup failed', e);
    }
  }

  // Smooth tween helper for accumulatedY / peekX / radius
  const tween = (fromGetter, toValue, setter, duration = 320) => {
    const start = fromGetter();
    const t0 = performance.now();
    const step = () => {
      const t = Math.min(1, (performance.now() - t0) / duration);
      const ease = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      setter(start + (toValue - start) * ease);
      if (t < 1) requestAnimationFrame(step);
    };
    step();
  };

  // ============ PARAMETRIC RIG ============
  // Drives the .glb from the sliders: morph targets for shape changes, group
  // tracking for re-assembly as parts deform, CPU-snap of the LegSupport's
  // MirrorEdges loop onto the mirror plane, and a mirrored half built from
  // hardware instances of every visible mesh.
  //
  // Coordinate conventions
  //   • Slider values are cm (UI), converted to mm here (×10) to match the
  //     CadQuery params.py thresholds.
  //   • Morph weights are clamped to [0, 1].
  //   • Mirror plane is `rootNode`-local X = 0 — the model's intrinsic sagittal
  //     plane. MirrorRoot reflects across that same plane via scaling.x = -1.
  //     We snap and decompose in rootNode's local frame, not Babylon world,
  //     because rootNode carries the drag/initial-Y rotation.
  //   • Group origins coincide with their reference-mesh centers at basis (a
  //     fact verified from the glb export). We capture the tiny init offset
  //     and replay (target = refCenter + offset) so any future drift is OK.
  //
  // Morph names from the glb (case/dash normalized): Scale, Length,
  // Height_high, Height_low, Radius, Thickness. There is no "Width" morph —
  // Width only shifts the root in X (= half the separation between the
  // mirrored halves; the LegSupport stretches inward to meet the plane).
  function buildRig(scene, rootNode) {
    const PARAM = {
      length:      { min: 200, max: 700 },   // mm — morph Length
      thigh:       { min: 120, max: 600 },   // mm — Scale / Scale_min / Scale_max
      thighMid:    200,                       // mm — basis of the split Scale_min/Scale_max
      heightLow:   { min: 120, max: 250 },   // mm — morph Height_low covers basis..250
      heightHigh:  { min: 250, max: 600 },   // mm — morph Height_high covers 250..max
      heightMid:   250,                       // mm — basis of Height_min/Height_max + Height_low/_high
      radiusMorph: { min:  35, max: 120 },   // mm — morph Radius (params.Manual_Wheel_Radius)
      thickness:   { min: 1.0, max: 2.0 },   // ThicknessFactor — morph Thickness
    };
    const BASE_THIGH = 200;
    const MM_TO_M = 0.001;
    const MIRROR_PLANE_X = 0;        // world X
    const CM_TO_MM = 10;

    const clamp01 = (x) => Math.max(0, Math.min(1, x));
    const lerpInv = (v, a, b) => (v - a) / (b - a);
    // Strip every separator so Height_high / Height-high / "Height high" all
    // collapse to "heighthigh". Keeps the match insensitive to whatever the
    // Blender exporter / user typed in the shape key name.
    const normName = (s) => (s || '').toLowerCase().replace(/[-_\s]/g, '');

    // Wheel radius from Height (params.Auto_Wheel_Radius=True): piecewise.
    const autoWheelRadius = (hmm) =>
      hmm <= 250
        ? 35 + lerpInv(hmm, 100, 250) * (55 - 35)
        : 55 + lerpInv(hmm, 250, 500) * (110 - 55);

    function computeWeights(m) {
      const Lmm = m.length * CM_TO_MM;
      const displayedHmm = m.height * CM_TO_MM;
      const Wmm = m.width  * CM_TO_MM;
      const Tmm = m.thigh  * CM_TO_MM;
      const sf = Tmm / BASE_THIGH;

      // Wheel radius: auto is derived from displayed height (the user-visible
      // value). When the manual toggle is on, a raw offset is layered on top,
      // then R is hard-clamped to [RADIUS_MIN, RADIUS_MAX] (the morph's range).
      // The height compensation uses the *clamped* offset so once R saturates
      // the structure stops compensating too — otherwise the wheel freezes at
      // the cap while the structure keeps shrinking/growing.
      const autoR     = autoWheelRadius(displayedHmm);
      const offsetRaw = m.radiusManual ? (+m.radiusOffset || 0) : 0;
      const R         = Math.max(RADIUS_MIN, Math.min(RADIUS_MAX, autoR + offsetRaw));
      const offsetEff = R - autoR;            // what we actually applied
      const Hmm       = displayedHmm - offsetEff;   // compensated; drives morphs + pivot

      // ---- Scale (thigh) ----
      // Old single "Scale" shape key (on Main, Seat, refs, SideBar, LegSupport,
      // …): basis = 120 mm, weight 1 = 600 mm. Linear across the full range.
      const scale = clamp01(lerpInv(Tmm, PARAM.thigh.min, PARAM.thigh.max));
      // New split "Scale_min" / "Scale_max" (on Arm, ArmHub, WheelCenterRef):
      // basis = 200 mm midpoint. Scale_min: 0→200 mm, 1→120 mm. Scale_max:
      // 0→200 mm, 1→600 mm. The numeric weights differ from the single-key
      // form, but the resulting geometry is the same physical size because
      // each shape key was sculpted relative to its own basis.
      let scaleMin, scaleMax;
      if (Tmm <= PARAM.thighMid) {
        scaleMin = clamp01(lerpInv(Tmm, PARAM.thighMid, PARAM.thigh.min));   // 200 → 0, 120 → 1
        scaleMax = 0;
      } else {
        scaleMin = 0;
        scaleMax = clamp01(lerpInv(Tmm, PARAM.thighMid, PARAM.thigh.max));   // 200 → 0, 600 → 1
      }

      // ---- Length ----
      const length = clamp01(lerpInv(Lmm, PARAM.length.min, PARAM.length.max));

      // ---- Height (basis = 250 mm midpoint) ----
      // Height_low / Height_high (legacy) and Height_min / Height_max (new) are
      // semantically identical pairs — just renamed. Same formula drives both.
      let hlow, hhigh;
      if (Hmm <= PARAM.heightMid) {
        hlow  = clamp01(lerpInv(Hmm, PARAM.heightMid, PARAM.heightLow.min));  // 250 → 0, 120 → 1
        hhigh = 0;
      } else {
        hlow  = 0;
        hhigh = clamp01(lerpInv(Hmm, PARAM.heightMid, PARAM.heightHigh.max)); // 250 → 0, 600 → 1
      }
      const radius    = clamp01(lerpInv(R, PARAM.radiusMorph.min, PARAM.radiusMorph.max));
      const thickness = clamp01(lerpInv(m.thickness, PARAM.thickness.min, PARAM.thickness.max));
      return { scale, scaleMin, scaleMax, length, hlow, hhigh,
               radius, thickness, sf,
               Wmm, Hmm, Tmm, Lmm, R, autoR, displayedHmm };
    }

    // ---- Locate nodes from the glb (names from Blender outliner) ----
    const getNode = (n) => scene.getTransformNodeByName(n) || scene.getMeshByName(n);
    const getMesh = (n) => scene.getMeshByName(n);

    const petwheels       = getNode('Petwheels');
    const armGroup        = getNode('ArmGroup');
    const legGroup        = getNode('LegSupportGroup');
    const mainGroup       = getNode('MainGroup_R');     // not repositioned, but useful for debug
    const sidebarGroup    = getNode('SidebarGroup');
    const wheelGroup      = getNode('Wheel');

    const refUpperLegAxis = getMesh('UpperLegAxisRef');
    const refLegSupport   = getMesh('LegSupportRef');
    const refSideBarCtr   = getMesh('SideBarCenterRef');
    const refWheelCenter  = getMesh('WheelCenterRef');

    if (!petwheels || !armGroup || !legGroup || !sidebarGroup || !wheelGroup
        || !refUpperLegAxis || !refLegSupport || !refSideBarCtr || !refWheelCenter) {
      console.warn('[Petwheels rig] missing nodes — assembly cannot be wired', {
        petwheels: !!petwheels, armGroup: !!armGroup, legGroup: !!legGroup,
        sidebarGroup: !!sidebarGroup, wheelGroup: !!wheelGroup,
        refUpperLegAxis: !!refUpperLegAxis, refLegSupport: !!refLegSupport,
        refSideBarCtr: !!refSideBarCtr, refWheelCenter: !!refWheelCenter,
      });
      return null;
    }

    // ---- Hide reference meshes (they're invisible helpers, not parts) ----
    // Keep them enabled so we can read their morphed bounding boxes.
    const refMeshes = scene.meshes.filter((m) => /Ref$/.test(m.name));
    refMeshes.forEach((m) => { m.isVisible = false; });

    // Visible parts that make up the right half. The mirror creates the left.
    const visibleNames = ['Arm', 'ArmHub', 'LegSupport', 'LegSupportStrap',
                          'Main', 'Seat', 'SideBar', 'SideBarBand_R', 'Rim', 'Tire'];
    const visibleMeshes = visibleNames
      .map(getMesh)
      .filter((m) => !!m);

    // ---- 4 shared style materials ----
    // The .glb arrives with per-mesh materials. We collapse them into 4 PBR
    // slots so the Style step can re-tint groups of parts in one place (one
    // swatch row → one material → many meshes). Defaults are cloned from
    // the FIRST listed mesh's existing material in each slot, so the viewer
    // looks identical to the raw .glb on boot.
    //
    // Add or move a mesh between slots by editing this map — no other code
    // needs to change. Mirror instances follow automatically because they
    // share their source's material.
    const MATERIAL_SLOTS = {
      m1: ['Rim', 'Arm', 'Main', 'SideBarBand_R'],
      m2: ['ArmHub', 'LegSupport'],
      m3: ['SideBar'],
      m4: ['Tire', 'Seat', 'LegSupportStrap'],
    };
    const styleMats = {};
    Object.entries(MATERIAL_SLOTS).forEach(([slot, names]) => {
      const seed = names.map(getMesh).find((m) => m && m.material);
      if (!seed) {
        console.warn('[Petwheels rig] no source material for', slot, names);
        return;
      }
      const src = seed.material;
      const mat = new BABYLON.PBRMaterial('petwheels_' + slot, scene);
      // PBR defaults from the seed mesh. Colors cloned so later swatch
      // edits to mat.albedoColor don't mutate the original .glb material.
      if (src.albedoColor)       mat.albedoColor = src.albedoColor.clone();
      else if (src.diffuseColor) mat.albedoColor = src.diffuseColor.clone();
      if (typeof src.metallic  === 'number') mat.metallic  = src.metallic;
      if (typeof src.roughness === 'number') mat.roughness = src.roughness;
      // Textures (if any) follow along so the boot visual matches the .glb.
      // Refs are shared (not cloned) since textures are heavy and read-only.
      if (src.albedoTexture)   mat.albedoTexture   = src.albedoTexture;
      if (src.metallicTexture) mat.metallicTexture = src.metallicTexture;
      if (src.bumpTexture)     mat.bumpTexture     = src.bumpTexture;
      if (src.ambientTexture)  mat.ambientTexture  = src.ambientTexture;
      if (src.emissiveColor)   mat.emissiveColor   = src.emissiveColor.clone();
      mat.backFaceCulling = false;
      styleMats[slot] = mat;
      names.forEach((name) => {
        const m = getMesh(name);
        if (m) m.material = mat;
      });
    });

    // Backface culling off on every material — the mirror instances inherit the
    // source material, and a hardware-instanced reflection can't flip culling
    // per-instance. Two-sided rendering sidesteps that entirely; normals are
    // already correct because Babylon transforms them by the inverse-transpose
    // of the (reflected) world matrix.
    scene.materials.forEach((mat) => { mat.backFaceCulling = false; });

    // ---- LegSupport: CPU morph + MirrorEdges snap ----
    // The vertex group "MirrorEdges" was exported as vertex color (white = in
    // the group, black = not). We read it once, cache the indices, and disable
    // vertex-color shading so the black verts don't tint the material black.
    // We then disable the GPU morph on this mesh because we need to clamp
    // specific vertex X's after morphing — which means doing morphs on the CPU
    // and writing the final position buffer ourselves.
    const POSITION = BABYLON.VertexBuffer.PositionKind;
    const NORMAL   = BABYLON.VertexBuffer.NormalKind;
    const COLOR    = BABYLON.VertexBuffer.ColorKind;
    const legSupport = getMesh('LegSupport');
    let legCpu = null;
    if (legSupport) {
      const mgr = legSupport.morphTargetManager;
      const findTarget = (predicate) => {
        if (!mgr) return null;
        for (let i = 0; i < mgr.numTargets; i++) {
          const t = mgr.getTarget(i);
          if (predicate(normName(t.name))) return t;
        }
        return null;
      };
      const tScale = findTarget((n) => n === 'scale');
      const tHH    = findTarget((n) => n === 'heighthigh');

      const basisPos = Float32Array.from(legSupport.getVerticesData(POSITION) || []);
      const basisNrm = Float32Array.from(legSupport.getVerticesData(NORMAL)   || []);
      const sPos = tScale ? tScale.getPositions() : null;
      const sNrm = tScale ? tScale.getNormals()   : null;
      const hPos = tHH    ? tHH.getPositions()    : null;
      const hNrm = tHH    ? tHH.getNormals()      : null;

      const sub = (a, b) => {
        if (!a || !b) return null;
        const out = new Float32Array(a.length);
        for (let i = 0; i < a.length; i++) out[i] = a[i] - b[i];
        return out;
      };
      const dScaleP = sub(sPos, basisPos);
      const dScaleN = sub(sNrm, basisNrm);
      const dHHP    = sub(hPos, basisPos);
      const dHHN    = sub(hNrm, basisNrm);

      // White verts = MirrorEdges. COLOR_0 is normalized VEC4 in [0,1].
      const colors = legSupport.getVerticesData(COLOR);
      const whiteIdx = [];
      if (colors) {
        const stride = 4;
        for (let v = 0, k = 0; k < colors.length; v++, k += stride) {
          if (colors[k] > 0.5) whiteIdx.push(v);
        }
      }
      // Drop COLOR_0 entirely so it can't tint the albedo (black verts → black
      // diffuse on PBR materials that auto-pick up vertex colors).
      try { legSupport.removeVerticesData(COLOR); } catch (_) {}
      legSupport.hasVertexAlpha = false;

      // Take CPU ownership of LegSupport's deformation.
      legSupport.morphTargetManager = null;
      legSupport.markVerticesDataAsUpdatable(POSITION, true);
      legSupport.markVerticesDataAsUpdatable(NORMAL,   true);

      const outPos = new Float32Array(basisPos.length);
      const outNrm = new Float32Array(basisNrm.length);

      legCpu = { basisPos, basisNrm, dScaleP, dScaleN, dHHP, dHHN, whiteIdx, outPos, outNrm };

      console.log('[Petwheels rig] LegSupport CPU morph wired:', {
        verts: basisPos.length / 3,
        whiteVerts: whiteIdx.length,
        targets: { scale: !!tScale, heightHigh: !!tHH },
      });
    }

    // ---- Build mirror: instances of every visible mesh, under a -X-scaled root ----
    // MirrorRoot lives under modelRoot so drag rotation applies to both halves.
    const mirrorRoot = new BABYLON.TransformNode('PetwheelsMirror', scene);
    mirrorRoot.parent = rootNode;
    mirrorRoot.scaling = new BABYLON.Vector3(-1, 1, 1);

    const mirrorPairs = visibleMeshes.map((src) => {
      const inst = src.createInstance(src.name + '_mir');
      inst.parent = mirrorRoot;
      inst.rotationQuaternion = inst.rotationQuaternion || new BABYLON.Quaternion();
      // Receive shadows / cast same as source.
      inst.alwaysSelectAsActiveMesh = true;
      return { src, inst };
    });

    // Scratch matrices/vectors reused every update — avoid GC.
    const tmpV     = new BABYLON.Vector3();
    const tmpQ     = new BABYLON.Quaternion();
    const tmpS     = new BABYLON.Vector3();
    const rootInv  = new BABYLON.Matrix();
    const sRoot    = new BABYLON.Matrix();
    const legInRoot = new BABYLON.Matrix();

    // ---- Capture init offset (group origin minus its tracked ref center) ----
    // Done at basis (load time, before any update). It's expected ~zero, but we
    // store it so a re-rig with a slightly displaced origin still works.
    const refCenterWorld = (ref) => {
      ref.computeWorldMatrix(true);
      try { ref.refreshBoundingInfo({ applyMorph: true }); }
      catch (_) { try { ref.refreshBoundingInfo(false, true); } catch (__) {} }
      return ref.getBoundingInfo().boundingBox.centerWorld.clone();
    };
    const captureOffset = (group, ref) => {
      group.computeWorldMatrix(true);
      const go = group.getAbsolutePosition().clone();
      const rc = refCenterWorld(ref);
      return go.subtract(rc);
    };
    const offArm     = captureOffset(armGroup,     refUpperLegAxis);
    const offLeg     = captureOffset(legGroup,     refLegSupport);
    const offSidebar = captureOffset(sidebarGroup, refSideBarCtr);
    // Wheel sits under petwheels (root), tracks WheelCenterRef which lives in
    // ArmGroup, so its offset is captured at the basis ArmGroup transform.
    const offWheel   = captureOffset(wheelGroup,   refWheelCenter);
    console.log('[Petwheels rig] captured group→ref offsets (should all be ~0):', {
      arm: offArm.asArray().map((x) => +x.toFixed(5)),
      leg: offLeg.asArray().map((x) => +x.toFixed(5)),
      sidebar: offSidebar.asArray().map((x) => +x.toFixed(5)),
      wheel: offWheel.asArray().map((x) => +x.toFixed(5)),
    });

    // Position a group so its world origin = refCenter + capturedOffset.
    const positionGroupToRef = (group, ref, off) => {
      const target = refCenterWorld(ref).add(off);
      const parent = group.parent;
      parent.computeWorldMatrix(true);
      const invP = BABYLON.Matrix.Invert(parent.getWorldMatrix());
      const local = BABYLON.Vector3.TransformCoordinates(target, invP);
      group.position.copyFrom(local);
      group.computeWorldMatrix(true);
    };

    // ---- Apply morph influences to every GPU-morphed mesh ----
    function applyInfluences(w) {
      scene.meshes.forEach((mesh) => {
        const mgr = mesh.morphTargetManager;
        if (!mgr) return;
        for (let i = 0; i < mgr.numTargets; i++) {
          const t = mgr.getTarget(i);
          const n = normName(t.name);
          let v;
          switch (n) {
            // Legacy single shape keys (basis = the params.py min for that param).
            case 'scale':      v = w.scale;    break;
            case 'length':     v = w.length;   break;
            // Height: legacy names (Height_low/_high) and renamed (Height_min/_max)
            // share the same numeric weight (basis = 250 mm midpoint).
            case 'heightlow':
            case 'heightmin':  v = w.hlow;     break;
            case 'heighthigh':
            case 'heightmax':  v = w.hhigh;    break;
            // Scale split (basis = 200 mm midpoint), on Arm / ArmHub / WheelCenterRef.
            case 'scalemin':   v = w.scaleMin; break;
            case 'scalemax':   v = w.scaleMax; break;
            case 'radius':
              // Rim's Radius shape key is authored inverted (1=min, 0=max).
              v = (mesh.name === 'Rim') ? (1 - w.radius) : w.radius;
              break;
            case 'thickness':  v = w.thickness; break;
            default: v = null;
          }
          if (v != null) t.influence = v;
        }
      });
    }

    // ---- CPU morph for LegSupport (no clamp yet) ----
    function computeLegSupportMorph(w) {
      if (!legCpu) return;
      const { basisPos, basisNrm, dScaleP, dScaleN, dHHP, dHHN, outPos, outNrm } = legCpu;
      const ws = w.scale, wh = w.hhigh;
      for (let i = 0; i < basisPos.length; i++) {
        outPos[i] = basisPos[i]
          + (dScaleP ? ws * dScaleP[i] : 0)
          + (dHHP    ? wh * dHHP[i]    : 0);
        outNrm[i] = basisNrm[i]
          + (dScaleN ? ws * dScaleN[i] : 0)
          + (dHHN    ? wh * dHHN[i]    : 0);
      }
      // Renormalize per-vertex normals.
      for (let i = 0; i < outNrm.length; i += 3) {
        const x = outNrm[i], y = outNrm[i + 1], z = outNrm[i + 2];
        const m = Math.hypot(x, y, z) || 1;
        outNrm[i] = x / m; outNrm[i + 1] = y / m; outNrm[i + 2] = z / m;
      }
    }

    // ---- Snap MirrorEdges verts of LegSupport onto the mirror plane ----
    // The mirror plane is `rootNode`-local X = 0 (the model's sagittal plane —
    // the same plane MirrorRoot reflects across, since MirrorRoot is a direct
    // child of rootNode with scaling.x = -1). Babylon world X is different
    // from this because rootNode carries the drag/initial-Y rotation, so we
    // use the leg's transform relative to rootNode for the clamp:
    //   resultInRoot.x = p.x*m[0] + p.y*m[4] + p.z*m[8] + m[12]
    // Solve for p.x such that resultInRoot.x = 0. The morphed local (y, z)
    // are picked up from the current outPos so the snap follows the shape.
    function clampLegSupportToPlane() {
      if (!legCpu || !legSupport) return;
      legSupport.computeWorldMatrix(true);
      rootNode.computeWorldMatrix(true);
      rootInv.copyFrom(rootNode.getWorldMatrix());
      rootInv.invert();
      legSupport.getWorldMatrix().multiplyToRef(rootInv, legInRoot);
      const M = legInRoot.m;
      const m0 = M[0], m4 = M[4], m8 = M[8], m12 = M[12];
      if (Math.abs(m0) < 1e-6) return;   // degenerate; bail
      const outPos = legCpu.outPos;
      for (const idx of legCpu.whiteIdx) {
        const k = idx * 3;
        const py = outPos[k + 1];
        const pz = outPos[k + 2];
        outPos[k] = (MIRROR_PLANE_X - (py * m4 + pz * m8 + m12)) / m0;
      }
    }

    // ---- Mirror update: copy each source's in-root matrix into its instance ----
    function updateMirror() {
      rootNode.computeWorldMatrix(true);
      rootInv.copyFrom(rootNode.getWorldMatrix());
      rootInv.invert();
      for (const { src, inst } of mirrorPairs) {
        src.computeWorldMatrix(true);
        src.getWorldMatrix().multiplyToRef(rootInv, sRoot);
        sRoot.decompose(tmpS, tmpQ, tmpV);
        inst.position.copyFrom(tmpV);
        inst.rotationQuaternion.copyFrom(tmpQ);
        inst.scaling.copyFrom(tmpS);
        inst.computeWorldMatrix(true);     // force-sync so frameCamera sees us
      }
    }

    // DOM handles for the live radius readouts (cached once at setup).
    const elValRadius     = document.getElementById('valRadius');
    const elValAutoRadius = document.getElementById('valAutoRadius');

    // ---- The main update — call on every slider change ----
    function update() {
      const w = computeWeights(state.measures);

      // Live radius display: effective R in cm/in (1 decimal). The value
      // field is an <input>, so write to .value — and skip the write if the
      // user is mid-edit so we don't stomp on them.
      if (elValRadius && document.activeElement !== elValRadius) {
        elValRadius.value = formatRadius(w.R);
      }
      if (elValAutoRadius) elValAutoRadius.textContent = formatRadius(w.autoR);

      // 1) Influences on GPU-morphed meshes (everyone except LegSupport).
      applyInfluences(w);

      // 2) CPU morph LegSupport into outPos/outNrm (clamp comes after the group
      //    is positioned, since clamp needs the LegSupportGroup world matrix).
      computeLegSupportMorph(w);

      // 3) Root pivot. CAD uses Blender axes — Blender X = horizontal across
      //    the dog (= glTF/Babylon X), Blender Z = vertical (= glTF/Babylon Y),
      //    Blender Y = along the dog (= -glTF Z). The pivot's Y_cad is 0, so
      //    Petwheels.local Z stays 0.
      petwheels.position.set(
        (w.Wmm / 2 + 53 * w.sf) * MM_TO_M,
        (0.82 * w.Hmm)         * MM_TO_M,
        0,
      );
      petwheels.computeWorldMatrix(true);

      // 4) Track refs. Order matters because WheelCenterRef lives under
      //    ArmGroup, so the arm has to be in place before we read its center.
      positionGroupToRef(armGroup,     refUpperLegAxis, offArm);
      positionGroupToRef(legGroup,     refLegSupport,   offLeg);
      positionGroupToRef(sidebarGroup, refSideBarCtr,   offSidebar);
      positionGroupToRef(wheelGroup,   refWheelCenter,  offWheel);

      // 5) Now the LegSupportGroup world is final — snap and write the buffer.
      if (legCpu && legSupport) {
        clampLegSupportToPlane();
        legSupport.updateVerticesData(POSITION, legCpu.outPos, false, false);
        legSupport.updateVerticesData(NORMAL,   legCpu.outNrm, false, false);
        legSupport.refreshBoundingInfo();
      }

      // 6) Mirror — every visible mesh's instance copies its source's in-root
      //    transform. MirrorRoot's -1 X scaling makes that a true reflection.
      updateMirror();

      // 7) Auto-frame — re-target the camera goal so the model stays centered
      //    in view as it deforms. The render loop's lerp does the actual ease.
      frameCamera();
    }

    // Expose for debugging from the browser console.
    window.PW = {
      state,
      nodes: { petwheels, armGroup, legGroup, mainGroup, sidebarGroup, wheelGroup,
               refUpperLegAxis, refLegSupport, refSideBarCtr, refWheelCenter,
               mirrorRoot, legSupport },
      mirrorPairs,
      legCpu,
      computeWeights,
      update,
    };

    return { update, materials: styleMats };
  }

  BABYLON.SceneLoader.AppendAsync('assets/', 'petwheels.glb', scene).then(() => {
    // Identify the model root — gltf import creates a "__root__" transform node
    modelRoot = scene.getTransformNodeByName('__root__')
      || scene.transformNodes.find((n) => n.name === '__root__')
      || (() => {
        // fall back: create a parent for all top-level imported nodes
        const top = scene.transformNodes.filter((n) => !n.parent);
        return top[0] || scene.meshes.find((m) => !m.parent);
      })();

    if (modelRoot) {
      originalQuat = BABYLON.Quaternion.RotationAxis(BABYLON.Axis.Y, INITIAL_Y);
      applyModelRotation();

      // Wire the parametric rig: morphs + assembly tracking + mirror.
      // Must run BEFORE frameCamera so the bounding box reflects both halves.
      try {
        rig = buildRig(scene, modelRoot);
        if (rig) rig.update();
        // Now that styleMats exist, paint each material chip with its
        // slot's current albedo so the Style step shows the .glb defaults.
        if (typeof window.__pwSyncMaterialChips === 'function') {
          window.__pwSyncMaterialChips();
        }
        setupThighUI();   // wire the thigh-circumference measurement line
      } catch (e) {
        console.error('[Petwheels rig] setup failed', e);
      }

      // First framing snaps the camera (no fly-in animation).
      frameCamera(true);

      // Load + wire the parametric dog (async; won't block or break the viewer).
      setupDog();
    }

    scene.animationGroups.forEach((g) => g.stop());
    idleAnim = scene.animationGroups.find((g) => g.name && g.name.toLowerCase() === 'idle');
    if (idleAnim) {
      idleAnim.loopAnimation = true;
      idleAnim.start(true, 1.5, idleAnim.from, idleAnim.to, false);
    }

    loader?.classList.add('is-hidden');
  }).catch((err) => {
    console.error('Failed to load petwheels.glb', err);
    if (loader) loader.textContent = 'Could not load 3D model';
  });

  // ============ GET STL FILES (CadQuery → Supabase → download) ============
  // "Get my STL files" runs the real CadQuery build on the Render service and
  // downloads the resulting STL zip. The morph-rigged preview stays in the
  // viewer — no generated .glb is loaded. Progress streams over Supabase Realtime.
  const cfg = window.PETWHEELS_CONFIG || {};
  const SLOT_DEFAULT_HEX = { m1: '#428AE9', m2: '#838383', m3: '#1A1A1A', m4: '#1A1A1A' };

  let _sb = null;
  const getSupabase = () => {
    if (!_sb) {
      if (!window.supabase || !cfg.SUPABASE_URL) return null;
      _sb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
    }
    return _sb;
  };
  const publicUrl = (path) =>
    `${cfg.SUPABASE_URL}/storage/v1/object/public/${cfg.BUILDS_BUCKET || 'builds'}/${path}`;

  // --- modal + lock helpers ---
  const buildModal = $('#buildModal');
  const buildStageEl = $('#buildStage');
  const buildBarEl = $('#buildProgressBar');
  const buildPctEl = $('#buildPct');
  const buildCancelEl = $('#buildCancel');
  const buildBtn = $('#buildBtn');
  const downloadBtn = $('#downloadBtn');

  const lockUI = (on) => document.body.classList.toggle('pw-building', on);
  const openModal = () => { buildModal?.removeAttribute('hidden'); buildModal?.classList.remove('is-error'); };
  const closeModal = () => buildModal?.setAttribute('hidden', '');
  const setProgress = (stage, pct) => {
    if (buildStageEl) buildStageEl.textContent = stage || '';
    if (buildBarEl) buildBarEl.style.width = (pct || 0) + '%';
    if (buildPctEl) buildPctEl.textContent = Math.round(pct || 0) + '%';
  };
  const failModal = (msg) => {
    buildModal?.classList.add('is-error');
    if (buildStageEl) buildStageEl.textContent = msg;
    if (buildCancelEl) buildCancelEl.textContent = 'Close';
    lockUI(false);
    buildState.building = false;
  };

  const buildState = { building: false, jobId: null, channel: null };

  // Snapshot the chosen filament colour per slot from the live preview rig
  // (gamma/sRGB hex), so we can re-apply them to the generated model.
  const currentMaterialHexes = () => {
    const out = { ...SLOT_DEFAULT_HEX };
    if (rig && rig.materials) {
      Object.keys(out).forEach((slot) => {
        const m = rig.materials[slot];
        if (m && m.albedoColor && typeof color3ToHex === 'function') {
          out[slot] = color3ToHex(m.albedoColor.toGammaSpace());
        }
      });
    }
    return out;
  };

  // WheelchairParams (mm) from the current measurements, for the CAD service.
  const buildParams = () => ({
    Height:              state.measures.height * 10,
    Length:              state.measures.length * 10,
    Width:               state.measures.width  * 10,
    Thigh_Circumference: state.measures.thigh  * 10,
    ThicknessFactor:     state.measures.thickness,
    Auto_Wheel_Radius:   !state.measures.radiusManual,
    Manual_Wheel_Radius: computeCurrentR(),     // effective R in mm (used when manual)
    materials:           currentMaterialHexes(),
  });

  // Save the STL zip locally. Fetch → blob → object-URL anchor gives a real
  // download (filename, no tab navigation); the revealed link is a manual
  // fallback if the browser blocks the programmatic download.
  async function downloadStlZip(zipUrl) {
    if (downloadBtn) { downloadBtn.href = zipUrl; downloadBtn.hidden = false; }
    if (buildBtn) buildBtn.hidden = true;
    try {
      const res = await fetch(zipUrl);
      if (!res.ok) throw new Error('download responded ' + res.status);
      const blob = await res.blob();
      const obj = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = obj; a.download = 'petwheels-stls.zip';
      document.body.appendChild(a); a.click(); a.remove();
      setTimeout(() => URL.revokeObjectURL(obj), 5000);
    } catch (e) {
      console.warn('[Petwheels] auto-download failed; use the download button', e);
    }
  }

  function teardownChannel() {
    if (buildState.channel) {
      try { getSupabase()?.removeChannel(buildState.channel); } catch (_) {}
      buildState.channel = null;
    }
  }

  async function onJobUpdate(row) {
    if (!buildState.building) return;
    setProgress(row.stage || '', row.progress || 0);
    if (row.status === 'done') {
      teardownChannel();
      setProgress('Done', 100);
      await downloadStlZip(publicUrl(row.zip_path));
      closeModal(); lockUI(false); buildState.building = false;
    } else if (row.status === 'error') {
      teardownChannel();
      failModal(row.error || 'Build failed');
    } else if (row.status === 'cancelled') {
      teardownChannel();
      closeModal(); lockUI(false); buildState.building = false;
    }
  }

  async function startBuild() {
    if (buildState.building) return;
    const sb = getSupabase();
    if (!sb) { alert('Supabase is not configured.'); return; }
    if (!cfg.CAD_SERVICE_URL) {
      alert('The build service URL is not set yet (config.js → CAD_SERVICE_URL).');
      return;
    }

    buildState.building = true;
    if (buildCancelEl) buildCancelEl.textContent = 'Cancel';
    lockUI(true); openModal(); setProgress('Submitting…', 0);

    const params = buildParams();

    const { data, error } = await sb.from('build_jobs')
      .insert({ params }).select('id').single();
    if (error) { failModal('Could not create job: ' + error.message); return; }
    buildState.jobId = data.id;

    buildState.channel = sb.channel('build-' + data.id)
      .on('postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'build_jobs', filter: 'id=eq.' + data.id },
        (payload) => onJobUpdate(payload.new))
      .subscribe();

    try {
      const res = await fetch(cfg.CAD_SERVICE_URL.replace(/\/$/, '') + '/build', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ job_id: data.id, params }),
      });
      if (!res.ok) throw new Error('service responded ' + res.status);
      setProgress('Starting…', 1);
    } catch (e) {
      teardownChannel();
      failModal('Could not reach the build service: ' + e.message);
    }
  }

  async function cancelOrClose() {
    if (buildState.building && buildState.jobId) {
      const sb = getSupabase();
      try { await sb?.from('build_jobs').update({ status: 'cancelled' }).eq('id', buildState.jobId); }
      catch (_) {}
    }
    teardownChannel();
    closeModal(); lockUI(false); buildState.building = false;
  }

  buildBtn?.addEventListener('click', startBuild);
  buildCancelEl?.addEventListener('click', cancelOrClose);

  // ============ POINTER DRAG (model rotation) ============
  canvas.style.cursor = 'grab';

  const onPointerDown = (e) => {
    if (!modelRoot) return;
    isDragging = true;
    lastX = e.clientX;
    lastY = e.clientY;
    activePointerId = e.pointerId;
    canvas.setPointerCapture?.(e.pointerId);
    canvas.style.cursor = 'grabbing';
  };
  const onPointerMove = (e) => {
    if (!isDragging || !modelRoot) return;
    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    // Y — free, accumulates
    accumulatedY += -dx * ROT_SPEED;

    // X — soft-clamped with progressive resistance
    const normalized = Math.abs(peekX) / PEEK_MAX;
    const resistance = 1 + normalized * normalized * PEEK_RESISTANCE;
    let np = peekX + (-dy * ROT_SPEED) / resistance;
    np = Math.max(-PEEK_MAX, Math.min(PEEK_MAX, np));
    peekX = np;

    applyModelRotation();
  };
  const onPointerUp = (e) => {
    if (!isDragging) return;
    isDragging = false;
    if (activePointerId !== null) canvas.releasePointerCapture?.(activePointerId);
    activePointerId = null;
    canvas.style.cursor = 'grab';
  };
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointercancel', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);

  // Spring-back loop for X
  const springLoop = () => {
    if (!isDragging && Math.abs(peekX) > 0.0005) {
      peekX *= 1 - SPRING_STRENGTH;
      if (Math.abs(peekX) < 0.0005) peekX = 0;
      applyModelRotation();
    }
    requestAnimationFrame(springLoop);
  };
  requestAnimationFrame(springLoop);

  // ============ RENDER LOOP ============
  // When the customizer is scrolled out of the parent page, the embedder calls
  // window.pwSetRenderActive(false) so we skip rendering AND the per-frame
  // getBoundingClientRect() layout read — both otherwise compete with the host
  // page's scroll on the main thread and make it stutter/jump.
  let renderActive = true;
  window.pwSetRenderActive = (on) => { renderActive = !!on; };

  engine.runRenderLoop(() => {
    if (!renderActive) return;
    tickCameraFollow();
    scene.render();
    try { projectDimensions(); } catch (e) { /* never let the overlay stall rendering */ }
  });

  // Canvas sizing — probe the canvas's CSS box only a few times per second.
  // Reading getBoundingClientRect() every frame forces a synchronous reflow
  // that janks the host page's scroll; size changes (resize, fullscreen) are
  // rare, so ~7x/sec catches them without the per-frame layout thrash.
  let lastW = 0, lastH = 0, measureTick = 0;
  const measureAndResize = () => {
    if (!renderActive) { requestAnimationFrame(measureAndResize); return; }
    if ((measureTick++ % 9) === 0) {
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(0, Math.floor(rect.width));
      const cssH = Math.max(0, Math.floor(rect.height));
      if (cssW > 0 && cssH > 0 && (cssW !== lastW || cssH !== lastH)) {
        lastW = cssW;
        lastH = cssH;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        engine.setHardwareScalingLevel(1 / dpr);
        engine.setSize(Math.max(1, Math.round(cssW * dpr)), Math.max(1, Math.round(cssH * dpr)));
        // Canvas size changed (resize, fullscreen toggle). Refit — slider
        // edits skip this path; only honest layout changes trigger a re-frame.
        if (modelRoot) frameCamera(false, true);
      }
    }
    requestAnimationFrame(measureAndResize);
  };
  measureAndResize();

  // Fullscreen: instead of fighting CSS specificity, directly force the canvas to
  // cover the screen with inline !important styles. Nothing can beat that.
  const viewportEl = $('#viewport');
  // Force the whole fullscreen layout chain with inline !important styles.
  const dogFrameEl = canvas.parentElement;
  const stageEl = dogFrameEl.parentElement;
  const setFsCanvasStyles = (on) => {
    if (on) {
      // Viewport: cover the screen
      viewportEl.style.setProperty('position', 'fixed', 'important');
      viewportEl.style.setProperty('top', '0', 'important');
      viewportEl.style.setProperty('left', '0', 'important');
      viewportEl.style.setProperty('width', '100vw', 'important');
      viewportEl.style.setProperty('height', '100vh', 'important');
      viewportEl.style.setProperty('z-index', '9999', 'important');
      // Stage: block layout (NOT grid) to avoid the circular sizing dependency
      // where grid auto-rows look at the canvas's intrinsic square size.
      stageEl.style.setProperty('flex', '1 1 auto', 'important');
      stageEl.style.setProperty('min-height', '0', 'important');
      stageEl.style.setProperty('padding', '0', 'important');
      stageEl.style.setProperty('display', 'block', 'important');
      stageEl.style.setProperty('position', 'relative', 'important');
      // Dog-frame: absolutely positioned so its 100% height resolves to the
      // stage's actual content height, not the canvas's intrinsic size.
      dogFrameEl.style.setProperty('position', 'absolute', 'important');
      dogFrameEl.style.setProperty('top', '0', 'important');
      dogFrameEl.style.setProperty('left', '0', 'important');
      dogFrameEl.style.setProperty('width', '100%', 'important');
      dogFrameEl.style.setProperty('height', '100%', 'important');
      dogFrameEl.style.setProperty('aspect-ratio', 'auto', 'important');
      dogFrameEl.style.setProperty('max-width', 'none', 'important');
    } else {
      ['position', 'top', 'left', 'width', 'height', 'z-index'].forEach((k) => viewportEl.style.removeProperty(k));
      ['flex', 'min-height', 'padding', 'display', 'position'].forEach((k) => stageEl.style.removeProperty(k));
      ['position', 'top', 'left', 'width', 'height', 'aspect-ratio', 'max-width'].forEach((k) => dogFrameEl.style.removeProperty(k));
    }
    requestAnimationFrame(() => {
      console.log('[Petwheels fs layout]', {
        on,
        viewport: `${viewportEl.clientWidth}x${viewportEl.clientHeight}`,
        stage: `${stageEl.clientWidth}x${stageEl.clientHeight}`,
        dogFrame: `${dogFrameEl.clientWidth}x${dogFrameEl.clientHeight}`,
        screen: `${window.innerWidth}x${window.innerHeight}`,
      });
    });
  };
  // Swap the fullscreen button between the "expand" (outward corners) and "exit"
  // (inward corners) glyphs so it reflects the current state.
  const FS_ENTER = '<path d="M3 9V3h6"/><path d="M21 9V3h-6"/><path d="M3 15v6h6"/><path d="M21 15v6h-6"/>';
  const FS_EXIT  = '<path d="M9 3v6H3"/><path d="M15 3v6h6"/><path d="M9 21v-6H3"/><path d="M15 21v-6h6"/>';
  const onFsChange = () => {
    const isFs = document.fullscreenElement === viewportEl || document.webkitFullscreenElement === viewportEl;
    viewportEl.classList.toggle('is-fullscreen', isFs);
    const fsIcon = $('#fsIcon'), fsBtn = $('#fullscreen');
    if (fsIcon) fsIcon.innerHTML = isFs ? FS_EXIT : FS_ENTER;
    if (fsBtn) fsBtn.title = isFs ? 'Exit fullscreen' : 'Fullscreen';
    setFsCanvasStyles(isFs);
  };
  document.addEventListener('fullscreenchange', onFsChange);
  document.addEventListener('webkitfullscreenchange', onFsChange);

  // ============ VIEWPORT TABS / BUTTON CONTROLS ============
  // View tabs: "Wheelchair only" hides the dog (data-view="chair"); "Full view"
  // shows it. The measurement overlay stays up regardless (still dimmed + hover-
  // able) so the user can read sizes against the chair alone.
  function applyDogVisibility(instant = false) {
    const d = window.PW && window.PW.dog;
    if (!d) return;
    const on = state.dogVisible !== false;
    if (d.mesh) d.mesh.setEnabled(on);
    if (d.inst) d.inst.setEnabled(on);
    // Re-derive the framing for the new bbox. Eased by default; instant only on
    // first load so the landing view doesn't fly in.
    if (modelRoot) frameCamera(instant);
  }
  // Ruler button: toggle the measurement overlay independently of the dog view.
  const measuresBtn = $('#toggleMeasures');
  const setMeasuresVisible = (on) => {
    state.measuresVisible = on;
    if (measuresBtn) measuresBtn.classList.toggle('is-active', on);
  };
  measuresBtn?.addEventListener('click', () => setMeasuresVisible(!state.measuresVisible));

  $$('.vp-tab').forEach((t) => {
    t.addEventListener('click', () => {
      $$('.vp-tab').forEach((x) => x.classList.remove('is-active'));
      t.classList.add('is-active');
      state.dogVisible = (t.dataset.view !== 'chair');
      // Convenience: hiding the dog auto-disables measures, showing it re-enables
      // them. The ruler button still overrides either way.
      setMeasuresVisible(state.dogVisible);
      applyDogVisibility();
    });
  });

  // ---- Model selector dropdown ----
  // Rendered from the MODELS catalog at the top of this file. Adding a new
  // wheelchair = push another entry into MODELS. The trigger pill, the
  // option list, and the selected-state all flow from here.
  const modelTrigger = $('#modelSelectTrigger');
  const modelMenu    = $('#modelSelectMenu');
  const modelList    = $('#modelOptionsList');
  if (modelTrigger && modelMenu && modelList && MODELS.length) {
    const modelThumb = $('#modelSelectThumb');
    const modelName  = $('#modelSelectName');
    let   selectedId = MODELS[0].id;

    const escapeHtml = (s) => String(s).replace(/[&<>"']/g, (c) => (
      { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]
    ));

    const renderTrigger = (model) => {
      // Header pill uses displayName if present, otherwise falls back to
      // the dropdown name so a missing field never reads as empty.
      if (modelName)  modelName.textContent = model.displayName || model.name;
      if (modelThumb) modelThumb.src = model.thumbnail;
    };

    const renderOptions = () => {
      modelList.innerHTML = MODELS.map((m) => {
        const selected = m.id === selectedId;
        return `
          <li class="model-option${selected ? ' is-selected' : ''}"
              role="option" tabindex="0"
              data-model="${escapeHtml(m.id)}"
              aria-selected="${selected ? 'true' : 'false'}">
            <img class="model-option-thumb" src="${escapeHtml(m.thumbnail)}" alt="" />
            <div class="model-option-text">
              <span class="model-option-name">${escapeHtml(m.name)}</span>
              <span class="model-option-desc">${escapeHtml(m.description)}</span>
            </div>
          </li>
        `;
      }).join('');
    };

    const closeModelMenu = () => {
      if (modelMenu.hidden) return;
      modelMenu.hidden = true;
      modelTrigger.setAttribute('aria-expanded', 'false');
    };
    const openModelMenu = () => {
      modelMenu.hidden = false;
      modelTrigger.setAttribute('aria-expanded', 'true');
    };

    const selectModel = (id) => {
      const model = MODELS.find((m) => m.id === id);
      if (!model) return;
      selectedId = model.id;
      // Update the option list's selected state in place — cheaper than a
      // full re-render and keeps focus/scroll position stable.
      $$('.model-option', modelMenu).forEach((opt) => {
        const isSel = opt.dataset.model === selectedId;
        opt.classList.toggle('is-selected', isSel);
        opt.setAttribute('aria-selected', isSel ? 'true' : 'false');
      });
      renderTrigger(model);
      closeModelMenu();
      // TODO: when there's more than one model, swap the loaded .glb here
      // using model.glb.
    };

    renderOptions();
    renderTrigger(MODELS.find((m) => m.id === selectedId) || MODELS[0]);

    modelTrigger.addEventListener('click', (e) => {
      e.stopPropagation();
      modelMenu.hidden ? openModelMenu() : closeModelMenu();
    });
    document.addEventListener('click', (e) => {
      if (modelMenu.hidden) return;
      if (!modelTrigger.contains(e.target) && !modelMenu.contains(e.target)) {
        closeModelMenu();
      }
    });
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !modelMenu.hidden) closeModelMenu();
    });

    // Delegate clicks / Enter / Space on the options — works regardless of
    // when the list was rendered.
    modelList.addEventListener('click', (e) => {
      const opt = e.target.closest('.model-option');
      if (opt) selectModel(opt.dataset.model);
    });
    modelList.addEventListener('keydown', (e) => {
      if (e.key !== 'Enter' && e.key !== ' ') return;
      const opt = e.target.closest('.model-option');
      if (!opt) return;
      e.preventDefault();
      selectModel(opt.dataset.model);
    });
  }

  const tweenAccumulatedY = (delta) => {
    tween(() => accumulatedY, accumulatedY + delta, (v) => { accumulatedY = v; applyModelRotation(); });
  };
  // Zoom buttons feed the user-offset factor. The render-loop lerp animates
  // the radius toward the recomputed camGoalRadius (= autoFit × userFactor).
  $('#rotateL').addEventListener('click', () => tweenAccumulatedY(-Math.PI / 8));
  $('#rotateR').addEventListener('click', () => tweenAccumulatedY(Math.PI / 8));
  $('#zoomIn').addEventListener('click', () => applyUserZoom(0.85));
  $('#zoomOut').addEventListener('click', () => applyUserZoom(1.18));
  $('#resetView')?.addEventListener('click', () => {
    tween(() => accumulatedY, 0, (v) => { accumulatedY = v; applyModelRotation(); }, 400);
    tween(() => peekX, 0, (v) => { peekX = v; applyModelRotation(); }, 400);
    // Restore the auto-fit zoom (resetZoom=true) and let the follower lerp
    // ease the radius back to it.
    frameCamera(false, true);
  });

  // Wheel zooms ONLY when the cursor is inside the model's screen-projected
  // bounding box. Outside that rect (e.g. on the gradient background around
  // the wheelchair), the event passes through to normal page scrolling —
  // the canvas takes up a lot of the viewport, so always-prevent would steal
  // the user's scroll gesture in the common case.
  //
  // We project the 8 corners of the world bbox to screen each event and
  // hit-test the cursor against the resulting 2D rect. That's a few vec3
  // multiplies — cheap compared to even one frame of jank — and it tracks
  // the model as it morphs / rotates / zooms without any caching.
  const isCursorOverModelBbox = (clientX, clientY) => {
    if (!modelRoot) return false;
    const rect = canvas.getBoundingClientRect();
    const cx = clientX - rect.left;
    const cy = clientY - rect.top;
    if (cx < 0 || cy < 0 || cx > rect.width || cy > rect.height) return false;

    const predicate = (m) =>
      m && m.isEnabled && m.isEnabled() &&
      m.isVisible !== false &&
      m.getTotalVertices && m.getTotalVertices() > 0;
    const bounds = modelRoot.getHierarchyBoundingVectors(true, predicate);
    if (!isFinite(bounds.min.x) || !isFinite(bounds.max.x)) return false;

    // Project to a viewport sized in CSS pixels so cursor coords match
    // without any DPR juggling.
    const viewport = new BABYLON.Viewport(0, 0, 1, 1).toGlobal(rect.width, rect.height);
    const transform = scene.getTransformMatrix();
    const identity = BABYLON.Matrix.Identity();
    let minSx = Infinity, minSy = Infinity, maxSx = -Infinity, maxSy = -Infinity;
    const v = new BABYLON.Vector3();
    for (let i = 0; i < 8; i++) {
      v.set(
        (i & 1) ? bounds.max.x : bounds.min.x,
        (i & 2) ? bounds.max.y : bounds.min.y,
        (i & 4) ? bounds.max.z : bounds.min.z,
      );
      const p = BABYLON.Vector3.Project(v, identity, transform, viewport);
      if (p.x < minSx) minSx = p.x;
      if (p.x > maxSx) maxSx = p.x;
      if (p.y < minSy) minSy = p.y;
      if (p.y > maxSy) maxSy = p.y;
    }
    return cx >= minSx && cx <= maxSx && cy >= minSy && cy <= maxSy;
  };

  // Hovering a measurement field (its slider, value box or "?") lights up the
  // matching dimension on the dog — the same effect as hovering the line itself,
  // driven through the dim record's hoverCount that projectDimensions reads.
  $$('input[type=range][data-measure]').forEach((slider) => {
    const key = slider.dataset.measure;
    const field = slider.closest('.field');
    if (!field) return;
    field.addEventListener('mouseenter', () => {
      const rec = dims.find((d) => d.key === key);
      if (rec) rec.hoverCount++;
    });
    field.addEventListener('mouseleave', () => {
      const rec = dims.find((d) => d.key === key);
      if (rec) rec.hoverCount = Math.max(0, rec.hoverCount - 1);
    });
  });

  // Wheel-to-zoom is intentionally disabled: the wheel only ever scrolls the
  // host page now, and zoom is done through the +/- buttons. This removes the
  // scroll/zoom conflict over the viewer.
  $('#fullscreen').addEventListener('click', () => {
    const el = $('#viewport');
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  });
})();
