/* Petwheels — customizer interactions */
(() => {
  'use strict';

  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  // i18n: translate a user-facing English string (i18n.js). Falls through to
  // the input when i18n isn't loaded or the language is English.
  const tr = (s) => (window.PW_I18N && window.PW_I18N.t) ? window.PW_I18N.t(s) : s;

  // ============ MODEL CATALOG ============
  // Single source of truth for the wheelchair models shown in the viewport's
  // dropdown. Edit names / descriptions / thumbnails / glb paths here — the
  // dropdown and trigger pill are rendered from this on boot, so HTML doesn't
  // need to change when you add or rename a model.
  //   id          — unique slug used as data-model and as the GLB-swap key.
  //   name        — SHORT name ("Model A1"). Used inside the viewer only
  //                 (dropdown options + header pill). Everywhere else —
  //                 cart, checkout, orders, pet device chip — the full
  //                 product name is derived via productName() below, so
  //                 renaming here propagates everywhere automatically.
  //   displayName — optional override for the viewer's header pill.
  //                 Falls back to `name` if omitted.
  //   description — secondary line under the name in the dropdown.
  //   thumbnail   — relative path to the option's small image.
  //   glb         — SEMANTIC model key, resolved through MODEL_FILES /
  //                 fetchModel (the on-disk assets carry obfuscated names).
  //                 Reserved for when there's more than one model; currently
  //                 every entry uses the same file.
  const MODELS = [
    {
      id:          'zephyr',
      name:        'Model A1',
      description: 'Rear-leg wheelchair',
      thumbnail:   'assets/petwheels-dog3.png',
      glb:         'petwheels.glb',
    },
  ];

  // ============ PRODUCT TYPE CATALOG ============
  // Same customization, two deliverables. 'assembled' is priced live from the
  // weight quote (pricing.js); 'stl' is the flat printable-bundle price
  // (pricing.js CONFIG.stlBundleCents, mirrored server-side). Rendered as the
  // "Product type" dropdown in the panel's persistent context row.
  const PRODUCT_TYPES = [
    {
      id: 'assembled',
      name: 'Assembled product',
      description: 'Built, tested and shipped to your door',
    },
    {
      id: 'stl',
      name: 'STL files for print',
      description: 'Digital download, print it yourself',
    },
  ];
  const productTypeById = (id) =>
    PRODUCT_TYPES.find((p) => p.id === id) || PRODUCT_TYPES[0];

  // STL selling is SUSPENDED — chairs are made by partner manufacturers now,
  // so the site sells the assembled product only. Flip to true to bring the
  // printable bundle back; everything downstream still understands it.
  const STL_SALES_ENABLED = false;
  const ACTIVE_PRODUCT_TYPES = STL_SALES_ENABLED
    ? PRODUCT_TYPES
    : PRODUCT_TYPES.filter((p) => p.id !== 'stl');

  // Full product name for everything OUTSIDE the viewer ("Petwheels
  // Model A1"). Derived, never hardcoded — and tolerant of a future model
  // whose name already carries the brand.
  const productName = (m) => /petwheels/i.test(m.name) ? m.name : 'Petwheels ' + m.name;

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
  // PETG stock — plain solid colors only: every rigid entry is non-metallic
  // at 0.4 roughness (no silk/metallic/matte/dual-color variants; the `tags`
  // machinery still works if a special filament ever comes back).
  const FILAMENTS = {
    rigid: [
      { name: 'White',      color: '#F2F3F5', roughness: 0.4, metallic: 0 },
      { name: 'Light Gray', color: '#8F959D', roughness: 0.4, metallic: 0 },
      { name: 'Black',      color: '#1A1A1A', roughness: 0.4, metallic: 0 },
      { name: 'Blue',       color: '#3186DC', roughness: 0.4, metallic: 0 },
      { name: 'Orange',     color: '#F07020', roughness: 0.4, metallic: 0 },
      { name: 'Yellow',     color: '#FACC15', roughness: 0.4, metallic: 0 },
      { name: 'Red',        color: '#C62828', roughness: 0.4, metallic: 0 },
      { name: 'Purple',     color: '#6D3BB8', roughness: 0.4, metallic: 0 },
      { name: 'Olive',      color: '#6B7F3A', roughness: 0.4, metallic: 0 },
      { name: 'Wood',       color: '#744F3A', roughness: 0.4, metallic: 0 },
    ],
    flexible: [
      { name: 'Black', color: '#000000', roughness: 0.50, metallic: 0.49 },
      { name: 'White', color: '#d3d4d7', roughness: 0.50, metallic: 0.00 },
    ],
  };

  // Default Style material per slot (colour + finish). The wheelchair boots
  // with THIS set — not the raw .glb materials — so the viewer shows the
  // default filament choice even before the user opens the Style step. Colours
  // are sRGB hex; finishes mirror the nearest catalog filament (m1 ≈ Blue,
  // m2 ≈ Light Gray, m3 ≈ Black — PETG: metallic 0, roughness 0.4; m4 keeps
  // the flexible/TPU black). SLOT_DEFAULT_HEX (used by the STL export)
  // derives from this so there's a single source of truth.
  const SLOT_DEFAULTS = {
    m1: { hex: '#3186DC', roughness: 0.4, metallic: 0 },
    m2: { hex: '#8F959D', roughness: 0.4, metallic: 0 },
    m3: { hex: '#1A1A1A', roughness: 0.4, metallic: 0 },
    m4: { hex: '#1A1A1A', roughness: 0.50, metallic: 0.49 },
  };

  // ============ STATE ============
  let rig = null;   // parametric assembly + morph rig; assigned after glb load
  // When the dog update-hook is installed it re-solves the dog AFTER rig.update,
  // so rig.update defers its own auto-framing to the hook (which frames once,
  // with the dog at its fresh pose). Avoids a stale frame + a double bbox pass.
  let dogFramesAfterSolve = false;

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
    modelId: MODELS[0].id,      // currently selected wheelchair model
    productType: 'assembled',   // 'assembled' | 'stl' (PRODUCT_TYPES)
    unit: 'cm',
    wheel: 75,
    harness: 'padded',
    harnessLabel: 'Padded',
    legSupport: true,
    backStrap: true,
    includeCollar: true,
    dogVisible: true,           // "Full view" vs "Wheelchair only"
    measuresVisible: false,     // measurement overlay toggle (ruler button). Starts
                                // off; the Measure step auto-enables it (see setStep).
    // length/height/width/thigh in cm (UI units). thickness is ThicknessFactor (1.0–2.0).
    // radiusManual: when true, radiusOffset (mm) is layered on top of the auto
    // wheel radius and the internal height is shortened by the same amount.
    measures: {
      length: 35, height: 25, width: 10, thigh: 25, thickness: 1.2,
      radiusManual: false, radiusOffset: 0,
    },
  };

  // Factory defaults for the toolbar's reset-measurements button (and the
  // single source the state block above boots from — keep them in sync with
  // the slider `value` attributes in index.html).
  const MEASURE_DEFAULTS = { length: 35, height: 25, width: 10, thigh: 25, thickness: 1.2 };

  // ============ NAVIGATION ============
  const heroGrid = $('.hero-grid');
  // Header tabs: highlight the one matching the current screen/step, and
  // glide the outline pill (.nav-pill) over to it. When the page is scrolled
  // to the bottom stop (the contact footer), the Contact anchor wins instead —
  // navAtContact is flipped by the scroll handler further down.
  let navAtContact = false;
  let fitHeroTitle = null;   // assigned by the typewriter block below
  const syncNavTabs = () => {
    const links = $('.nav-links');
    if (!links) return;
    const target = state.screen === 'welcome' ? 'welcome' : state.step;
    let active = null;
    $$('.nav-links [data-nav]').forEach((b) => {
      const on = !navAtContact && b.dataset.nav === target;
      b.classList.toggle('is-active', on);
      if (on) active = b;
    });
    const contact = links.querySelector('a[href="#contact"]');
    if (contact) {
      contact.classList.toggle('is-active', navAtContact);
      if (navAtContact) active = contact;
    }
    let pill = links.querySelector('.nav-pill');
    if (!pill) {
      pill = document.createElement('span');
      pill.className = 'nav-pill';
      pill.style.transition = 'none';   // no slide-in on first paint
      links.prepend(pill);
      setTimeout(() => { pill.style.transition = ''; }, 60);
    }
    if (active) {
      pill.hidden = false;
      pill.style.width = active.offsetWidth + 'px';
      pill.style.height = active.offsetHeight + 'px';
      pill.style.transform = `translate(${active.offsetLeft}px, ${active.offsetTop}px)`;
    } else {
      pill.hidden = true;
    }
  };
  const showScreen = (name) => {
    state.screen = name === 'welcome' ? 'welcome' : 'steps';
    $$('.panel-screen').forEach((s) => {
      s.classList.toggle('is-active', s.dataset.screen === state.screen);
    });
    // Welcome owns the full hero (viewport column collapsed); any step
    // brings the 3D viewport back. See .hero-grid.is-welcome in styles.css.
    if (heroGrid) heroGrid.classList.toggle('is-welcome', state.screen === 'welcome');
    if (name !== 'welcome') setStep(name);
    syncNavTabs();
    // The headline is only measurable while the welcome screen is visible.
    if (state.screen === 'welcome' && fitHeroTitle) fitHeroTitle();
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
    // Measurement overlay auto-follows the step: on in Measure, off elsewhere
    // (Style / Review). The user can still override with the ruler button — this
    // only re-applies the default each time they change step.
    // try/catch (not typeof): setMeasuresVisible is a const declared after the
    // Babylon guard, so if the viewer never initialized (CDN/WebGL failure)
    // even `typeof` throws a TDZ ReferenceError and would break navigation.
    try { setMeasuresVisible(step === 'measure'); } catch (_) { /* viewer not initialized */ }
    // Refresh the summary with the latest measurements/options on entry.
    if (step === 'review') updateReview();
  };

  // ---- hash routing ----
  // Every section owns a hash (#home/#measure/#style/#review, plus the
  // #contact footer anchor), so the URL always names where you are and the
  // browser's back/forward buttons walk between sections. All UI navigation
  // funnels through navigate(); the hashchange handler is the single place
  // that actually flips screens.
  const HASH_FOR = { welcome: 'home', measure: 'measure', style: 'style', review: 'review' };
  const NAME_FOR = { '': 'welcome', home: 'welcome', measure: 'measure', style: 'style', review: 'review' };
  const applyHash = (glide) => {
    const h = (location.hash || '').slice(1);
    if (h === 'contact') { syncNavTabs(); return; }   // footer anchor — scroll handled elsewhere
    const name = NAME_FOR[h];
    if (name == null) return;                          // unknown hash — leave the screen alone
    showScreen(name);
    if (glide) glidePage(0);
  };
  const navigate = (name) => {
    const target = '#' + (HASH_FOR[name] || 'home');
    if (location.hash === target) {
      // Same section (e.g. logo while already home) — still restore the view.
      showScreen(name);
      glidePage(0);
      return;
    }
    location.hash = target;   // pushes history → hashchange → applyHash
  };
  window.addEventListener('hashchange', () => applyHash(true));

  $$('[data-go]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.go));
  });
  $$('.step').forEach((s) => {
    s.addEventListener('click', () => navigate(s.dataset.step));
  });
  // Header tabs (Home / Measure / Style / Review) drive the same screens and
  // bring the customizer back into view.
  $$('.nav-links [data-nav]').forEach((btn) => {
    btn.addEventListener('click', () => navigate(btn.dataset.nav));
  });
  // The logo is Home.
  $('.nav-logo')?.addEventListener('click', (e) => {
    e.preventDefault();
    navigate('welcome');
  });
  syncNavTabs();   // initial highlight (Home, unless a restore/hash overrides)

  // ---- welcome title: rotating typed adjective ----
  // Types each word, holds, erases (faster), then moves to the next with a
  // different brand gradient. The rest of the headline reflows around it.
  {
    const el = $('#typeWord');
    if (el) {
      const WORDS = [
        { w: 'Perfect-fit', g: 'linear-gradient(100deg, #FF7A1A, #FF3D78)' },   // orange → pink
        { w: 'Comfortable', g: 'linear-gradient(100deg, #7C3AED, #2FB8FF)' },   // purple → blue
        { w: 'Modern',      g: 'linear-gradient(100deg, #FF3D78, #7C3AED)' },   // pink → purple
        { w: 'Affordable',  g: 'linear-gradient(100deg, #FF7A1A, #C13FA9)' },   // orange → magenta
      ];
      const TYPE_MS = 85, ERASE_MS = 40, HOLD_MS = 1800, GAP_MS = 400;
      let wi = 0;
      const cur = () => tr(WORDS[wi].w);   // word in the active language
      let ci = cur().length;   // page loads with the first word complete
      let dir = -1;
      el.textContent = cur();
      el.style.setProperty('--word-grad', WORDS[0].g);
      const step = () => {
        ci += dir;
        el.textContent = cur().slice(0, ci);
        if (dir > 0 && ci >= cur().length) {
          dir = -1;
          setTimeout(step, HOLD_MS);
        } else if (dir < 0 && ci <= 0) {
          dir = 1;
          wi = (wi + 1) % WORDS.length;
          el.style.setProperty('--word-grad', WORDS[wi].g);
          setTimeout(step, GAP_MS);
        } else {
          setTimeout(step, dir > 0 ? TYPE_MS : ERASE_MS);
        }
      };
      setTimeout(step, HOLD_MS);

      // Keep the headline on exactly TWO lines for every word in the cycle:
      // measure the worst case (each word fully typed) and step the font
      // size down from the stylesheet value until all of them fit.
      const h1 = el.closest('.panel-title');
      fitHeroTitle = () => {
        if (!h1 || !h1.offsetParent) return;   // welcome hidden — nothing to measure
        const saved = el.textContent;
        h1.style.fontSize = '';                // restart from the CSS size
        const prevMin = h1.style.minHeight;
        h1.style.minHeight = '0';              // min-height would mask the line count
        let size = parseFloat(getComputedStyle(h1).fontSize);
        const words = WORDS.map((w) => tr(w.w));
        const overflows = () => words.some((w) => {
          el.textContent = w;
          return h1.scrollHeight > size * 1.05 * 2 + 4;   // taller than two lines
        });
        while (overflows() && size > 24) {
          size -= 1;
          h1.style.fontSize = size + 'px';
        }
        h1.style.minHeight = prevMin;
        el.textContent = saved;
      };
      // Fit once webfonts have real metrics, and again on resize.
      if (document.fonts && document.fonts.ready) {
        document.fonts.ready.then(() => fitHeroTitle && fitHeroTitle());
      }
      fitHeroTitle();
      let fitTimer = 0;
      window.addEventListener('resize', () => {
        clearTimeout(fitTimer);
        fitTimer = setTimeout(() => fitHeroTitle && fitHeroTitle(), 150);
      });

      // Language switch: restart the current word cleanly in the new language
      // and re-fit (word lengths differ per language).
      window.addEventListener('pw:langchange', () => {
        ci = 0;
        dir = 1;
        el.textContent = '';
        if (fitHeroTitle) fitHeroTitle();
      });
    }
  }

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
      updateWeightStat();
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
      updateReview();
      updateWeightStat();
      if (rig) rig.update();
    });
    if (thicknessOut) thicknessOut.value = state.measures.thickness.toFixed(2);
  }

  // -------- "?" help tooltips --------
  // Rich hover cards: a short how-to-measure instruction plus a small looping
  // demo video (CAD-software style). Each tip is moved out of its label and
  // into <body>, then positioned `fixed` and clamped to the viewport — the
  // old in-flow absolute tips overflowed the panel edge, and a transformed /
  // overflow ancestor would clip or misplace them.
  {
    const openTips = new Set();
    const closeAllTips = () => openTips.forEach((close) => close());
    window.addEventListener('scroll', closeAllTips, { capture: true, passive: true });
    window.addEventListener('resize', closeAllTips);
    // Tap anywhere outside the "?" or the tip closes it — touch has no
    // mouseleave. Capture phase so taps that stop propagation still count.
    document.addEventListener('click', (e) => {
      if (e.target.closest('.field-help') || e.target.closest('.field-help-tip')) return;
      closeAllTips();
    }, true);
    // Hover/focus only drive the tips where a real hover exists. On touch the
    // browser synthesizes mouseenter right before click — open() then the
    // click-toggle would close() in the same tap and the tip never showed.
    const canHover = window.matchMedia('(hover: hover)').matches;

    $$('.field-help').forEach((btn) => {
      const tip = btn.querySelector('.field-help-tip');
      if (!tip) return;
      document.body.appendChild(tip);
      const video = tip.querySelector('video');
      // Touch-only X button (CSS hides it where hover handles closing).
      const closeBtn = document.createElement('button');
      closeBtn.type = 'button';
      closeBtn.className = 'tip-close';
      closeBtn.setAttribute('aria-label', 'Close');
      closeBtn.innerHTML = '<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>';
      tip.appendChild(closeBtn);

      const place = () => {
        const r = btn.getBoundingClientRect();
        const t = tip.getBoundingClientRect();
        const m = 12;
        let left = r.left + r.width / 2 - t.width / 2;
        left = Math.max(m, Math.min(left, window.innerWidth - m - t.width));
        let top = r.top - t.height - 10;
        const below = top < m;
        if (below) top = r.bottom + 10;
        tip.style.left = left + 'px';
        tip.style.top = top + 'px';
        tip.classList.toggle('tip-below', below);
        tip.style.setProperty('--arrow-x', (r.left + r.width / 2 - left) + 'px');
      };

      const close = () => {
        tip.classList.remove('is-open');
        openTips.delete(close);
        if (video) video.pause();
      };
      const open = () => {
        tip.classList.add('is-open');
        openTips.add(close);
        place();
        if (video) {
          video.currentTime = 0;
          video.play().catch(() => {});
        }
      };

      closeBtn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        close();
      });

      if (canHover) {
        btn.addEventListener('mouseenter', open);
        btn.addEventListener('mouseleave', close);
        btn.addEventListener('focus', open);
        btn.addEventListener('blur', close);
      }
      // The "?" lives inside a <label>: without preventDefault a tap/click
      // activates the label's slider instead of the tip. Click also toggles,
      // which is the only way to open it on touch devices.
      btn.addEventListener('click', (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (tip.classList.contains('is-open')) close();
        else open();
      });
    });
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
      // Review + weight/price react to every key (thickness drives the wheel
      // weight too); the cm-only bits are the unit displays and radius sync.
      if (unit === 'cm') {
        updateMeasureOutputs();
        updateChips();
        if (key === 'height') syncRadiusOffsetRange();
      }
      updateReview();
      updateWeightStat();
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
      updateReview();
      updateWeightStat();
      if (rig) rig.update();
    });

    radiusOffsetInput.addEventListener('input', () => {
      state.measures.radiusOffset = +radiusOffsetInput.value;
      updateRangeFill(radiusOffsetInput);
      writeRadiusDisplay();
      updateReview();
      updateWeightStat();
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
      updateReview();
      updateWeightStat();
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
      // Two toggles exist (Measure header + the mobile one in the viewer) —
      // sync by unit so both always show the same active side.
      $$('.unit-btn').forEach((b) =>
        b.classList.toggle('is-active', b.dataset.unit === btn.dataset.unit));
      state.unit = btn.dataset.unit;
      updateMeasureOutputs();
      updateChips();
      // Radius display is unit-aware too — re-render in the new unit.
      writeRadiusDisplay();
    });
  });

  // ============ MOBILE PANEL TABS ============
  // Phones show one measurement slider at a time (tab strip above it) and split
  // the Style step into Style / Accessories tabs. The strips are display:none
  // on desktop; the active choice is stamped as data-mtab / data-stab on the
  // step body, and the mobile CSS shows/hides content off those attributes.
  // The dimension overlay also reads mobileMeasureTab: on phones the selected
  // measurement's 3D line renders lit (value shown), like desktop hover.
  const MOBILE_PANEL_MQ = window.matchMedia('(max-width: 640px)');
  let mobileMeasureTab = 'length';
  {
    const measureBody = $('.step-body[data-body="measure"]');
    const tabsWrap = $('#measureTabs');
    $$('#measureTabs .mtab').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('#measureTabs .mtab').forEach((b) => b.classList.toggle('is-active', b === btn));
        if (measureBody) measureBody.dataset.mtab = btn.dataset.mtab;
        mobileMeasureTab = btn.dataset.mtab;
        // Center the tab by scrolling ONLY the strip — scrollIntoView also
        // scrolls every scrollable ancestor and nudged the whole page sideways.
        if (tabsWrap) {
          tabsWrap.scrollTo({
            left: (btn.offsetLeft - tabsWrap.offsetLeft) - (tabsWrap.clientWidth - btn.offsetWidth) / 2,
            behavior: 'smooth',
          });
        }
      });
    });
    const styleBody = $('.step-body[data-body="style"]');
    $$('#styleTabs .stab').forEach((btn) => {
      btn.addEventListener('click', () => {
        $$('#styleTabs .stab').forEach((b) => b.classList.toggle('is-active', b === btn));
        if (styleBody) styleBody.dataset.stab = btn.dataset.stab;
      });
    });

    // On phones the pet picker leaves the context row (which is hidden there)
    // and docks beside the Measure title, in the slot the unit toggle vacated.
    // Same element either way — account.js's partner-hiding and the picker's
    // own behavior keep working wherever it lives.
    const petMount = $('#petPickerMount');
    const petField = petMount && petMount.closest('.pet-pick-field');
    const contextRow = $('.panel-context-row');
    const measureHeadRow = $('.step-body[data-body="measure"] .step-head-row');
    const placePetField = () => {
      if (!petField || !contextRow || !measureHeadRow) return;
      if (MOBILE_PANEL_MQ.matches) measureHeadRow.appendChild(petField);
      else contextRow.insertBefore(petField, contextRow.firstChild);
    };
    placePetField();
    MOBILE_PANEL_MQ.addEventListener('change', placePetField);
  }

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

  // Render the row title after a filament pick. Two spans: the authored part
  // name (.mt-part — phones keep showing it) and the filament name + tag
  // badges (.mt-filament — what desktop shows). CSS picks one per viewport.
  const renderRowTitle = (titleEl, filament) => {
    if (!titleEl || !filament) return;
    if (!titleEl.dataset.part) titleEl.dataset.part = titleEl.textContent.trim();
    const tags = filament.tags || [];
    const badges = tags.map((tag) =>
      `<span class="material-tag material-tag-${tag}">${tr(tagLabel(tag))}</span>`
    ).join('');
    titleEl.innerHTML =
      `<span class="mt-part">${escapeHtmlAttr(titleEl.dataset.part)}</span>` +
      `<span class="mt-filament">${escapeHtmlAttr(tr(filament.name))}${badges}</span>`;
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
            `<span class="material-swatch-name">${escapeHtmlAttr(tr(f.name))}</span>` +
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
    const revLeg = $('#revLeg2'); if (revLeg) revLeg.textContent = state.legSupport ? tr('Yes') : tr('No');
    const strapSrc = scene.getMeshByName('LegSupportStrap');
    const strapMir = scene.getMeshByName('LegSupportStrap_mir');
    if (strapSrc) strapSrc.setEnabled(state.legSupport);
    if (strapMir) strapMir.setEnabled(state.legSupport);
    // The anchored sling accessory (legSling.glb) is the rear-leg sling now.
    const slingSrc = scene.getMeshByName('LegSling');
    const slingMir = scene.getMeshByName('LegSling_mir');
    if (slingSrc) slingSrc.setEnabled(state.legSupport);
    if (slingMir) slingMir.setEnabled(state.legSupport);
    updateWeightStat();
  });

  // Collar — dog-mounted mesh (collar.glb, loaded + renamed 'Collar' in
  // setupDog). Driven by its Style toggle alone: it stays visible in
  // "Wheelchair only" too — it's part of the product, like the sling/strap.
  const collarToggle = $('#includeCollar');
  if (collarToggle) {
    collarToggle.addEventListener('change', (e) => {
      state.includeCollar = e.target.checked;
      const collarSrc = scene.getMeshByName('Collar');
      const collarMir = scene.getMeshByName('Collar_mir');
      if (collarSrc) collarSrc.setEnabled(state.includeCollar);
      if (collarMir) collarMir.setEnabled(state.includeCollar);
      updateWeightStat();
    });
  }

  // Back strap — keeps the dog in place over the lower back. No mesh in the
  // .glb yet; when it lands (probably "BackStrap"), the setEnabled lines
  // will start mattering, same deal as the collar.
  const backStrapToggle = $('#backStrap');
  if (backStrapToggle) {
    backStrapToggle.addEventListener('change', (e) => {
      state.backStrap = e.target.checked;
      const revBackStrap = $('#revBackStrap');
      if (revBackStrap) revBackStrap.textContent = state.backStrap ? tr('Yes') : tr('No');
      const strapSrc = scene.getMeshByName('BackStrap');
      const strapMir = scene.getMeshByName('BackStrap_mir');
      if (strapSrc) strapSrc.setEnabled(state.backStrap);
      if (strapMir) strapMir.setEnabled(state.backStrap);
      updateWeightStat();
    });
  }

  // Accessory price tags in the Style step read straight from pricing.js so
  // the chips never drift from what the quote actually charges.
  {
    const acc = window.Petwheels && window.Petwheels.pricing
      && window.Petwheels.pricing.config.accessories;
    if (acc) {
      $$('.acc-price[data-acc]').forEach((el) => {
        const price = acc[el.dataset.acc];
        if (typeof price === 'number') el.textContent = '+ R$ ' + price;
      });
    }
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
    if (revLeg) revLeg.textContent = state.legSupport ? tr('Yes') : tr('No');
    const revBackStrap = $('#revBackStrap');
    if (revBackStrap) revBackStrap.textContent = state.backStrap ? tr('Yes') : tr('No');
    const revCollar = $('#revCollar');
    if (revCollar) revCollar.textContent = state.includeCollar ? tr('Yes') : tr('No');
    const revProductType = $('#revProductType');
    if (revProductType) revProductType.textContent = tr(productTypeById(state.productType).name);
    // Price: estimated print weight × material cost × multiplier (pricing.js).
    const revPrice = $('#reviewPrice');
    if (revPrice) {
      const pricing = window.Petwheels && window.Petwheels.pricing;
      revPrice.textContent = pricing
        ? pricing.formatBRL(currentPriceCents())
        : '$' + (FALLBACK_PRICE_CENTS / 100).toFixed(0);
    }
    // Measurement rows share the active unit (cm/in); thickness is a × factor.
    $$('.rev-unit').forEach((e) => { e.textContent = state.unit; });
  }
  // Estimated printed weight of the whole chair (pricing.js curves). "≈"
  // because real prints vary with slicer settings — but it's close enough
  // for a vet to judge against the dog's size and strength.
  function updateWeightStat() {
    const q = currentQuote();
    const el = $('#statWeight');
    if (el) {
      el.textContent = !q ? '-'
        : q.totalGrams >= 1000 ? '≈ ' + (q.totalGrams / 1000).toFixed(2) + ' kg'
        : '≈ ' + q.totalGrams + ' g';
    }
    // Price sits beside the weight in the header now (same source as Review).
    const pEl = $('#statPrice');
    if (pEl) {
      const pricing = window.Petwheels && window.Petwheels.pricing;
      pEl.textContent = pricing
        ? pricing.formatBRL(currentPriceCents())
        : '$' + (FALLBACK_PRICE_CENTS / 100).toFixed(0);
    }
    updateDebugPanel(q);
  }

  // ---- TEMP pricing debug overlay (remove with the #vpDebug markup) ----
  // Per part: the normalized param values the calculator used, unit/total
  // grams, every weight-sheet row re-evaluated through the fitted curve
  // ("sheet check": sheet grams → model grams; these should match), and the
  // 0/1 corner weights the fit implies (incl. the extrapolated ones).
  const dbgPanel = $('#vpDebug');
  const dbgBody  = $('#vpDebugBody');
  const dbgBtn   = $('#vpDebugBtn');
  if (dbgBtn && dbgPanel) {
    dbgBtn.addEventListener('click', () => {
      dbgPanel.hidden = !dbgPanel.hidden;
      dbgBtn.classList.toggle('is-active', !dbgPanel.hidden);
      dbgBtn.setAttribute('aria-pressed', String(!dbgPanel.hidden));
      if (!dbgPanel.hidden) updateDebugPanel(currentQuote());
    });
  }

  function updateDebugPanel(q) {
    if (!dbgBody || !dbgPanel || dbgPanel.hidden) return;
    const pricing = window.Petwheels && window.Petwheels.pricing;
    if (!pricing || !q) { dbgBody.textContent = 'pricing.js not loaded'; return; }
    const L = (name) => name[0];                     // param → letter (scale→s …)
    const fmt = (x, d = 2) => (+x).toFixed(d);
    const mm = {
      scale:     state.measures.thigh  * 10,
      height:    state.measures.height * 10,
      length:    state.measures.length * 10,
      width:     state.measures.width  * 10,
      radius:    computeCurrentR(),
      thickness: state.measures.thickness,
    };

    let html = '<div class="dbg-sec">inputs (mm → normalized 0–1)</div>';
    html += '<div class="dbg-line">' + Object.keys(mm).map((k) =>
      L(k) + '=' + (k === 'thickness' ? fmt(mm[k]) : Math.round(mm[k])) +
      '→' + fmt(q.params[k], 3)).join('&ensp;') + '</div>';

    html += '<div class="dbg-sec">parts: ∛w linear fit, ^' + pricing.config.exponent + '</div>';
    for (const p of q.parts) {
      const atStr = p.params.map((n, i) => L(n) + '=' + fmt(p.at[i])).join(' ');
      html += '<div class="dbg-part"><b>' + p.label + '</b> ×' + p.qty +
        ' @ ' + atStr + ' → <b>' + fmt(p.unitGrams, 1) + ' g</b> each, ' +
        fmt(p.totalGrams, 1) + ' g</div>';
      const d = pricing.partDiagnostics(p.id);
      html += '<div class="dbg-rows">sheet: ' + d.rows.map((r) =>
        '[' + r.at.join(',') + ']' + r.sheet + '→' + r.model).join(' ') + '</div>';
      html += '<div class="dbg-rows">corners(' + d.params.map(L).join('') + '): ' +
        d.corners.map((c) => c.at.join('') + '→' + fmt(c.grams, 0)).join(' ') + '</div>';
    }
    const skipped = pricing.parts
      .filter((pp) => pp.optional && !q.parts.some((p) => p.id === pp.id));
    if (skipped.length) {
      html += '<div class="dbg-rows">excluded: ' + skipped.map((p) => p.label).join(', ') + '</div>';
    }

    html += '<div class="dbg-sec">totals</div>';
    html += '<div class="dbg-line">weight ' + q.totalGrams + ' g · material R$' +
      fmt(q.materialBRL) + ' × ' + pricing.config.priceMultiplier + ' = R$' +
      fmt(q.materialBRL * pricing.config.priceMultiplier) + '</div>';
    html += '<div class="dbg-line">accessories: ' + (q.accessories.length
      ? q.accessories.map((a) => a.id + ' +' + a.priceBRL).join(' ') : 'none') +
      ' → R$' + fmt(q.accessoriesBRL) + '</div>';
    html += '<div class="dbg-line"><b>price ' + pricing.formatBRL(q.priceCents) + '</b></div>';
    dbgBody.innerHTML = html;
  }
  // ---- end TEMP pricing debug ----

  updateChips();
  updateMeasureOutputs();
  updateReview();
  updateWeightStat();

  // ============ NAV SCROLL ============
  const nav = $('.nav');
  if (nav) {
    const onScroll = () => {
      nav.style.boxShadow = window.scrollY > 8 ? '0 6px 18px -10px rgba(15,18,38,.15)' : 'none';
      // Contact "tab": past the midpoint between the two page stops (hero top /
      // contact bottom) the header highlights Contact; before it, the current
      // screen tab. Flips mid-glide, exactly when the page is mostly footer.
      const max = document.documentElement.scrollHeight - window.innerHeight;
      const at = max > 40 && window.scrollY > max / 2;
      if (at !== navAtContact) {
        navAtContact = at;
        syncNavTabs();
      }
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // ============ ONE-SHOT PAGE SCROLL (desktop) ============
  // The page has exactly two stops: the customizer hero (top) and the contact
  // footer (bottom). On desktop, any wheel attempt at page scroll is swallowed
  // and replaced with a single eased glide to the other stop — no partial
  // native scrolling first. Wheel is left alone only when it belongs to
  // something else: an inner scroller that can still move in that direction
  // (panel steps, dropdown menus), or floating UI (modals, fixed menus).
  const DESKTOP = window.matchMedia('(min-width: 1101px)');
  // Self-driven eased glide (rAF tween). Native window.scrollTo smooth proved
  // unreliable here (janky/instant on this page), so we own the animation:
  // one ease-in-out flight per target, repeat gestures to the same target are
  // no-ops, and a reverse gesture mid-flight retargets from the current
  // position instead of being swallowed.
  let glideRaf = 0;
  let glideTarget = -1;
  const glidePage = (top) => {
    const max = Math.max(0, document.documentElement.scrollHeight - window.innerHeight);
    top = Math.max(0, Math.min(top, max));
    if (!DESKTOP.matches) {                       // mobile: keep native behavior
      window.scrollTo({ top, behavior: 'smooth' });
      return;
    }
    if (glideRaf && glideTarget === top) return;  // already flying there
    cancelAnimationFrame(glideRaf);
    glideRaf = 0;
    glideTarget = top;
    const from = window.scrollY;
    const dist = top - from;
    if (Math.abs(dist) < 1) { glideTarget = -1; return; }
    const DUR = 700;
    const ease = (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
    let start;
    const frame = (ts) => {
      if (start === undefined) start = ts;
      const t = Math.min(1, (ts - start) / DUR);
      // behavior:'instant' — the stylesheet's `html { scroll-behavior: smooth }`
      // would otherwise turn every frame's position write into its own native
      // smooth animation, and the tween never actually moves the page.
      window.scrollTo({ top: from + dist * ease(t), behavior: 'instant' });
      if (t < 1) {
        glideRaf = requestAnimationFrame(frame);
      } else {
        glideRaf = 0;
        glideTarget = -1;
      }
    };
    glideRaf = requestAnimationFrame(frame);
  };
  // EMBED DEVIATION: the site's wheel hijack (glide between the two page
  // stops) is NOT installed here. The embed is a single full-height hero
  // inside an iframe — preventDefault on wheel would stop the gesture from
  // chaining out to the portfolio page, trapping the visitor's scroll on the
  // 3D viewer. glidePage stays (navigate()/applyHash call it; it's a no-op
  // when the document doesn't scroll).

  // ============ LANGUAGE SWITCH ============
  // i18n.js re-writes the static DOM; this repaints everything script.js
  // renders dynamically, and re-seats the header nav pill (label widths
  // change with the language).
  window.addEventListener('pw:langchange', () => {
    try {
      updateReview();
      updateWeightStat();
      renderSwatches();
      syncNavTabs();
    } catch (_) { /* pre-init — nothing rendered yet */ }
  });

  // ============ SESSION SNAPSHOT (checkout round-trip) ============
  // The customizer has no server state — navigating to checkout.html and back
  // reloads the page. A sessionStorage snapshot written on pagehide and
  // replayed here (through the normal input handlers, so every side effect
  // fires) keeps the customization alive across that round-trip.
  const SNAP_KEY = 'pw:customizer';
  window.addEventListener('pagehide', () => {
    try {
      const mats = {};
      $$('.material-row').forEach((row) => {
        const sel = row.querySelector('.material-swatch-item.is-selected');
        if (sel && sel.dataset.color) mats[row.dataset.mat] = sel.dataset.color;
      });
      sessionStorage.setItem(SNAP_KEY, JSON.stringify({
        screen: state.screen,
        step: state.step,
        productType: state.productType,
        unit: state.unit,
        measures: { ...state.measures },
        legSupport: state.legSupport,
        backStrap: state.backStrap,
        includeCollar: state.includeCollar,
        mats,
      }));
    } catch (_) { /* storage unavailable — snapshot is best-effort */ }
  });

  // Replay a slider value through its real input handler (state, fills,
  // price, rig — every side effect fires). Shared by the session restore,
  // the share-link apply, and the toolbar's reset-measurements button.
  const replaySlider = (sel, v) => {
    const s = $(sel);
    if (s && typeof v === 'number' && !Number.isNaN(v)) {
      s.value = v;
      s.dispatchEvent(new Event('input', { bubbles: true }));
    }
  };

  {
    let snap = null;
    try { snap = JSON.parse(sessionStorage.getItem(SNAP_KEY) || 'null'); } catch (_) {}
    // Shared-configuration link (?c=<base64url JSON>, built by the share
    // button): decode it, let it OVERRIDE the session snapshot, and clean the
    // query off the address bar — from here the pagehide snapshot keeps the
    // config alive, and a reload won't re-apply a stale link.
    try {
      const c = new URLSearchParams(location.search).get('c');
      if (c) {
        const shared = JSON.parse(atob(c.replace(/-/g, '+').replace(/_/g, '/')));
        if (shared && typeof shared === 'object') {
          snap = { ...shared, screen: 'steps', step: 'measure' };
        }
        history.replaceState(null, '', location.pathname + location.hash);
      }
    } catch (_) { /* malformed link — ignore it */ }
    if (snap) {
      // Before the sliders replay: their input handlers recompute the price,
      // which depends on the product type. The dropdown (built later in this
      // file) initializes from state.productType, so this is all it needs.
      if (ACTIVE_PRODUCT_TYPES.some((p) => p.id === snap.productType)) {
        state.productType = snap.productType;
      }
      if (snap.unit && snap.unit !== state.unit) {
        $(`.unit-btn[data-unit="${snap.unit}"]`)?.click();
      }
      const m = snap.measures || {};
      replaySlider('#rangeLength', m.length);
      replaySlider('#rangeHeight', m.height);
      replaySlider('#rangeWidth', m.width);
      replaySlider('#rangeThigh', m.thigh);
      replaySlider('#rangeThickness', m.thickness);
      if (m.radiusManual) {
        $('#radiusLock')?.click();
        replaySlider('#rangeRadiusOffset', m.radiusOffset || 0);
      }
      [['legSupport', '#legSupport'], ['backStrap', '#backStrap'], ['includeCollar', '#includeCollar']]
        .forEach(([k, sel]) => {
          const el = $(sel);
          if (el && typeof snap[k] === 'boolean' && el.checked !== snap[k]) {
            el.checked = snap[k];
            el.dispatchEvent(new Event('change'));
          }
        });
      // Filament colors need rig.materials, which only exist after the GLB
      // loads — piggyback once on the chip-sync hook the loader calls.
      if (snap.mats && Object.keys(snap.mats).length) {
        const orig = window.__pwSyncMaterialChips;
        window.__pwSyncMaterialChips = () => {
          if (typeof orig === 'function') orig();
          Object.entries(snap.mats).forEach(([slot, hex]) => {
            document.querySelector(
              `.material-row[data-mat="${slot}"] .material-swatch-item[data-color="${hex}"]`
            )?.click();
          });
          window.__pwSyncMaterialChips = orig;
        };
      }
    }
    // Deep link from the subpage header tabs (index.html#measure/…). The
    // hash wins over the snapshot's remembered screen.
    const hash = (location.hash || '').slice(1);
    if (hash === 'measure' || hash === 'style' || hash === 'review') showScreen(hash);
    else if (hash === 'home') showScreen('welcome');
    else if (snap && snap.screen === 'steps') showScreen(snap.step || 'measure');
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

  // We drive ALL input ourselves (our own pointer listeners for rotation; no
  // Babylon camera control or mesh picking — camera.inputs is cleared below).
  // Babylon's InputManager otherwise attaches its own pointer listeners to the
  // canvas and preventDefaults them, which blocks the browser's touch-action
  // page scroll — so a vertical drag over the canvas wouldn't scroll on mobile.
  // Detach it (and disable the preventDefault flags) so touch-action works.
  scene.preventDefaultOnPointerDown = false;
  scene.preventDefaultOnPointerUp = false;
  try { scene.detachControl(); } catch (_) {}
  // Babylon's engine sets `canvas.style.touchAction = 'none'` INLINE, which beats
  // our stylesheet rule — so re-assert pan-y inline here (last write wins). This
  // is what actually lets a vertical touch drag scroll the page while a
  // horizontal drag rotates the model.
  canvas.style.touchAction = 'pan-y';

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
  // Set ALLOW_PEEK = false to disable the vertical (up/down) tilt entirely — the
  // model then only does the 360° Y spin. Flip back to true to restore it.
  const ALLOW_PEEK = false;
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
  let modelHorizRadius = null;  // half the model's XZ diagonal — sizes the scale-ref circle
  let userZoomFactor  = 1.0;
  let camGoalRadius   = null;

  // Vertical zoom slider (left of the viewport). A 0–100 position maps to
  // userZoomFactor on a GEOMETRIC scale, so the default (factor 1.0) lands near
  // the middle: pos 100 (top) = most zoomed IN (ZOOM_FACTOR_MIN), pos 0 (bottom)
  // = most zoomed OUT (ZOOM_FACTOR_MAX). Two-way bound with the wheel/pinch.
  const ZOOM_SLIDER_MAX = 100;
  let zoomSlider = null;   // assigned in the viewport-controls section
  const zoomFactorFromSlider = (pos) =>
    ZOOM_FACTOR_MAX * Math.pow(ZOOM_FACTOR_MIN / ZOOM_FACTOR_MAX, pos / ZOOM_SLIDER_MAX);
  const sliderFromZoomFactor = (z) =>
    ZOOM_SLIDER_MAX * Math.log(z / ZOOM_FACTOR_MAX) / Math.log(ZOOM_FACTOR_MIN / ZOOM_FACTOR_MAX);
  // Reflect the current factor onto the slider (position + fill). Skipped while
  // the user is dragging the slider so their own input isn't fought.
  const syncZoomSlider = () => {
    if (!zoomSlider || document.activeElement === zoomSlider) return;
    const pos = Math.max(0, Math.min(ZOOM_SLIDER_MAX, sliderFromZoomFactor(userZoomFactor)));
    zoomSlider.value = String(pos);
    zoomSlider.style.setProperty('--p', pos + '%');
  };

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
    syncZoomSlider();
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
      !(m.metadata && m.metadata.scaleRef) &&
      m.getTotalVertices && m.getTotalVertices() > 0;

    const invMR = BABYLON.Matrix.Invert(modelRoot.getWorldMatrix());
    let minX = Infinity, minY = Infinity, minZ = Infinity;
    let maxX = -Infinity, maxY = -Infinity, maxZ = -Infinity;
    // Wheelchair-only XZ extents (dog excluded) — sizes the scale-ref circle.
    let wMinX = Infinity, wMinZ = Infinity, wMaxX = -Infinity, wMaxZ = -Infinity;
    const tmp = new BABYLON.Vector3();
    scene.meshes.forEach((m) => {
      if (!predicate(m)) return;
      if (m.morphTargetManager) {
        try { m.refreshBoundingInfo({ applyMorph: true }); }
        catch (_) { try { m.refreshBoundingInfo(false, true); } catch (__) {} }
      }
      m.computeWorldMatrix(true);
      const isDog = /dog/i.test(m.name);
      const corners = m.getBoundingInfo().boundingBox.vectorsWorld;
      for (let i = 0; i < corners.length; i++) {
        BABYLON.Vector3.TransformCoordinatesToRef(corners[i], invMR, tmp);
        if (tmp.x < minX) minX = tmp.x;
        if (tmp.y < minY) minY = tmp.y;
        if (tmp.z < minZ) minZ = tmp.z;
        if (tmp.x > maxX) maxX = tmp.x;
        if (tmp.y > maxY) maxY = tmp.y;
        if (tmp.z > maxZ) maxZ = tmp.z;
        if (!isDog) {
          if (tmp.x < wMinX) wMinX = tmp.x;
          if (tmp.z < wMinZ) wMinZ = tmp.z;
          if (tmp.x > wMaxX) wMaxX = tmp.x;
          if (tmp.z > wMaxZ) wMaxZ = tmp.z;
        }
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
    // Half the WHEELCHAIR-only horizontal (XZ) diagonal — the radius that
    // circumscribes just the chassis footprint (dog excluded). Drives the
    // scale-ref props' circle so they sit just outside the wheelchair regardless
    // of the current measurements. Falls back to the full span if, somehow, no
    // wheelchair mesh was measured.
    const wSpan = (isFinite(wMinX) && isFinite(wMaxX))
      ? Math.sqrt((wMaxX - wMinX) * (wMaxX - wMinX) + (wMaxZ - wMinZ) * (wMaxZ - wMinZ))
      : horizontalSpan;
    modelHorizRadius = wSpan * 0.5;
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
  // Side-flip: when true, the length/height/thigh annotations jump between the
  // mirror halves as the model rotates so they always face the camera. Disabled
  // for now — the lines stay on their fixed halves in every view. Flip back to
  // true to restore the camera-facing behavior.
  const DIM_FLIP_SIDES = false;
  // Desktop: hovering anywhere on a measurement field (label, "?", slider,
  // value) lights the matching 3D line, exactly like hovering the line itself.
  let dimFieldHover = null;
  $$('.step-body[data-body="measure"] .field[data-mfield]').forEach((f) => {
    f.addEventListener('mouseenter', () => { dimFieldHover = f.dataset.mfield; });
    f.addEventListener('mouseleave', () => {
      if (dimFieldHover === f.dataset.mfield) dimFieldHover = null;
    });
  });
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
    // The raw 3D LINES mesh is only a projection source — the thigh line the user
    // sees is the SVG overlay (drawn from this mesh each frame). Never render the
    // mesh itself. isVisible=false keeps its world matrix + Scale morph live (so
    // thighSeg can still read them) while keeping it out of the picture entirely.
    mesh.isVisible = false;
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

  // Measurement locks: when a pet is selected in the Measure step, its saved
  // measurements are authoritative — sliders, typed fields AND the 3D overlay
  // drags are frozen for the locked keys. account.js drives this via
  // window.Petwheels.setMeasureLocks; applyMeasures bypasses with force=true.
  const measureLocks = {};
  window.Petwheels = window.Petwheels || {};
  window.Petwheels.setMeasureLocks = (locks) => {
    ['length', 'height', 'width', 'thigh'].forEach((k) => {
      const on = !!(locks && locks[k]);
      measureLocks[k] = on;
      const slider = $('#range' + capKey(k));
      const input = $('#val' + capKey(k));
      if (slider) {
        slider.disabled = on;
        slider.closest('.field')?.classList.toggle('is-locked', on);
      }
      if (input) input.disabled = on;
    });
  };

  function setMeasure(key, value, force = false) {
    if (measureLocks[key] && !force) return;
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
    updateWeightStat();
    if (key === 'height') syncRadiusOffsetRange();
    if (rig) rig.update();
  }

  // Non-passive touchmove blocker, live only while a dim drag runs: without
  // it the browser can claim the gesture for page scrolling mid-drag and fire
  // pointercancel — the "drags a tiny bit and stops" glitch on phones.
  // (touch-action: none on the SVG hit targets is not honored everywhere.)
  const blockDimTouchScroll = (e) => { if (dimDrag) e.preventDefault(); };
  const endDimDrag = () => {
    if (!dimDrag) return;
    dimDrag = null;
    window.removeEventListener('pointermove', onDimDragMove);
    window.removeEventListener('pointerup', endDimDrag);
    window.removeEventListener('pointercancel', endDimDrag);
    window.removeEventListener('touchmove', blockDimTouchScroll);
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
    window.addEventListener('pointercancel', endDimDrag);
    window.addEventListener('touchmove', blockDimTouchScroll, { passive: false });
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
    // With the side-flip disabled the thigh outline stays permanently on the
    // MIRROR half — the side it showed in the default view back when it
    // flipped with the camera. (Length/height keep their own fixed halves.)
    const mirror = DIM_FLIP_SIDES
      ? BABYLON.Vector3.DistanceSquared(cMirror, camPos) > cWorldDist
      : true;
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
    // Show whenever the ruler toggle is on and the dog is solved — on ANY screen
    // (welcome included), so turning measures on before "Start customizing" still
    // draws the lines. The measures work with OR without the dog visible (the
    // dog's vertices are still solved when it's hidden), so this doesn't key off
    // dog view either.
    if (!dog || !dog.ready || !state.measuresVisible) {
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
    const useMirror = DIM_FLIP_SIDES && dist2(toWorld(mirrorLocal(hL))) < dist2(toWorld(hL));
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
      // Dimmed by default; lit (value shown) while hovering the line/bullets,
      // while this dimension is being dragged, while its panel field is
      // hovered (desktop), or while it's the selected mobile measurement tab.
      const lit = d.hoverCount > 0 || (dimDrag && dimDrag.rec === d) ||
        d.key === dimFieldHover ||
        (MOBILE_PANEL_MQ.matches && state.step === 'measure' && d.key === mobileMeasureTab);
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

  // ============ MODEL ASSETS ============
  // Central loader for the 3D models: one fetch per model, shared by every
  // consumer (the SceneLoader AND the raw binary parsers both want
  // petwheels/petwheelsDog).
  //
  // OBFUSCATION (currently OFF — plain .glb names, so a fresh Blender export
  // dropped into assets/ just works): to hide the models again, rename each
  // file to something meaningless, point MODEL_FILES at the new names, set
  // MODEL_XOR to a byte (e.g. 0x7C), and scramble each file with:
  //   python -c "import sys; d=open(sys.argv[1],'rb').read(); open(sys.argv[2],'wb').write(bytes(b^0x7C for b in d))" in.glb out.bin
  const MODEL_FILES = {
    'petwheels.glb':    'assets/petwheels.glb',
    'petwheelsDog.glb': 'assets/petwheelsDog.glb',
    'backStap.glb':     'assets/backStap.glb',
    'legSling.glb':     'assets/legSling.glb',
    'person.glb':       'assets/person.glb',
    'ball.glb':         'assets/ball.glb',
    'collar.glb':       'assets/collar.glb',
  };
  const MODEL_XOR = 0;   // 0 = plain files, no descramble pass
  const modelBufs = new Map();   // semantic name → Promise<ArrayBuffer>
  const fetchModel = (name) => {
    if (!modelBufs.has(name)) {
      modelBufs.set(name, (async () => {
        const res = await fetch(MODEL_FILES[name] || 'assets/' + name);
        if (!res.ok) throw new Error(`${name}: fetch failed (${res.status})`);
        const u8 = new Uint8Array(await res.arrayBuffer());
        if (MODEL_XOR) for (let i = 0; i < u8.length; i++) u8[i] ^= MODEL_XOR;
        return u8.buffer;
      })());
    }
    return modelBufs.get(name);
  };
  // Blob-URL wrapper for the Babylon loaders. Pass '.glb' as pluginExtension
  // at the call site — a blob URL has no extension for the loader to sniff.
  const modelUrl = async (name) =>
    URL.createObjectURL(new Blob([await fetchModel(name)]));

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
  async function parseDogMarkers(ab) {
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
    // COLOR_4/5 are the accessory anchor groups (BackStrapColor /
    // LegSlingColor) — multi-vertex regions, so those two use the MEAN of
    // every marked vertex instead of the single brightest one.
    const SEMANTIC_BY_INDEX = ['height', 'width', 'length', 'ground', 'backstrap', 'legsling'];
    // every vertex whose color reads bright (r+g+b past half of white)
    const markedViSet = (ai) => {
      const a = g.accessors[ai], nc = ncOf[a.type], bv = g.bufferViews[a.bufferView];
      const cs = cSize[a.componentType], stride = bv.byteStride || cs * nc;
      const base = binOffset + (bv.byteOffset || 0) + (a.byteOffset || 0);
      const white = a.componentType === 5126 ? 1 : a.componentType === 5123 ? 65535 : 255;
      const out = [];
      for (let vi = 0; vi < a.count; vi++) {
        let sum = 0;
        for (let c = 0; c < Math.min(nc, 3); c++) sum += readC(base + vi * stride + c * cs, a.componentType);
        if (sum > 1.5 * white) out.push(vi);
      }
      return out.length ? out : [markedVi(ai)];
    };
    const colorKeys = Object.keys(prim.attributes)
      .filter((k) => /^COLOR_/.test(k))
      .sort((a, b) => (+a.split('_')[1]) - (+b.split('_')[1]));
    const roles = {};    // morph-control vertices, for the length/width solve (by dominant morph)
    const markers = {};  // semantic measurement anchors, for the overlay + height solve (by color index)
    colorKeys.forEach((k, idx) => {
      const sem = SEMANTIC_BY_INDEX[idx];
      const vis = idx >= 4 ? markedViSet(prim.attributes[k]) : [markedVi(prim.attributes[k])];
      const avg = (fn) => {
        const s = [0, 0, 0];
        vis.forEach((vi) => { const v = fn(vi); s[0] += v[0]; s[1] += v[1]; s[2] += v[2]; });
        return s.map((x) => x / vis.length);
      };
      const d = {};
      prim.targets.forEach((t, ti) => { d[names[ti] || ('M' + ti)] = avg((vi) => accVec3(t.POSITION, vi)); });
      const entry = {
        vi: vis[0], base: V(avg((vi) => accVec3(POS, vi))),
        d: { Height: V(d.Height || [0,0,0]), Length: V(d.Length || [0,0,0]),
             Width: V(d.Width || [0,0,0]), Scale: V(d.Scale || [0,0,0]) },
      };
      // Overlay: which measurement this marker annotates (explicit Blender order).
      if (sem) markers[sem] = entry;
      // Solver: which morph drives this vertex (so the length/width weight solve
      // can move it). Ground + accessory markers stay out of the heuristic so
      // they can't clobber a length/width role.
      if (['height', 'length', 'width'].includes(sem)) {
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
    const baseM = {}, dM = {};   // overlay + height solve + accessory anchors
    ['height', 'length', 'width'].forEach((role) => {
      baseL[role] = T(R[role].base);   dL[role] = deltas(R[role]);
    });
    // Accessory markers (backstrap / legsling) ride along when the dog glb
    // carries them — same math, they just don't participate in the solve.
    const markerRoles = ['height', 'length', 'width', 'ground', 'backstrap', 'legsling']
      .filter((role) => Rm[role]);
    markerRoles.forEach((role) => {
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

    // The collar rides the dog: same four morphs, same solved weights.
    if (dog.collar) {
      const c = dog.collar.targets;
      if (c.scale)  c.scale.influence  = wS;
      if (c.height) c.height.influence = wH;
      if (c.length) c.length.influence = wL;
      if (c.width)  c.width.influence  = wW;
    }

    // Store the three SEMANTIC marker vertices (Blender Height/Width/LengthColor)
    // in modelRoot-local space for the overlay. These are distinct from the
    // morph-control vertices the solver used above, but follow the same solved
    // weights — applying the global morph weights to each marker's own deltas
    // gives its true post-morph position.
    markerRoles.forEach((role) => {
      if (!dog.localFinal[role]) dog.localFinal[role] = new BABYLON.Vector3();
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

    // Collar mirror: identical treatment (its transform matches the dog's, but
    // compute from its own matrix so the two can never drift apart).
    if (dog.collar && dog.collar.inst) {
      dog.collar.mesh.computeWorldMatrix(true);
      const cRootM = dog.collar.mesh.getWorldMatrix().multiply(MRinv);
      const cs = new BABYLON.Vector3(), cq = new BABYLON.Quaternion(), ct = new BABYLON.Vector3();
      cRootM.decompose(cs, cq, ct);
      dog.collar.inst.position.copyFrom(ct);
      dog.collar.inst.rotationQuaternion.copyFrom(cq);
      dog.collar.inst.scaling.copyFrom(cs);
      dog.collar.inst.computeWorldMatrix(true);
    }
  }

  // Load + wire the dog: parse markers, append to scene, recolor white, parent
  // to the chassis origin, mirror, and hook into the rig's update cycle.
  async function setupDog() {
    try {
      const parsed = await parseDogMarkers(await fetchModel('petwheelsDog.glb'));
      const roles = parsed && parsed.roles, markers = parsed && parsed.markers;
      if (!roles || !roles.height || !roles.length || !roles.width
          || !markers || !markers.height || !markers.length || !markers.width || !markers.ground) {
        console.warn('[dog] marker parse incomplete — skipping', parsed);
        return;
      }
      await BABYLON.SceneLoader.AppendAsync('', await modelUrl('petwheelsDog.glb'), scene, undefined, '.glb');
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
      mat.metallic = 0.35; mat.roughness = 0.5; mat.backFaceCulling = false;
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

      // ---- collar (collar.glb): a second dog-driven mesh ----
      // Authored exactly like the dog (same half-mesh convention, same origin
      // translation, same 4 morphs) but exported separately so it keeps its
      // own material and can be toggled from the Style step. It never solves
      // anything — updateDog copies the dog's solved weights onto it.
      try {
        // ImportMeshAsync (NOT Append + scene diff): setupAccessories loads
        // concurrently with this, so a scene-wide diff can capture the strap/
        // sling meshes — res.meshes is scoped to THIS file only.
        const cRes = await BABYLON.SceneLoader.ImportMeshAsync(
          '', '', await modelUrl('collar.glb'), scene, undefined, '.glb');
        const cMesh = cRes.meshes.find((x) => x.morphTargetManager && x.morphTargetManager.numTargets >= 3)
          || cRes.meshes.find((x) => x.getTotalVertices && x.getTotalVertices() > 0);
        if (cMesh) {
          const cRoot = cMesh.parent;
          cMesh.name = 'Collar';   // the Style toggle looks it up by this name
          if (petwheels) {
            cMesh.parent = petwheels;
            cMesh.position.set(0, 0, 0);   // same doubled-translation fix as the dog
          }
          if (cRoot && cRoot !== petwheels && cRoot.name === '__root__'
              && (!cRoot.getChildMeshes || cRoot.getChildMeshes().length === 0)) {
            try { cRoot.dispose(); } catch (_) {}
          }
          let cInst = null;
          if (mirrorRoot) {
            cInst = cMesh.createInstance('Collar_mir');
            cInst.parent = mirrorRoot;
            cInst.rotationQuaternion = new BABYLON.Quaternion();
            cInst.alwaysSelectAsActiveMesh = true;
          }
          const cTargets = {};
          const cMgr = cMesh.morphTargetManager;
          if (cMgr) for (let i = 0; i < cMgr.numTargets; i++) {
            const t = cMgr.getTarget(i);
            cTargets[dogNorm(t.name)] = t;
          }
          dog.collar = { mesh: cMesh, inst: cInst, targets: cTargets };
          console.log('[collar] ready', { mesh: cMesh.name, targets: Object.keys(cTargets) });
        } else {
          console.warn('[collar] no mesh found in collar.glb');
        }
      } catch (e) {
        console.warn('[collar] load failed — continuing without it', e);
      }

      // Hook into the rig so every slider change re-solves the dog. Guard the
      // dog step so a solver error can never break the wheelchair's update.
      if (rig && typeof rig.update === 'function') {
        // rig.update now defers its step-7 framing to us so the frame is
        // computed ONCE, with the dog already at its new pose. Otherwise the
        // pivot locks onto the dog's previous pose (orbits off-centre) and the
        // bbox gets rebuilt twice per event (the "fight"/stutter on param drag).
        dogFramesAfterSolve = true;
        const orig = rig.update;
        rig.update = function () {
          orig.apply(this, arguments);   // step 7 skipped — deferred to here
          try { updateDog(); } catch (e) { console.error('[dog] update failed', e); }
          if (modelRoot) { try { frameCamera(); } catch (_) {} }
        };
      }
      updateDog();
      dog.ready = true;
      window.PW = window.PW || {};
      window.PW.dog = dog;
      window.PW.updateDog = updateDog;
      // Honour the current view tab and frame instantly (no fly-in on load).
      applyDogVisibility(true);
      // Bring in the real-world scale props, sharing the dog's material.
      // Awaited so the boot sequence's reveal includes them — un-awaited
      // they popped in after the loading screen was gone.
      await setupScaleRefs(mat);
      console.log('[dog] ready', {
        roles: Object.keys(roles).reduce((o, k) => (o[k] = roles[k].vi, o), {}),
        targets: Object.keys(targets), floorLocalY: +dog.floorLocalY.toFixed(4),
        weights: dog.weights,
      });
    } catch (e) {
      console.error('[dog] setup failed', e);
    }
  }

  // ============ ANCHORED ACCESSORIES (backStap.glb + legSling.glb) ============
  // Soft parts that glue themselves to the chair AND the dog every frame:
  //
  //   BackStrap — its root sits on the chair's BackStrap_Anchor. The 'X'
  //     morph is solved so the strap's BackStrap_X marker reaches the
  //     MIRRORED anchor (the strap spans both chair halves); the 'Z' morph
  //     so BackStrap_Z reaches the dog's BackStrapColor vertex group.
  //     The marker meshes carry no morphs of their own, so each solve uses
  //     the strap mesh's morph deltas sampled at the marker's basis spot.
  //
  //   LegSling — its root sits on the LegSupport's LegSlingColor vertex
  //     group (COLOR_1; Babylon only surfaces COLOR_0, so the indices come
  //     from a raw glb parse and the live positions from the LegSupport's
  //     CPU-morph buffer). Its X/Y/Z morphs are solved as a 3×3 system so
  //     the LegSlingAnchor mesh (which shares the morphs) lands on the
  //     dog's LegSlingColor group. Mirrored for the other leg.
  //
  // Solved on every frame (scene.onBeforeRenderObservable) — the math is a
  // handful of matrix inversions on 24-vertex helpers, so ordering against
  // rig.update / updateDog never matters and the anchors can't lag a frame.
  let acc = null;

  // Raw-glb reader (same trick as parseDogMarkers): the marked vertex sets of
  // EVERY COLOR_n attribute on the LegSupport. Blender doesn't guarantee the
  // export order of color attributes (one re-export swapped MirrorEdges and
  // LegSlingColor), so the caller classifies the sets geometrically instead
  // of trusting the index. Vertex order in the binary matches what Babylon
  // loaded, so the indices map straight onto legCpu's buffers.
  async function parseLegSupportColorSets(ab) {
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
    const node = (json.nodes || []).find((n) => n.name === 'LegSupport' && n.mesh != null);
    if (!node) return null;
    const prim = json.meshes[node.mesh].primitives[0];
    const ncOf = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4 };
    const cSize = { 5121: 1, 5123: 2, 5126: 4 };
    const keys = Object.keys(prim.attributes || {})
      .filter((k) => /^COLOR_/.test(k))
      .sort((x, y) => (+x.split('_')[1]) - (+y.split('_')[1]));
    return keys.map((k) => {
      const a = json.accessors[prim.attributes[k]];
      const bv = json.bufferViews[a.bufferView];
      const nc = ncOf[a.type] || 4, cs = cSize[a.componentType] || 4;
      const stride = bv.byteStride || cs * nc;
      const base = binOffset + (bv.byteOffset || 0) + (a.byteOffset || 0);
      const read = (p) => a.componentType === 5126 ? dv.getFloat32(p, true)
        : a.componentType === 5123 ? dv.getUint16(p, true) / 65535
        : dv.getUint8(p) / 255;
      const out = [];
      for (let vi = 0; vi < a.count; vi++) {
        let sum = 0;
        for (let c = 0; c < Math.min(nc, 3); c++) sum += read(base + vi * stride + c * cs);
        if (sum > 1.5) out.push(vi);
      }
      return out;
    });
  }

  // Morph-aware world-space bounding-box centre of a helper mesh.
  const accCenterWorld = (mesh) => {
    mesh.computeWorldMatrix(true);
    try { mesh.refreshBoundingInfo({ applyMorph: true }); }
    catch (_) { try { mesh.refreshBoundingInfo(false, true); } catch (__) {} }
    return mesh.getBoundingInfo().boundingBox.centerWorld.clone();
  };

  async function setupAccessories() {
    try {
      if (!modelRoot) return;
      const PWn = (window.PW && window.PW.nodes) || {};
      const mirrorRoot = PWn.mirrorRoot;

      // Holder pattern (same as the scale props): a TransformNode we position
      // drives each accessory; the imported __root__ keeps its glTF
      // handedness conversion as a child. CRITICAL: the authored group node
      // inside each glb carries the WORLD position it was modeled at
      // (BackStrapGroup ~ (0.05, 0.23, 0)) — zero it, exactly like the dog
      // loader does, or every accessory floats by that offset no matter
      // where the holder goes.
      const loadGroup = async (file, holderName, groupName) => {
        const res = await BABYLON.SceneLoader.ImportMeshAsync('', '', await modelUrl(file), scene, undefined, '.glb');
        const root = res.meshes.find((m) => m.name === '__root__') || res.meshes[0];
        const holder = new BABYLON.TransformNode(holderName, scene);
        holder.parent = modelRoot;
        // Hidden until the boot sequence finishes the first full solve —
        // otherwise the accessory flashes at its authored spot and inflates
        // the camera framing while everything is still settling.
        holder.setEnabled(false);
        if (root) root.parent = holder;
        // Zero the authored group translation (see note above). It may load
        // as a TransformNode or a Mesh depending on the exporter. Remember
        // which SIDE (sign of x) the group was authored on — the strap needs
        // it to know when to mirror itself across.
        const group = scene.getTransformNodeByName(groupName) || scene.getMeshByName(groupName);
        let authoredX = 1, renderedSideX = 1;
        if (group) {
          authoredX = group.position.x >= 0 ? 1 : -1;
          // Which side does the AUTHORED accessory land on AS RENDERED
          // (after the glTF __root__ X-mirror)? On that side the geometry
          // must be counter-mirrored to look exactly as authored; on the
          // opposite side the conversion's mirror is the wanted one.
          group.computeWorldMatrix(true);
          modelRoot.computeWorldMatrix(true);
          const gl = BABYLON.Vector3.TransformCoordinates(
            group.getAbsolutePosition(),
            BABYLON.Matrix.Invert(modelRoot.getWorldMatrix()));
          renderedSideX = gl.x >= 0 ? 1 : -1;
          group.position.set(0, 0, 0);
        } else console.warn('[accessories] group node missing in ' + file + ': ' + groupName);
        console.log('[accessories] ' + file + ' loaded: '
          + res.meshes.map((m) => m.name + '(' + (m.getTotalVertices ? m.getTotalVertices() : 0) + 'v'
            + (m.morphTargetManager ? ',morphs' : '') + ')').join(' '));
        return { holder, meshes: res.meshes, authoredX, renderedSideX };
      };
      const strapLoad = await loadGroup('backStap.glb', 'BackStrapHolder', 'BackStrapGroup');
      const slingLoad = await loadGroup('legSling.glb', 'LegSlingHolder', 'LegSlingGroup');
      const strapHolder = strapLoad.holder, slingHolder = slingLoad.holder;

      // Resolve a part from ITS OWN import: exact node name, the loader's
      // multi-material split ("<name>_primitive0"), or a geometry child of a
      // transform node carrying the name — whatever this Babylon build did.
      const resolveIn = (meshes, name) => {
        let m = meshes.find((x) => x.name === name);
        if (m && (!m.getTotalVertices || m.getTotalVertices() > 0)) return m;
        const holderNode = m;   // 0-vert parent (split mesh) — try its children
        m = meshes.find((x) => x.name === name + '_primitive0');
        if (m) return m;
        if (holderNode && holderNode.getChildMeshes) {
          const kid = holderNode.getChildMeshes(true).find((x) => x.getTotalVertices() > 0);
          if (kid) return kid;
        }
        return meshes.find((x) => x.parent && x.parent.name === name
          && x.getTotalVertices && x.getTotalVertices() > 0) || holderNode || null;
      };
      const fromScene = (name) => {
        const m = scene.getMeshByName(name);
        if (m) return m;
        const n = scene.getTransformNodeByName(name);
        if (n && n.getChildMeshes) {
          return n.getChildMeshes(true).find((x) => x.getTotalVertices() > 0) || null;
        }
        return null;
      };

      const strap  = resolveIn(strapLoad.meshes, 'BackStrap');
      const strapX = resolveIn(strapLoad.meshes, 'BackStrap_X');
      const strapZ = resolveIn(strapLoad.meshes, 'BackStrap_Z');
      const sling  = resolveIn(slingLoad.meshes, 'LegSling');
      const slingA = resolveIn(slingLoad.meshes, 'LegSlingAnchor');
      const chairAnchor = fromScene('BackStrap_Anchor');
      const legSupportMesh = fromScene('LegSupport');
      if (!strap || !strapX || !strapZ || !sling || !slingA || !chairAnchor || !legSupportMesh) {
        console.warn('[accessories] nodes missing — skipping ' + JSON.stringify({
          strap: strap && strap.name, strapX: strapX && strapX.name,
          strapZ: strapZ && strapZ.name, sling: sling && sling.name,
          slingA: slingA && slingA.name, chairAnchor: chairAnchor && chairAnchor.name,
          legSupport: legSupportMesh && legSupportMesh.name,
        }));
        return;
      }
      console.log('[accessories] resolved ' + JSON.stringify({
        strap: strap.name, strapX: strapX.name, strapZ: strapZ.name,
        sling: sling.name, slingA: slingA.name,
      }));

      // Marker/anchor meshes are helpers — never rendered, never framed.
      [strapX, strapZ, slingA, chairAnchor].forEach((m) => { m.isVisible = false; });

      // Which way does the strap actually SPAN as rendered? The glTF
      // __root__ handedness conversion mirrors X, so the Blender-side sign
      // of the group can't be trusted — measure the root→tip direction in
      // modelRoot space while the holder is still untouched at the origin.
      modelRoot.computeWorldMatrix(true);
      const MRinv0 = BABYLON.Matrix.Invert(modelRoot.getWorldMatrix());
      const tip0 = BABYLON.Vector3.TransformCoordinates(accCenterWorld(strapX), MRinv0);
      strapHolder.computeWorldMatrix(true);
      const root0 = BABYLON.Vector3.TransformCoordinates(strapHolder.getAbsolutePosition(), MRinv0);
      const strapDirX0 = (tip0.x - root0.x) >= 0 ? 1 : -1;

      // The soft parts keep their AUTHORED materials (per Artur) — do not
      // rebind them to the m4 fabric slot, so the Style swatches leave the
      // strap/sling fabric look alone.

      const findTarget = (mesh, nm) => {
        const g = mesh.morphTargetManager;
        if (!g) return null;
        for (let i = 0; i < g.numTargets; i++) {
          const t = g.getTarget(i);
          if ((t.name || '').toLowerCase() === nm) return t;
        }
        return null;
      };

      // ---- strap solve data (captured at the basis pose: influences are 0) ----
      strap.computeWorldMatrix(true);
      const sInv0 = BABYLON.Matrix.Invert(strap.getWorldMatrix());
      const A0x = BABYLON.Vector3.TransformCoordinates(accCenterWorld(strapX), sInv0);
      const A0z = BABYLON.Vector3.TransformCoordinates(accCenterWorld(strapZ), sInv0);
      const sPos = strap.getVerticesData(BABYLON.VertexBuffer.PositionKind) || [];
      // Mean morph delta over the K strap vertices nearest a marker — that's
      // how much the morph moves the strap AT the marker.
      const meanDeltaNear = (positions, targetPos, P, K = 30) => {
        const n = positions.length / 3, ds = [];
        for (let vi = 0; vi < n; vi++) {
          const dx = positions[vi * 3] - P.x, dy = positions[vi * 3 + 1] - P.y, dz = positions[vi * 3 + 2] - P.z;
          ds.push([dx * dx + dy * dy + dz * dz, vi]);
        }
        ds.sort((x, y) => x[0] - y[0]);
        const v = new BABYLON.Vector3();
        const k = Math.min(K, ds.length);
        for (let i = 0; i < k; i++) {
          const vi = ds[i][1];
          v.x += targetPos[vi * 3]     - positions[vi * 3];
          v.y += targetPos[vi * 3 + 1] - positions[vi * 3 + 1];
          v.z += targetPos[vi * 3 + 2] - positions[vi * 3 + 2];
        }
        return v.scaleInPlace(1 / Math.max(1, k));
      };
      const tX = findTarget(strap, 'x'), tZ = findTarget(strap, 'z');
      const tS = findTarget(strap, 'scale');
      const DX = tX ? meanDeltaNear(sPos, tX.getPositions(), A0x) : null;
      const DZ = tZ ? meanDeltaNear(sPos, tZ.getPositions(), A0z) : null;
      // Scale displacement AT each marker — subtracted from the solve target
      // so the X/Z weights don't fight the chair-driven Scale morph.
      const DSx = tS ? meanDeltaNear(sPos, tS.getPositions(), A0x) : null;
      const DSz = tS ? meanDeltaNear(sPos, tS.getPositions(), A0z) : null;

      // ---- sling solve data (the anchor mesh carries its own X/Y/Z morphs) ----
      const meanAll = (arr) => {
        const v = new BABYLON.Vector3();
        for (let i = 0; i < arr.length; i += 3) { v.x += arr[i]; v.y += arr[i + 1]; v.z += arr[i + 2]; }
        return v.scaleInPlace(3 / Math.max(3, arr.length));
      };
      const aPos = slingA.getVerticesData(BABYLON.VertexBuffer.PositionKind) || [];
      const b0 = meanAll(aPos);
      const aT = { x: findTarget(slingA, 'x'), y: findTarget(slingA, 'y'), z: findTarget(slingA, 'z'),
                   scale: findTarget(slingA, 'scale') };
      const sT = { x: findTarget(sling, 'x'), y: findTarget(sling, 'y'), z: findTarget(sling, 'z'),
                   scale: findTarget(sling, 'scale') };
      const dOf = (t) => t ? meanAll(t.getPositions()).subtractInPlace(b0) : new BABYLON.Vector3();
      const AD = { x: dOf(aT.x), y: dOf(aT.y), z: dOf(aT.z), scale: dOf(aT.scale) };

      // The chair's live Scale weight, read off the Main mesh's own morph so
      // the accessories always agree with whatever the rig applied.
      const mainMesh = fromScene('Main');
      const chairScaleT = mainMesh ? findTarget(mainMesh, 'scale') : null;

      // The chair-side mount: LegSupport vertices painted LegSlingColor.
      // Classify the two color groups GEOMETRICALLY — the MirrorEdges set is
      // the one hugging the sagittal plane (root-local x ≈ 0) at basis; the
      // sling mount sits out on the bar. If the export shuffled the COLOR
      // order, hot-swap the CPU snap's vertex set too, or the snap clamps
      // the sling mount onto the plane and deforms the LegSupport.
      let rootIdx = null;
      const colorSets = await parseLegSupportColorSets(await fetchModel('petwheels.glb'));
      const lc0 = window.PW && window.PW.legCpu;
      if (colorSets && colorSets.length >= 2 && lc0 && lc0.basisPos) {
        legSupportMesh.computeWorldMatrix(true);
        modelRoot.computeWorldMatrix(true);
        const toRoot = legSupportMesh.getWorldMatrix()
          .multiply(BABYLON.Matrix.Invert(modelRoot.getWorldMatrix()));
        const meanAbsX = (set) => {
          if (!set.length) return Infinity;
          let s = 0;
          const v = new BABYLON.Vector3();
          set.forEach((vi) => {
            v.set(lc0.basisPos[vi * 3], lc0.basisPos[vi * 3 + 1], lc0.basisPos[vi * 3 + 2]);
            s += Math.abs(BABYLON.Vector3.TransformCoordinates(v, toRoot).x);
          });
          return s / set.length;
        };
        const a0 = meanAbsX(colorSets[0]), a1 = meanAbsX(colorSets[1]);
        const mirrorIdx = a0 <= a1 ? colorSets[0] : colorSets[1];
        rootIdx = a0 <= a1 ? colorSets[1] : colorSets[0];
        const cur = new Set(lc0.whiteIdx || []);
        const same = mirrorIdx.length === cur.size && mirrorIdx.every((vi) => cur.has(vi));
        if (!same) {
          console.warn('[accessories] LegSupport color groups were swapped in the export — '
            + 'reassigning MirrorEdges (' + (lc0.whiteIdx || []).length + ' → '
            + mirrorIdx.length + ' verts) and re-snapping');
          lc0.whiteIdx = mirrorIdx;
          if (rig && typeof rig.update === 'function') rig.update();
        }
      } else if (colorSets && colorSets.length === 1) {
        rootIdx = colorSets[0];   // single group — nothing to disambiguate
      }

      // Mirrored sling for the other leg (the strap spans — no mirror needed).
      let slingInst = null;
      if (mirrorRoot) {
        slingInst = sling.createInstance('LegSling_mir');
        slingInst.parent = mirrorRoot;
        slingInst.rotationQuaternion = new BABYLON.Quaternion();
        slingInst.alwaysSelectAsActiveMesh = true;
        slingInst.setEnabled(false);   // instances don't inherit the holder's state
      }

      acc = { strapHolder, slingHolder, strap, sling, slingA, chairAnchor,
              legSupportMesh, A0x, A0z, DX, DZ, DSx, DSz, tX, tZ, tS,
              b0, AD, aT, sT, chairScaleT, rootIdx, slingInst, strapDirX0,
              slingRenderedX: slingLoad.renderedSideX };

      // Reveal happens in the boot sequence (after the first full solve),
      // honouring whatever the Style toggles say by then.
      acc.applyToggles = () => {
        strapHolder.setEnabled(true);
        slingHolder.setEnabled(true);
        strap.setEnabled(state.backStrap !== false);
        sling.setEnabled(state.legSupport !== false);
        if (slingInst) slingInst.setEnabled(state.legSupport !== false);
      };

      scene.onBeforeRenderObservable.add(updateAccessories);
      window.PW = window.PW || {};
      window.PW.acc = acc;
      window.PW.updateAccessories = updateAccessories;
      console.log('[accessories] ready', {
        slingRootVerts: rootIdx ? rootIdx.length : 0,
        strapTargets: { X: !!tX, Z: !!tZ },
        slingTargets: { X: !!aT.x, Y: !!aT.y, Z: !!aT.z },
      });
    } catch (e) {
      console.error('[accessories] setup failed', e);
    }
  }

  // Debug: `PW.accDebug = true` in the console streams the solve state once
  // a second; the first few frames always log so a broken boot is visible.
  let _accFrames = 0;
  let _accLastLog = 0;
  let _accLastErr = 0;
  function _accLog(payload) {
    const now = performance.now();
    const wantsIt = (window.PW && window.PW.accDebug) || _accFrames <= 3;
    if (!wantsIt || now - _accLastLog < 1000) return;
    _accLastLog = now;
    console.log('[accessories]', payload);
  }

  const _accV = new BABYLON.Vector3();
  function updateAccessories() {
    if (!acc || !modelRoot) return;
    _accFrames++;
    try {
      modelRoot.computeWorldMatrix(true);
      const MR = modelRoot.getWorldMatrix();
      const MRinv = BABYLON.Matrix.Invert(MR);

      // The chair's live Scale weight drives the accessories' bulk too — the
      // strap/sling thicken with the chair instead of staying basis-sized.
      const wS = acc.chairScaleT ? acc.chairScaleT.influence : 0;
      if (acc.tS) acc.tS.influence = wS;
      if (acc.sT.scale) acc.sT.scale.influence = wS;
      if (acc.aT.scale) acc.aT.scale.influence = wS;

      // ---- BackStrap: root on the chair anchor ----
      const aw = accCenterWorld(acc.chairAnchor);
      const al = BABYLON.Vector3.TransformCoordinates(aw, MRinv);
      acc.strapHolder.position.copyFrom(al);
      // The strap must always span INWARD, across the sagittal plane toward
      // the mirrored anchor. Its rendered root→tip direction was measured at
      // load (strapDirX0); flip the holder whenever that direction doesn't
      // point away from the anchor's side.
      acc.strapHolder.scaling.x = -(al.x >= 0 ? 1 : -1) * acc.strapDirX0;
      acc.strapHolder.computeWorldMatrix(true);
      acc.strap.computeWorldMatrix(true);
      const sInv = BABYLON.Matrix.Invert(acc.strap.getWorldMatrix());

      // X morph: BackStrap_X reaches the MIRRORED anchor (modelRoot-local X
      // flip). The marker's position is A0 + wS·DS + wX·DX, so the Scale
      // displacement is subtracted from the target before solving for wX.
      if (acc.tX && acc.DX) {
        const lm = BABYLON.Vector3.TransformCoordinates(aw, MRinv);
        lm.x = -lm.x;
        const tw = BABYLON.Vector3.TransformCoordinates(lm, MR);
        const tl = BABYLON.Vector3.TransformCoordinates(tw, sInv).subtractInPlace(acc.A0x);
        if (acc.DSx) tl.subtractInPlace(acc.DSx.scale(wS));
        const d2 = acc.DX.lengthSquared();
        // Floor at 0: the Scale morph moves the tip along nearly the same
        // axis as X, so a slight Scale overshoot would otherwise drive X
        // NEGATIVE and fold the tip back on itself.
        if (d2 > 1e-12) {
          acc.tX.influence = Math.min(3, Math.max(0, BABYLON.Vector3.Dot(tl, acc.DX) / d2));
        }
      }
      // Z morph: BackStrap_Z reaches the dog's BackStrapColor group.
      if (acc.tZ && acc.DZ && dog && dog.ready && dog.localFinal.backstrap) {
        const tw = BABYLON.Vector3.TransformCoordinates(dog.localFinal.backstrap, MR);
        const tl = BABYLON.Vector3.TransformCoordinates(tw, sInv).subtractInPlace(acc.A0z);
        if (acc.DSz) tl.subtractInPlace(acc.DSz.scale(wS));
        const d2 = acc.DZ.lengthSquared();
        if (d2 > 1e-12) {
          acc.tZ.influence = Math.min(3, Math.max(-1, BABYLON.Vector3.Dot(tl, acc.DZ) / d2));
        }
      }

      // ---- LegSling: root on the LegSupport's LegSlingColor group ----
      // Live positions come from the LegSupport's CPU-morph output buffer.
      const lc = window.PW && window.PW.legCpu;
      if (acc.rootIdx && acc.rootIdx.length && lc && lc.outPos && lc.outPos.length) {
        _accV.set(0, 0, 0);
        for (const vi of acc.rootIdx) {
          _accV.x += lc.outPos[vi * 3];
          _accV.y += lc.outPos[vi * 3 + 1];
          _accV.z += lc.outPos[vi * 3 + 2];
        }
        _accV.scaleInPlace(1 / acc.rootIdx.length);
        acc.legSupportMesh.computeWorldMatrix(true);
        const rw = BABYLON.Vector3.TransformCoordinates(_accV, acc.legSupportMesh.getWorldMatrix());
        const rl = BABYLON.Vector3.TransformCoordinates(rw, MRinv);
        // The LegSupport SOURCE half sits on the +X (right) side, but the
        // sling is authored for the LEFT side — the one the dog half
        // occupies. Mirror the mount across the sagittal plane so the source
        // sling lands on the dog's side; the hardware instance (reflected by
        // mirrorRoot) then covers the right leg.
        const slingSide = (dog && dog.ready && dog.localFinal.legsling)
          ? (Math.sign(dog.localFinal.legsling.x) || -1) : -1;
        rl.x = slingSide * Math.abs(rl.x);
        acc.slingHolder.position.copyFrom(rl);
        // Chirality: the glTF conversion X-mirrors the geometry AND the side
        // it lands on, which cancel out — the conversion's own mirror is
        // already the correct handedness for the side the source sits on
        // (buckle on the OUTER face); counter-mirroring is needed only when
        // we FORCE the sling onto the opposite side of where it rendered.
        // (Empirically pinned: the inverse mapping put both buckles inboard.)
        // The hardware instance reflects the source again, keeping the pair.
        acc.slingHolder.scaling.x = (slingSide === acc.slingRenderedX) ? 1 : -1;
        acc.slingHolder.computeWorldMatrix(true);
      }

      // X/Y/Z morphs: LegSlingAnchor lands on the dog's LegSlingColor group.
      // Anchor position is linear in the three weights → one 3×3 solve.
      if (dog && dog.ready && dog.localFinal.legsling && acc.aT.x && acc.aT.y && acc.aT.z) {
        acc.slingA.computeWorldMatrix(true);
        const aInv = BABYLON.Matrix.Invert(acc.slingA.getWorldMatrix());
        const tw = BABYLON.Vector3.TransformCoordinates(dog.localFinal.legsling, MR);
        const t = BABYLON.Vector3.TransformCoordinates(tw, aInv).subtractInPlace(acc.b0);
        // Remove the Scale morph's own displacement of the anchor before the
        // X/Y/Z solve, so the weights don't compensate for the scaling.
        if (acc.AD.scale) t.subtractInPlace(acc.AD.scale.scale(wS));
        const a = acc.AD.x, b = acc.AD.y, c = acc.AD.z;
        const det = a.x * (b.y * c.z - b.z * c.y)
                  - b.x * (a.y * c.z - a.z * c.y)
                  + c.x * (a.y * b.z - a.z * b.y);
        if (Math.abs(det) > 1e-12) {
          const wx = (t.x * (b.y * c.z - b.z * c.y) - b.x * (t.y * c.z - t.z * c.y) + c.x * (t.y * b.z - t.z * b.y)) / det;
          const wy = (a.x * (t.y * c.z - t.z * c.y) - t.x * (a.y * c.z - a.z * c.y) + c.x * (a.y * t.z - a.z * t.y)) / det;
          const wz = (a.x * (b.y * t.z - b.z * t.y) - b.x * (a.y * t.z - a.z * t.y) + t.x * (a.y * b.z - a.z * b.y)) / det;
          const put = (tg, w) => { if (tg && isFinite(w)) tg.influence = w; };
          // "Wheelchair only": no visible leg to reach for, so the sling keeps
          // its authored pose on X and Y (both morphs neutral) and follows the
          // dog only on Z. Full view applies the complete solve.
          const chairOnly = state.dogVisible === false;
          const wxUsed = chairOnly ? 0 : wx;
          const wyUsed = chairOnly ? 0 : wy;
          put(acc.aT.x, wxUsed); put(acc.aT.y, wyUsed); put(acc.aT.z, wz);
          put(acc.sT.x, wxUsed); put(acc.sT.y, wyUsed); put(acc.sT.z, wz);
        }
      }

      // Mirror instance copies the sling's in-root transform (mirrorRoot's
      // −X scaling reflects it), like every other mirrored mesh.
      if (acc.slingInst) {
        acc.sling.computeWorldMatrix(true);
        const m = acc.sling.getWorldMatrix().multiply(MRinv);
        const ts = new BABYLON.Vector3(), tq = new BABYLON.Quaternion(), tt = new BABYLON.Vector3();
        m.decompose(ts, tq, tt);
        acc.slingInst.position.copyFrom(tt);
        acc.slingInst.rotationQuaternion.copyFrom(tq);
        acc.slingInst.scaling.copyFrom(ts);
      }

      const r3 = (v) => v && v.asArray().map((x) => +x.toFixed(3));
      _accLog({
        anchorWorld: r3(aw),
        strapHolder: r3(acc.strapHolder.position),
        wX: acc.tX && +acc.tX.influence.toFixed(3),
        wZ: acc.tZ && +acc.tZ.influence.toFixed(3),
        slingHolder: r3(acc.slingHolder.position),
        slingFlip: acc.slingHolder.scaling.x,
        slingRenderedX: acc.slingRenderedX,
        slingW: acc.aT.x && [acc.aT.x, acc.aT.y, acc.aT.z].map((t) => t && +t.influence.toFixed(3)),
        dogReady: !!(dog && dog.ready),
        dogBackstrap: dog && dog.localFinal.backstrap && r3(dog.localFinal.backstrap),
        dogLegsling: dog && dog.localFinal.legsling && r3(dog.localFinal.legsling),
        slingRootVerts: acc.rootIdx ? acc.rootIdx.length : 0,
      });
    } catch (e) {
      // Keep the render loop alive, but never silently — throttled.
      const now = performance.now();
      if (now - _accLastErr > 2000) {
        _accLastErr = now;
        console.error('[accessories] frame update failed', e);
      }
    }
  }

  // ============ SCALE-REFERENCE PROPS (person + ball) ============
  // Two real-world props — a standing person (back-right) and a ball
  // (back-left) — parked on an invisible ground circle centred on the
  // wheelchair. They give the user a sense of the real-world size of the
  // wheelchair. Both are world-fixed (follow the camera, stay behind the chair,
  // tilt with the vertical-drag peek). The circle radius tracks the
  // wheelchair's own footprint (dog excluded) plus a fixed clearance, so it
  // grows/shrinks with the wheelchair and the props never overlap it.
  //
  // Because the camera is fixed and only the MODEL spins on drag, we keep these
  // props WORLD-fixed (not parented to modelRoot) and re-place them every frame
  // off the camera's own basis, so they always stay "behind" the wheelchair and
  // never rotate out of view — i.e. they follow the camera in 360°.
  //
  // They reuse the dog's PBR material (white, metallic 0.35) and are flagged
  // metadata.scaleRef so frameCamera's bbox ignores them (otherwise the camera
  // would zoom out to fit a 1.7 m person and shrink the wheelchair to nothing).
  //
  // Tunables — adjust to taste. Both props ride the same camera-relative ground
  // circle (centred on camera.target, radius ∝ the wheelchair's own footprint),
  // but with independent clearance + angle so the person stands well back and
  // the ball tucks in close.
  const SCALE_REF_SCALE    = 1.0;         // uniform scale applied to each prop
  const SCALE_REF_R_FACTOR = 1.0;         // circle radius = this × the wheelchair's horizontal bbox radius + offset
  const SCALE_REF_YAW      = Math.PI / 4; // extra yaw (rad) added on top of facing the camera (45°)
  // Person — stands well clear, behind the chair.
  const PERSON_R_OFFSET    = 0.60;        // clearance (m) added to the footprint radius
  const PERSON_R_MIN       = 0.40;        // hard floor on the radius (m)
  const PERSON_SPREAD      = 0.60;        // angle (rad) off dead-centre-back (~34° → mostly behind)
  // Ball — tucked in close, on the OTHER side, a bit forward.
  const BALL_R_OFFSET      = 0.10;        // small clearance (m) → sits just outside the chair
  const BALL_R_MIN         = 0.20;        // hard floor on the radius (m)
  const BALL_SPREAD        = 1.00;        // angle (rad) off dead-centre-back (~57° → back-left, beside the chair)

  let scaleRefRoot   = null;
  let scaleRefPerson = null;   // holder TransformNode (world-fixed, right side)
  let scaleRefBall   = null;   // holder TransformNode (world-fixed, left side)

  async function setupScaleRefs(sharedMat) {
    try {
      // World-fixed anchor (no parent → lives in world space, ignores the
      // model's drag rotation).
      scaleRefRoot = new BABYLON.TransformNode('ScaleRefRoot', scene);

      const loadProp = async (file, holderName, parentNode) => {
        const res = await BABYLON.SceneLoader.ImportMeshAsync('', '', await modelUrl(file), scene, undefined, '.glb');
        const root = res.meshes.find((m) => m.name === '__root__') || res.meshes[0];
        // A holder we own drives position + rotation; the imported __root__
        // stays a child so its glTF coordinate-conversion transform is intact.
        const holder = new BABYLON.TransformNode(holderName, scene);
        holder.parent = parentNode;
        holder.scaling.setAll(SCALE_REF_SCALE);
        if (root) root.parent = holder;
        res.meshes.forEach((m) => {
          if (!m.getTotalVertices || m.getTotalVertices() === 0) return;
          if (sharedMat) m.material = sharedMat;   // same material as the dog
          m.metadata = Object.assign({}, m.metadata, { scaleRef: true });
          m.isPickable = false;
        });
        return holder;
      };

      // Both props are world-fixed (follow the camera, stay behind the chair,
      // tilt with the peek) — the person on the right, the ball on the left.
      scaleRefPerson = await loadProp('person.glb', 'ScaleRef_person', scaleRefRoot);
      scaleRefBall   = await loadProp('ball.glb',   'ScaleRef_ball',   scaleRefRoot);
      updateScaleRefs();
    } catch (e) {
      console.warn('[scaleRef] setup failed — are the person/ball model assets in website/assets/?', e);
    }
  }

  // Re-place the props on the ground circle every frame. sideSign +1 = the
  // camera's right, -1 = the camera's left; both sit "behind" (into the scene).
  const _srBack  = new BABYLON.Vector3();
  const _srRight = new BABYLON.Vector3();
  const _srD     = new BABYLON.Vector3();
  const _srQPeek = new BABYLON.Quaternion();
  const _srQFace = new BABYLON.Quaternion();
  const placeScaleProp = (holder, sideSign, rOffset, rMin, spread) => {
    if (!holder) return;
    // Radius tracks the wheelchair's own footprint, plus a fixed clearance so
    // the prop never overlaps the chair, whatever the current measurements.
    const wheelR = (modelHorizRadius != null ? modelHorizRadius : rMin);
    const R = Math.max(rMin, wheelR * SCALE_REF_R_FACTOR + rOffset);
    const cosA = Math.cos(spread);
    const sinA = sideSign * Math.sin(spread);
    // Rest position on the ground circle, centred on the camera's own pivot
    // (camera.target) so it shares the exact point the view rotates around — the
    // prop then stays glued behind the wheelchair instead of drifting on spin.
    const x = camera.target.x + R * (cosA * _srBack.x + sinA * _srRight.x);
    const z = camera.target.z + R * (cosA * _srBack.z + sinA * _srRight.z);
    // Face the camera, then add the fixed yaw so the prop reads at an angle.
    const yaw = Math.atan2(camera.position.x - x, camera.position.z - z) + SCALE_REF_YAW;

    // Apply the SAME "peek" tilt the wheelchair gets on a vertical drag, pivoting
    // about camera.target. camera.target tracking cancels the model's translation,
    // so on screen the chassis appears to tip about that point — matching the peek
    // here makes the prop tip *with* it instead of sliding. peekX and _srRight are
    // exactly the axis/angle the model-rotation code uses, so the two stay in sync.
    // (The 360° Y-spin is deliberately NOT applied — the prop must stay in view.)
    BABYLON.Quaternion.RotationAxisToRef(_srRight, peekX, _srQPeek);
    _srD.set(x - camera.target.x, -camera.target.y, z - camera.target.z);
    _srD.rotateByQuaternionToRef(_srQPeek, _srD);
    holder.position.set(camera.target.x + _srD.x, camera.target.y + _srD.y, camera.target.z + _srD.z);

    BABYLON.Quaternion.RotationAxisToRef(BABYLON.Axis.Y, yaw, _srQFace);
    holder.rotationQuaternion = holder.rotationQuaternion || new BABYLON.Quaternion();
    _srQPeek.multiplyToRef(_srQFace, holder.rotationQuaternion);   // face first, then tilt
  };
  function updateScaleRefs() {
    if (!scaleRefPerson && !scaleRefBall) return;
    // Force the camera to resolve its transform for THIS frame first. We run
    // before scene.render(), and tickCameraFollow just changed camera.target /
    // radius — but camera.position and camera.getDirection() are lazy and still
    // hold last frame's values until the view matrix rebuilds. Reading them
    // stale here (then rendering with the fresh ones) is what makes the props
    // flicker. getViewMatrix(true) rebuilds position/basis now, so the props are
    // placed with the exact camera state the frame is about to render with.
    camera.getViewMatrix(true);
    // "Behind" = camera → target, projected onto the ground plane.
    _srBack.copyFrom(camera.target).subtractInPlace(camera.position);
    _srBack.y = 0;
    if (_srBack.lengthSquared() < 1e-6) _srBack.set(0, 0, 1);
    _srBack.normalize();
    _srRight.copyFrom(camera.getDirection(BABYLON.Axis.X));
    _srRight.y = 0;
    if (_srRight.lengthSquared() < 1e-6) _srRight.set(1, 0, 0);
    _srRight.normalize();
    placeScaleProp(scaleRefPerson, +1, PERSON_R_OFFSET, PERSON_R_MIN, PERSON_SPREAD); // person → far, back-right
    placeScaleProp(scaleRefBall,   -1, BALL_R_OFFSET,   BALL_R_MIN,   BALL_SPREAD);   // ball → close, forward-left
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
  // Height_min/_max (+ legacy Height_low/_high), Height_mid (Buttons,
  // Hardware_1), Scale_min/_max, Scale_mid + Scale_max_1/_2 (Arm, ArmHub),
  // Radius, Thickness. There is no "Width" morph — Width only shifts the root
  // in X (= half the separation between the mirrored halves; the LegSupport
  // stretches inward to meet the plane).
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
      // No direct weight here anymore: the sidebar family's Length morph is
      // solved geometrically per frame (see solveSidebarLength) so that the
      // Main-origin → SideBarBand-center distance equals Lmm − 80·sf.

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

      // ---- Progressive Scale_mid → Scale_max handoff (Arm family) ----
      // On meshes that carry a Scale_mid key, scaling up from the 200 mm basis
      // uses Scale_mid ALONE until the halfway point, then hands off linearly
      // to the Scale_max key(s) so mid + max always sums to the upward weight:
      //   sUp ≤ 0.5 : mid = sUp,     max = 0
      //   sUp > 0.5 : mid = 1 − sUp, max = 2·sUp − 1   (at sUp=1: mid 0, max 1)
      const sUp       = scaleMax;                    // upward-normalized thigh scale
      const scaleMid  = Math.min(sUp, 1 - sUp);
      const scaleMaxT = Math.max(0, 2 * sUp - 1);    // total Scale_max component
      // Arm/ArmHub split that max between two sculpts by the height-up weight:
      // Scale_max_1 is the low-height sculpt (active when Height_max = 0, incl.
      // heights below basis), Scale_max_2 the tall one (Height_max = 1); a mid
      // height blends them linearly — e.g. hhigh 0.5 → 0.25 + 0.25.
      const scaleMax1 = scaleMaxT * (1 - hhigh);
      const scaleMax2 = scaleMaxT * hhigh;
      // Same progressive handoff for meshes carrying Height_mid (Buttons,
      // Hardware_1): Height_mid first, then their single Height_max.
      const hhighMid  = Math.min(hhigh, 1 - hhigh);
      const hhighMaxT = Math.max(0, 2 * hhigh - 1);

      const radius    = clamp01(lerpInv(R, PARAM.radiusMorph.min, PARAM.radiusMorph.max));
      const thickness = clamp01(lerpInv(m.thickness, PARAM.thickness.min, PARAM.thickness.max));
      return { scale, scaleMin, scaleMax, hlow, hhigh,
               scaleMid, scaleMaxT, scaleMax1, scaleMax2, hhighMid, hhighMaxT,
               radius, thickness, sf,
               Wmm, Hmm, Tmm, Lmm, R, autoR, displayedHmm };
    }

    // ---- Locate nodes from the glb (names from Blender outliner) ----
    const getNode = (n) => scene.getTransformNodeByName(n) || scene.getMeshByName(n);
    const getMesh = (n) => scene.getMeshByName(n);
    // A part exported with more than one material is split by the glTF loader
    // into a geometry-less parent node plus one child mesh per primitive
    // (e.g. Rim_primitive0/1). Resolve a part name to every mesh that actually
    // carries geometry — the single mesh for a one-material part, or the split
    // children for a multi-material one — so mirroring covers them all. The
    // primitive children are direct children of the base node, so sibling parts
    // (ArmHub next to Arm, Tire next to Rim) are never picked up by mistake.
    const getMeshes = (n) => {
      const base = getNode(n);
      if (!base) return [];
      const out = [];
      if (typeof base.getTotalVertices === 'function' && base.getTotalVertices() > 0) {
        out.push(base);
      }
      base.getChildMeshes(true).forEach((m) => {
        if (m.getTotalVertices() > 0) out.push(m);
      });
      return out;
    };

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
    // SeatHole1–4Ref are exempt: since the re-export they carry the actual
    // seat-fixation screw geometry, so they render as visible hardware.
    const refMeshes = scene.meshes.filter((m) =>
      /Ref$/.test(m.name) && !/^SeatHole/i.test(m.name));
    refMeshes.forEach((m) => { m.isVisible = false; });

    // Visible parts that make up the right half. The mirror creates the left.
    // SideBarScrew + the SeatHole screws keep their original .glb materials
    // (not listed in MATERIAL_SLOTS), like the Hardware_* parts.
    const visibleNames = ['Arm', 'ArmHub', 'Buttons', 'LegSupport', 'LegSupportStrap',
                          'Main', 'Seat', 'SideBar', 'SideBarBand_R', 'SideBarScrew',
                          'Rim', 'Tire',
                          'SeatHole1Ref', 'SeatHole2Ref', 'SeatHole3Ref', 'SeatHole4Ref'];
    // Hardware_* parts keep their original .glb material (they're deliberately
    // excluded from MATERIAL_SLOTS below), but they still belong to the right
    // half, so include them in the mirror. Matched by prefix so any future
    // Hardware_N is picked up automatically.
    const hardwareMeshes = scene.meshes.filter((m) =>
      m && /^Hardware/i.test(m.name) &&
      m.getTotalVertices && m.getTotalVertices() > 0);
    const visibleMeshes = visibleNames.flatMap(getMeshes).concat(hardwareMeshes);

    // ---- 4 shared style materials ----
    // The .glb arrives with per-mesh materials (including baked ColorAtlas
    // ones). We replace them with 4 flat PBR slots seeded from SLOT_DEFAULTS —
    // the default Style filament set — so the wheelchair shows the intended
    // default look on boot, not the raw .glb materials. The Style step then
    // re-tints a whole slot (one swatch row → one material → many meshes).
    //
    // Assignment uses getMeshes (not getMesh) so multi-material parts that the
    // glTF loader split into <name>_primitive0/1 all get the slot material —
    // otherwise the split Rim/Arm primitives would keep their raw .glb atlas.
    //
    // NOTE: Hardware_* parts are intentionally NOT listed in any slot, so they
    // keep their original .glb material and are never restyled.
    //
    // Add or move a mesh between slots by editing this map — no other code
    // needs to change. Mirror instances follow automatically because they
    // share their source's material. "Buttons" are printed in TPU, so they
    // ride the flexible slot (m4) with the tire/seat.
    const MATERIAL_SLOTS = {
      m1: ['Rim', 'Arm', 'Main', 'SideBarBand_R'],
      m2: ['ArmHub', 'LegSupport'],
      m3: ['SideBar'],
      m4: ['Tire', 'Seat', 'LegSupportStrap', 'Buttons'],
    };
    const styleMats = {};
    Object.entries(MATERIAL_SLOTS).forEach(([slot, names]) => {
      const meshes = names.flatMap(getMeshes);
      const mat = new BABYLON.PBRMaterial('petwheels_' + slot, scene);
      // Flat filament look from the slot default (sRGB hex → linear albedo),
      // no textures — this matches exactly what the Style swatch handler sets
      // when the user later picks a filament.
      const def = SLOT_DEFAULTS[slot];
      mat.albedoColor = BABYLON.Color3.FromHexString(def.hex).toLinearSpace();
      mat.metallic    = def.metallic;
      mat.roughness   = def.roughness;
      mat.backFaceCulling = false;
      styleMats[slot] = mat;
      meshes.forEach((m) => { if (m) m.material = mat; });
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
      const tHH    = findTarget((n) => n === 'heighthigh' || n === 'heightmax');

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

    // ---- SideBar Length solve: precompute the band's morph-center deltas ----
    // The sidebar family's Length weight isn't a direct slider mapping: it's
    // whatever weight puts the SideBarBand's geometric center at exactly
    // (Length − 80·sf) mm from the Main part's origin. Morph targets are
    // additive, so the band's mesh-local center is linear in every weight:
    //   c_local(wLen) = cBasis + Σ otherW_i·dMean_i + wLen·dMeanLen
    // We cache the basis mean + per-target mean deltas once; the per-frame
    // solve is then a quadratic in wLen on the world-space segment.
    const sideBarBand = getMesh('SideBarBand_R');
    const mainPartNode = getNode('Main');
    let bandSolve = null;
    if (sideBarBand && sideBarBand.morphTargetManager && mainPartNode) {
      const meanV = (arr) => {
        let x = 0, y = 0, z = 0;
        const nV = arr.length / 3;
        for (let i = 0; i < arr.length; i += 3) { x += arr[i]; y += arr[i + 1]; z += arr[i + 2]; }
        return new BABYLON.Vector3(x / nV, y / nV, z / nV);
      };
      const cBasis = meanV(sideBarBand.getVerticesData(POSITION) || []);
      const mgrB = sideBarBand.morphTargetManager;
      const others = [];   // non-Length targets: { t, d } (d = mean delta)
      let dLen = null;
      for (let i = 0; i < mgrB.numTargets; i++) {
        const t = mgrB.getTarget(i);
        const d = meanV(t.getPositions()).subtract(cBasis);
        if (normName(t.name) === 'length') dLen = d;
        else others.push({ t, d });
      }
      if (dLen) bandSolve = { cBasis, dLen, others };
      console.log('[Petwheels rig] sidebar length solve wired:', { ok: !!bandSolve });
    }

    // Solve |bandCenter(wLen) − MainOrigin| = (Lmm − 80·sf) mm. Must run AFTER
    // applyInfluences (the "other" weights are read live) and after the
    // sidebar group is positioned — the node's world matrix is morph-
    // independent, so one closed-form solve is exact, no iteration needed.
    function solveSidebarLength(w) {
      if (!bandSolve) return 0;
      sideBarBand.computeWorldMatrix(true);
      const M = sideBarBand.getWorldMatrix();
      const cLocal = bandSolve.cBasis.clone();
      for (const { t, d } of bandSolve.others) cLocal.addInPlace(d.scale(t.influence));
      const c0  = BABYLON.Vector3.TransformCoordinates(cLocal, M);
      const dir = BABYLON.Vector3.TransformNormal(bandSolve.dLen, M);
      mainPartNode.computeWorldMatrix(true);
      const e = c0.subtract(mainPartNode.getAbsolutePosition());
      const T = (w.Lmm - 80 * w.sf) * MM_TO_M;
      // |e + wLen·dir|² = T²  →  a·wLen² + b·wLen + c = 0; the +√disc root is
      // the one where distance grows along the morph direction.
      const a = BABYLON.Vector3.Dot(dir, dir);
      const b = 2 * BABYLON.Vector3.Dot(e, dir);
      const c = BABYLON.Vector3.Dot(e, e) - T * T;
      let wLen = 0;
      if (a > 1e-12) {
        const disc = b * b - 4 * a * c;
        if (disc >= 0) wLen = (-b + Math.sqrt(disc)) / (2 * a);
      }
      return clamp01(wLen);   // ≤ 0 → 0 (per spec); >1 capped like every morph
    }

    // Write the solved weight onto every Length target of the sidebar family.
    const sidebarLenMeshes = ['SideBar', 'SideBarBand_R', 'SideBarScrew'].flatMap(getMeshes);
    function applySidebarLength(wLen) {
      sidebarLenMeshes.forEach((mesh) => {
        const mgr = mesh.morphTargetManager;
        if (!mgr) return;
        for (let i = 0; i < mgr.numTargets; i++) {
          const t = mgr.getTarget(i);
          if (normName(t.name) === 'length') t.influence = wLen;
        }
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
        // Meshes that carry a *_mid key use the progressive mid→max handoff;
        // meshes without it keep the legacy full-range weight on their plain
        // Scale_max / Height_max (e.g. WheelCenterRef, LegSupport).
        let hasScaleMid = false, hasHeightMid = false;
        for (let i = 0; i < mgr.numTargets; i++) {
          const tn = normName(mgr.getTarget(i).name);
          if (tn === 'scalemid')  hasScaleMid  = true;
          if (tn === 'heightmid') hasHeightMid = true;
        }
        for (let i = 0; i < mgr.numTargets; i++) {
          const t = mgr.getTarget(i);
          const n = normName(t.name);
          let v;
          switch (n) {
            // Legacy single shape keys (basis = the params.py min for that param).
            case 'scale':      v = w.scale;    break;
            // Length (sidebar family) is solved geometrically after the groups
            // are positioned — see solveSidebarLength in update(). Skip here.
            case 'length':     v = null;       break;
            // Height: legacy names (Height_low/_high) and renamed (Height_min/_max)
            // share the same numeric weight (basis = 250 mm midpoint).
            case 'heightlow':
            case 'heightmin':  v = w.hlow;     break;
            case 'heighthigh':
            case 'heightmax':  v = hasHeightMid ? w.hhighMaxT : w.hhigh; break;
            case 'heightmid':  v = w.hhighMid;  break;
            // Scale split (basis = 200 mm midpoint), on Arm / ArmHub / Buttons /
            // Hardware_1 / WheelCenterRef.
            case 'scalemin':   v = w.scaleMin; break;
            case 'scalemid':   v = w.scaleMid; break;
            case 'scalemax':   v = hasScaleMid ? w.scaleMaxT : w.scaleMax; break;
            // Arm/ArmHub: the Scale_max component split by the height-up weight.
            case 'scalemax1':  v = w.scaleMax1; break;
            case 'scalemax2':  v = w.scaleMax2; break;
            case 'radius':
              // Rim's Radius shape key is authored inverted (1=min, 0=max).
              // A multi-material Rim is split by the glTF loader into
              // Rim_primitive0/1 (the base "Rim" becomes a geometry-less
              // parent), so match "Rim" as a substring. Nothing else in the
              // model carries "Rim" in its name.
              // Hardware_2 (the wheel-hub axle/bolt, mesh Rim_R.001) shares the
              // SAME inverted Radius shape key, so it has to invert too — its
              // node name doesn't contain "Rim", so match it explicitly.
              v = (mesh.name.includes('Rim') || mesh.name.includes('Hardware_2'))
                    ? (1 - w.radius) : w.radius;
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
      //    Pivot Y uses the DISPLAYED (uncompensated) height, not Hmm. The
      //    wheel-radius height compensation lives ONLY in the morph weights
      //    (hlow/hhigh from Hmm), which reshape the arm and slide the wheel
      //    centre. Driving the whole-chassis pivot with Hmm too would move the
      //    frame (and the dog parented to it) up/down as the wheel grows — the
      //    frame should stay put (attached to the dog) while the wheel centre
      //    is what moves. So keep the pivot at the true height; the wheel rides
      //    the arm morph instead.
      petwheels.position.set(
        (w.Wmm / 2 + 53 * w.sf) * MM_TO_M,
        (0.82 * w.displayedHmm) * MM_TO_M,
        0,
      );
      petwheels.computeWorldMatrix(true);

      // 4) Track refs. Order matters because WheelCenterRef lives under
      //    ArmGroup, so the arm has to be in place before we read its center.
      positionGroupToRef(armGroup,     refUpperLegAxis, offArm);
      positionGroupToRef(legGroup,     refLegSupport,   offLeg);
      positionGroupToRef(sidebarGroup, refSideBarCtr,   offSidebar);
      positionGroupToRef(wheelGroup,   refWheelCenter,  offWheel);

      // 4b) SideBar length: with the sidebar group in place, solve the Length
      //     weight that puts the band center (Lmm − 80·sf) mm from Main's
      //     origin, and apply it to SideBar / SideBarBand_R / SideBarScrew.
      applySidebarLength(solveSidebarLength(w));

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
      //    When the dog hook is active it frames AFTER re-solving the dog, so we
      //    skip here to avoid a stale frame + a redundant second bbox pass.
      if (!dogFramesAfterSolve) frameCamera();
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

  modelUrl('petwheels.glb').then((u) =>
    BABYLON.SceneLoader.AppendAsync('', u, scene, undefined, '.glb')
  ).then(async () => {
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
        // Now that styleMats exist, paint each material chip with its slot's
        // current albedo so the Style step shows the default filament colours.
        if (typeof window.__pwSyncMaterialChips === 'function') {
          window.__pwSyncMaterialChips();
        }
        setupThighUI();   // wire the thigh-circumference measurement line
      } catch (e) {
        console.error('[Petwheels rig] setup failed', e);
      }

    }

    scene.animationGroups.forEach((g) => g.stop());
    idleAnim = scene.animationGroups.find((g) => g.name && g.name.toLowerCase() === 'idle');
    if (idleAnim) {
      idleAnim.loopAnimation = true;
      idleAnim.start(true, 1.5, idleAnim.from, idleAnim.to, false);
    }

    if (modelRoot) {
      // Deterministic boot: the loading screen stays up until the FULL scene
      // — chair, dog, anchored accessories — is loaded, classified, solved
      // and framed. Revealing earlier (and letting the async pieces trickle
      // in) is what produced the launch flakiness: misplaced accessories,
      // a camera framed around half a scene, and the LegSupport briefly
      // snapping the wrong (swapped) vertex group. Both setups catch their
      // own errors, so a failed optional piece can never hang the loader.
      await Promise.all([setupDog(), setupAccessories()]);
      try {
        if (acc) {
          updateAccessories();                       // first full solve (dog is in)
          if (acc.applyToggles) acc.applyToggles();  // now safe to show them
        }
        if (rig) rig.update();   // final pass: everything in its solved place
      } catch (e) {
        console.error('[boot] final solve failed', e);
      }
      // Single snap framing of the COMPLETE assembly (no fly-in).
      frameCamera(true);
    }

    loader?.classList.add('is-hidden');
    canvas.classList.remove('is-booting');   // fade the finished scene in
  }).catch((err) => {
    console.error('Failed to load petwheels.glb', err);
    if (loader) loader.textContent = tr('Could not load 3D model');
  });

  // ============ GET STL FILES (CadQuery → Supabase → download) ============
  // "Get my STL files" runs the real CadQuery build on the Render service and
  // downloads the resulting STL zip. The morph-rigged preview stays in the
  // viewer — no generated .glb is loaded. Progress streams over Supabase Realtime.
  const cfg = window.PETWHEELS_CONFIG || {};
  const SLOT_DEFAULT_HEX = Object.fromEntries(
    Object.entries(SLOT_DEFAULTS).map(([k, v]) => [k, v.hex]));

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
      setProgress(tr('Done'), 100);
      await downloadStlZip(publicUrl(row.zip_path));
      closeModal(); lockUI(false); buildState.building = false;
    } else if (row.status === 'error') {
      teardownChannel();
      failModal(row.error || tr('Build failed'));
    } else if (row.status === 'cancelled') {
      teardownChannel();
      closeModal(); lockUI(false); buildState.building = false;
    }
  }

  async function startBuild() {
    if (buildState.building) return;
    const sb = getSupabase();
    if (!sb) { alert(tr('Supabase is not configured.')); return; }
    if (!cfg.CAD_SERVICE_URL) {
      alert('The build service URL is not set yet (config.js → CAD_SERVICE_URL).');
      return;
    }

    buildState.building = true;
    if (buildCancelEl) buildCancelEl.textContent = 'Cancel';
    lockUI(true); openModal(); setProgress(tr('Submitting…'), 0);

    const params = buildParams();

    const { data, error } = await sb.from('build_jobs')
      .insert({ params }).select('id').single();
    if (error) { failModal(tr('Could not create job: ') + error.message); return; }
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
      setProgress(tr('Starting…'), 1);
    } catch (e) {
      teardownChannel();
      failModal(tr('Could not reach the build service: ') + e.message);
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

  // ============ CONFIG BRIDGE (customizer → cart / checkout) ============
  // account.js reads the live customizer state through this. Measurements are
  // always reported in CENTIMETRES (the canonical unit) regardless of the unit
  // toggle; `unit` just says what the UI was showing. Keeping this the single
  // read surface means account.js never has to reach into the private `state`.
  //
  // Price comes from pricing.js: per-part printed weight is estimated from the
  // current parameters (weight-sheet.pdf curves), then
  // price = totalKg × R$140/kg × 5. Tweak in pricing.js CONFIG.
  const FALLBACK_PRICE_CENTS = 14900; // only if pricing.js failed to load

  // Live quote for the current customizer state. Sliders are cm → mm ×10.
  function currentQuote() {
    const pricing = window.Petwheels && window.Petwheels.pricing;
    if (!pricing) return null;
    return pricing.quoteMm({
      thighMm:         state.measures.thigh  * 10,
      heightMm:        state.measures.height * 10,
      lengthMm:        state.measures.length * 10,
      widthMm:         state.measures.width  * 10,
      radiusMm:        computeCurrentR(),
      thicknessFactor: state.measures.thickness,
      legSupport:      state.legSupport,
      backStrap:       state.backStrap,
      collar:          state.includeCollar,
    });
  }
  const STL_FALLBACK_CENTS = 8990; // only if pricing.js failed to load
  function stlPriceCents() {
    const pricing = window.Petwheels && window.Petwheels.pricing;
    return (pricing && pricing.config.stlBundleCents) || STL_FALLBACK_CENTS;
  }
  function currentPriceCents() {
    // The STL bundle is a flat price — the parameters change the files, not
    // the printing cost (the buyer prints it themselves).
    if (state.productType === 'stl') return stlPriceCents();
    const q = currentQuote();
    return q ? q.priceCents : FALLBACK_PRICE_CENTS;
  }
  window.Petwheels = window.Petwheels || {};
  window.Petwheels.currentQuote = currentQuote;
  window.Petwheels.getConfig = () => {
    const model = MODELS.find((m) => m.id === state.modelId) || MODELS[0];
    return {
      modelId:   model.id,
      modelName: productName(model),
      // 'assembled' | 'stl' — decides how the item is priced (server-side
      // too: _shared/pricing.ts) and what the buyer receives.
      productType: state.productType,
      unit:      state.unit,
      priceCents: currentPriceCents(),
      // Pet chosen in the Measure step's picker (set by account.js). Rides
      // into cart_items.pet_id so checkout preselects it.
      petId: window.Petwheels.selectedPetId || null,
      // canonical centimetres
      measures: {
        length: state.measures.length,
        height: state.measures.height,
        width:  state.measures.width,
        thigh:  state.measures.thigh,
        thickness: state.measures.thickness,
        wheelRadiusCm: computeCurrentR() / 10,
      },
      options: {
        legSupport:    state.legSupport,
        backStrap:     state.backStrap,
        includeCollar: state.includeCollar,
      },
      materials: currentMaterialHexes(),
    };
  };
  // Let account.js prefill the customizer when a pet is chosen for a new
  // build. force=true so it can write values even while those keys are
  // locked (switching from one locked pet straight to another).
  window.Petwheels.applyMeasures = (m) => {
    if (!m) return;
    ['length', 'height', 'width', 'thigh'].forEach((k) => {
      if (typeof m[k] === 'number' && !Number.isNaN(m[k])) {
        setMeasure(k, m[k], true);
      }
    });
  };

  // ============ POINTER DRAG (model rotation) ============
  canvas.style.cursor = 'grab';

  // Touch axis-lock. On a touchscreen we must NOT setPointerCapture on
  // pointerdown — capturing there suppresses the browser's touch-action:pan-y
  // page scroll (which is the bug: dragging up/down over the canvas wouldn't
  // scroll). Instead we wait for the first move to lock the gesture:
  //   horizontal → rotate the model (and capture so the drag keeps tracking),
  //   vertical   → do nothing and let the browser scroll the page.
  // Mouse/pen have no touch-action scroll, so they rotate immediately as before.
  let downX = 0, downY = 0;
  let dragAxis = null;          // touch: null = undecided, 'x' = rotate, 'y' = scroll
  const DRAG_LOCK_PX = 6;       // movement before the axis is decided

  const onPointerDown = (e) => {
    if (!modelRoot || activePointerId !== null) return;   // ignore extra fingers
    activePointerId = e.pointerId;
    lastX = downX = e.clientX;
    lastY = downY = e.clientY;
    if (e.pointerType === 'touch') {
      dragAxis = null;          // decide on the first move
      isDragging = false;
    } else {
      dragAxis = 'x';
      isDragging = true;
      canvas.setPointerCapture?.(e.pointerId);
      canvas.style.cursor = 'grabbing';
    }
  };
  const onPointerMove = (e) => {
    if (activePointerId === null || e.pointerId !== activePointerId || !modelRoot) return;

    // Touch: lock to an axis once the finger has moved enough.
    if (dragAxis === null) {
      const tdx = e.clientX - downX, tdy = e.clientY - downY;
      if (Math.abs(tdx) < DRAG_LOCK_PX && Math.abs(tdy) < DRAG_LOCK_PX) return;
      if (Math.abs(tdx) > Math.abs(tdy)) {
        dragAxis = 'x';                              // horizontal → rotate
        isDragging = true;
        lastX = e.clientX; lastY = e.clientY;        // start fresh from the lock point
        try { canvas.setPointerCapture?.(e.pointerId); } catch (_) {}
        canvas.style.cursor = 'grabbing';
      } else {
        dragAxis = 'y';                              // vertical → let the page scroll
        return;
      }
    }
    if (dragAxis === 'y' || !isDragging) return;

    const dx = e.clientX - lastX;
    const dy = e.clientY - lastY;
    lastX = e.clientX;
    lastY = e.clientY;

    // Y — free, accumulates
    accumulatedY += -dx * ROT_SPEED;

    // X — soft-clamped with progressive resistance (disabled when ALLOW_PEEK is off)
    if (ALLOW_PEEK) {
      const normalized = Math.abs(peekX) / PEEK_MAX;
      const resistance = 1 + normalized * normalized * PEEK_RESISTANCE;
      let np = peekX + (-dy * ROT_SPEED) / resistance;
      np = Math.max(-PEEK_MAX, Math.min(PEEK_MAX, np));
      peekX = np;
    }

    applyModelRotation();
  };
  const onPointerUp = (e) => {
    if (activePointerId !== null && e.pointerId !== activePointerId) return;
    dragAxis = null;
    if (isDragging) {
      isDragging = false;
      if (activePointerId !== null && canvas.hasPointerCapture?.(activePointerId)) {
        try { canvas.releasePointerCapture?.(activePointerId); } catch (_) {}
      }
      canvas.style.cursor = 'grab';
    }
    activePointerId = null;
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
  // Gated to run ONLY while the viewport is on-screen (see the IntersectionObserver
  // below). Once the viewer scrolls out of view we stopRenderLoop() entirely and
  // skip the per-frame layout read in measureAndResize — so scrolling the rest of
  // the page is as light as any normal site (no WebGL draw, no getBoundingClientRect
  // thrash competing with the browser's scroll/paint). This is why a long page with
  // a 3D hero would otherwise feel progressively laggier the more it renders.
  let viewerVisible = true;
  const renderFrame = () => {
    tickCameraFollow();
    try { updateScaleRefs(); } catch (e) { /* props are cosmetic — never stall the frame */ }
    scene.render();
    try { projectDimensions(); } catch (e) { /* never let the overlay stall rendering */ }
  };
  engine.runRenderLoop(renderFrame);

  // Continuous canvas sizing — measure the canvas's CSS box every frame, but ONLY
  // while the viewer is visible. getBoundingClientRect() forces a synchronous
  // layout; doing it every frame during an off-screen scroll is a big jank source.
  let lastW = 0, lastH = 0;
  // Collapse detector for the boot fly-in. Separate from lastW because the
  // IntersectionObserver below zeroes lastW/lastH on every re-entry (to force
  // a re-measure) — keying wasCollapsed off lastW made scrolling to the
  // footer and back replay the boot zoom animation. This one only ever
  // records honest measurements.
  let lastRealW = 0;
  const measureAndResize = () => {
    if (viewerVisible) {
      const rect = canvas.getBoundingClientRect();
      const cssW = Math.max(0, Math.floor(rect.width));
      const cssH = Math.max(0, Math.floor(rect.height));
      if (cssW > 0 && cssH > 0 && (cssW !== lastW || cssH !== lastH)) {
        const wasCollapsed = lastRealW < 50;   // welcome keeps the viewport at ~0 width
        lastW = cssW;
        lastH = cssH;
        lastRealW = cssW;
        const dpr = Math.min(window.devicePixelRatio || 1, 2);
        engine.setHardwareScalingLevel(1 / dpr);
        engine.setSize(Math.max(1, Math.round(cssW * dpr)), Math.max(1, Math.round(cssH * dpr)));
        // The chromatic aberration post-process bakes screenWidth/Height in at
        // creation and never follows resizes. The pipeline is created while the
        // welcome screen has the viewport collapsed (tiny canvas), so without
        // this sync the aberration offset explodes at full size (RGB ghosts).
        pipeline.chromaticAberration.screenWidth = engine.getRenderWidth();
        pipeline.chromaticAberration.screenHeight = engine.getRenderHeight();
        // Canvas size changed (resize, fullscreen toggle). Refit — slider
        // edits skip this path; only honest layout changes trigger a re-frame.
        if (modelRoot) {
          if (wasCollapsed && cssW > 200) {
            // First honest size (the viewport was collapsed until now): easing
            // from the collapsed fit reads as a zoom-IN fly. Instead snap the
            // frame, start 6% closer than the fit, and let the per-frame lerp
            // drift outward — a subtle settle-out.
            frameCamera(true, true);
            if (camGoalRadius != null) camera.radius = camGoalRadius * 0.94;
          } else {
            // Ordinary resize (window, fullscreen, mobile URL-bar show/hide):
            // refit but PRESERVE the user's dialed-in zoom — resetZoom=true
            // here made every scroll-driven height change on phones yank the
            // camera back to the default framing.
            frameCamera(false, false);
          }
        }
      }
    }
    requestAnimationFrame(measureAndResize);
  };
  measureAndResize();

  // Pause/resume the whole 3D pipeline as the viewer scrolls out of / into view.
  // rootMargin gives a 300px head-start so it's already rendering before it edges
  // into view (no blank flash). Falls back to always-on if IO is unsupported.
  const viewerEl = $('#viewport') || canvas;
  if ('IntersectionObserver' in window && viewerEl) {
    const io = new IntersectionObserver((entries) => {
      const vis = entries.some((en) => en.isIntersecting);
      if (vis === viewerVisible) return;
      viewerVisible = vis;
      if (vis) {
        lastW = lastH = 0;                 // size may have changed while hidden — force a re-measure
        engine.runRenderLoop(renderFrame);
      } else {
        engine.stopRenderLoop();           // no WebGL work at all while off-screen
      }
    }, { root: null, rootMargin: '300px', threshold: 0 });
    io.observe(viewerEl);
  }

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
    // The collar is part of the PRODUCT, not the dog: it stays visible in
    // "Wheelchair only" (like the sling/strap) — only its Style toggle
    // hides it. Re-applied here so boot restores reconcile correctly.
    if (d.collar) {
      const collarOn = state.includeCollar !== false;
      d.collar.mesh.setEnabled(collarOn);
      if (d.collar.inst) d.collar.inst.setEnabled(collarOn);
    }
    // The scale-ref props (person + ball) belong with the dog — hide them in
    // "Wheelchair only" too. Both holders live under scaleRefRoot.
    if (scaleRefRoot) scaleRefRoot.setEnabled(on);
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

  // Mini toast (the #toast element is injected by site-header.js).
  let pwToastTimer = null;
  const pwToast = (msg) => {
    const el = document.getElementById('toast');
    if (!el) return;
    el.textContent = msg;
    el.className = 'toast is-show';
    el.hidden = false;
    clearTimeout(pwToastTimer);
    pwToastTimer = setTimeout(() => el.classList.remove('is-show'), 2600);
  };

  // ---- Toolbar: reset measurements to factory defaults ----
  // Locked sliders (a selected pet's saved measurements) are left alone — the
  // pet stays authoritative; everything else replays through the same input
  // path the sliders use. The wheel radius returns to auto.
  $('#resetMeasures')?.addEventListener('click', () => {
    const RESET_MAP = {
      length: '#rangeLength', height: '#rangeHeight',
      width: '#rangeWidth', thigh: '#rangeThigh', thickness: '#rangeThickness',
    };
    Object.entries(RESET_MAP).forEach(([k, sel]) => {
      const s = $(sel);
      if (s && !s.disabled) replaySlider(sel, MEASURE_DEFAULTS[k]);
    });
    if (state.measures.radiusManual) $('#radiusLock')?.click();
    pwToast(tr('Measurements reset to defaults.'));
  });

  // ---- Share: one link that reopens THIS exact configuration ----
  // UX: phones get the native share sheet (Web Share API); desktop copies the
  // link and confirms with a toast + a brief checkmark on the button — the
  // one-tap copy pattern, no popover to dismiss.
  const buildShareUrl = () => {
    const mats = {};
    $$('.material-row').forEach((row) => {
      const sel = row.querySelector('.material-swatch-item.is-selected');
      if (sel && sel.dataset.color) mats[row.dataset.mat] = sel.dataset.color;
    });
    const payload = {
      v: 1,
      model: state.modelId,
      unit: state.unit,
      measures: { ...state.measures },
      legSupport: state.legSupport,
      backStrap: state.backStrap,
      includeCollar: state.includeCollar,
      mats,
    };
    const enc = btoa(JSON.stringify(payload))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `${location.origin}${location.pathname}?c=${enc}#measure`;
  };
  const shareBtn = $('#shareBtn');
  if (shareBtn) {
    const shareIcon = shareBtn.innerHTML;
    let shareRevert = null;
    shareBtn.addEventListener('click', async () => {
      const url = buildShareUrl();
      if (navigator.share && MOBILE_PANEL_MQ.matches) {
        try { await navigator.share({ title: 'Petwheels', url }); return; }
        catch (_) { /* cancelled or unsupported — fall through to copy */ }
      }
      try {
        await navigator.clipboard.writeText(url);
        pwToast(tr('Link copied! Send it to anyone.'));
        shareBtn.innerHTML = '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>';
        shareBtn.classList.add('is-done');
        clearTimeout(shareRevert);
        shareRevert = setTimeout(() => {
          shareBtn.innerHTML = shareIcon;
          shareBtn.classList.remove('is-done');
        }, 1600);
      } catch (_) {
        window.prompt(tr('Copy the link:'), url);
      }
    });
  }

  // ---- Feedback (heart): tiny modal → public.feedback (insert-only RLS) ----
  const feedbackBtn = $('#feedbackBtn');
  if (feedbackBtn) {
    let fbOverlay = null;
    const closeFb = () => {
      if (!fbOverlay) return;
      fbOverlay.remove();
      fbOverlay = null;
      document.body.classList.remove('pw-modal-open');
    };
    feedbackBtn.addEventListener('click', () => {
      if (fbOverlay) return;
      fbOverlay = document.createElement('div');
      fbOverlay.className = 'auth-overlay';
      fbOverlay.innerHTML = `
        <div class="sheet fb-modal" role="dialog" aria-modal="true">
          <div class="sheet-header">
            <h2 class="sheet-title">${tr('Feedback')}</h2>
            <button class="sheet-close" type="button" aria-label="Close">
              <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
            </button>
          </div>
          <div class="sheet-body">
            <p class="sheet-lede">${tr('Have something to say? A suggestion, a problem, an idea. We read every message.')}</p>
            <textarea class="fb-text" rows="4" maxlength="4000" placeholder="${tr('Write your message…')}"></textarea>
            <p class="auth-error" data-fb-error hidden></p>
            <button class="btn btn-cta btn-block" data-fb-send type="button">${tr('Send')}</button>
          </div>
        </div>`;
      document.body.appendChild(fbOverlay);
      document.body.classList.add('pw-modal-open');
      const textEl = fbOverlay.querySelector('.fb-text');
      const errEl = fbOverlay.querySelector('[data-fb-error]');
      fbOverlay.querySelector('.sheet-close').addEventListener('click', closeFb);
      fbOverlay.addEventListener('click', (e) => { if (e.target === fbOverlay) closeFb(); });
      setTimeout(() => textEl.focus(), 50);
      fbOverlay.querySelector('[data-fb-send]').addEventListener('click', async (e) => {
        const btn = e.currentTarget;
        const message = textEl.value.trim();
        errEl.hidden = true;
        if (!message) { textEl.focus(); return; }
        const sbF = window.__pwSb || ((window.supabase && cfg.SUPABASE_URL && cfg.SUPABASE_ANON_KEY)
          ? (window.__pwSb = window.supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY))
          : null);
        if (!sbF) {
          errEl.textContent = tr('Could not send. Try again.');
          errEl.hidden = false;
          return;
        }
        btn.disabled = true;
        btn.textContent = tr('Sending…');
        let user_id = null, email = null;
        try {
          const { data } = await sbF.auth.getSession();
          user_id = (data.session && data.session.user && data.session.user.id) || null;
          email = (data.session && data.session.user && data.session.user.email) || null;
        } catch (_) { /* anonymous feedback is fine */ }
        const { error } = await sbF.from('feedback')
          .insert({ message, user_id, email, page: 'customizer' });
        if (error) {
          btn.disabled = false;
          btn.textContent = tr('Send');
          errEl.textContent = tr('Could not send. Try again.');
          errEl.hidden = false;
          return;
        }
        closeFb();
        pwToast(tr('Thanks for the feedback!'));
      });
    });
  }

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
      if (modelName)  modelName.textContent = tr(model.displayName || model.name);
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
              <span class="model-option-name">${escapeHtml(tr(m.name))}</span>
              <span class="model-option-desc">${escapeHtml(tr(m.description))}</span>
            </div>
          </li>
        `;
      }).join('');
    };

    // Language switch: re-render the options and the trigger pill (same deal
    // as the product-type dropdown below).
    window.addEventListener('pw:langchange', () => {
      renderOptions();
      const cur = MODELS.find((m) => m.id === selectedId);
      if (cur) renderTrigger(cur);
    });

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
      state.modelId = model.id;
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

  // ---- Product type dropdown (panel context row) ----
  // Rendered from PRODUCT_TYPES into #productTypeMount, styled like the
  // model/pet selectors (same .model-select classes, icon instead of photo).
  // Switching re-prices everything through currentPriceCents().
  {
    const mount = $('#productTypeMount');
    // With a single active product type there is nothing to choose — hide the
    // whole "Product type" field (STL sales suspended).
    if (mount && ACTIVE_PRODUCT_TYPES.length < 2) {
      const field = mount.closest('.pet-pick-field');
      if (field) field.hidden = true;
    } else if (mount) {
      // Icon strokes carry the brand gradients (warm = assembled, cool = STL)
      // via inline <linearGradient> defs. The same string is injected in the
      // trigger AND the menu list, so the ids repeat in the document — that's
      // fine (identical defs, url(#) resolves to the first one).
      const ICONS = {
        // package/box — the assembled chair shipped to the door
        assembled: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="url(#pwPtypeWarm)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="pwPtypeWarm" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#FF7A1A"/><stop offset="1" stop-color="#FF3D78"/></linearGradient></defs><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></svg>',
        // file with a down arrow — the downloadable STL bundle
        stl: '<svg viewBox="0 0 24 24" width="17" height="17" fill="none" stroke="url(#pwPtypeCool)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><defs><linearGradient id="pwPtypeCool" x1="3" y1="3" x2="21" y2="21" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#7C3AED"/><stop offset="1" stop-color="#2FB8FF"/></linearGradient></defs><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="12" y1="18" x2="12" y2="12"/><polyline points="9 15 12 18 15 15"/></svg>',
      };
      mount.classList.add('model-select', 'ptype-select');
      mount.innerHTML = `
        <button class="model-select-trigger ptype-trigger" type="button"
                aria-haspopup="listbox" aria-expanded="false">
          <span class="model-select-thumb ptype-thumb"></span>
          <span class="model-select-name ptype-name"></span>
          <svg class="model-select-chevron" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
        </button>
        <div class="model-select-menu ptype-menu" hidden>
          <ul class="model-options-list" role="listbox" aria-label="Product type">${
            ACTIVE_PRODUCT_TYPES.map((p) => `
              <li class="model-option" role="option" tabindex="0" data-ptype="${p.id}">
                <span class="model-option-thumb ptype-thumb">${ICONS[p.id] || ''}</span>
                <div class="model-option-text">
                  <span class="model-option-name">${tr(p.name)}</span>
                  <span class="model-option-desc">${tr(p.description)}</span>
                </div>
              </li>`).join('')
          }</ul>
        </div>`;

      const trigger = mount.querySelector('.ptype-trigger');
      const thumbEl = trigger.querySelector('.ptype-thumb');
      const nameEl  = trigger.querySelector('.ptype-name');
      const menu    = mount.querySelector('.ptype-menu');

      const renderPtype = () => {
        const p = productTypeById(state.productType);
        thumbEl.innerHTML = ICONS[p.id] || '';
        nameEl.textContent = tr(p.name);
        menu.querySelectorAll('.model-option').forEach((opt) => {
          const isSel = opt.dataset.ptype === p.id;
          opt.classList.toggle('is-selected', isSel);
          opt.setAttribute('aria-selected', isSel ? 'true' : 'false');
        });
      };
      const closePtypeMenu = () => {
        menu.hidden = true;
        trigger.setAttribute('aria-expanded', 'false');
      };
      const selectPtype = (id) => {
        state.productType = productTypeById(id).id;
        renderPtype();
        closePtypeMenu();
        // Re-price everywhere the total shows (viewport header + review).
        updateWeightStat();
        updateReview();
      };

      trigger.addEventListener('click', (e) => {
        e.stopPropagation();
        menu.hidden = !menu.hidden;
        trigger.setAttribute('aria-expanded', menu.hidden ? 'false' : 'true');
      });
      document.addEventListener('click', (e) => {
        if (!menu.hidden && !mount.contains(e.target)) closePtypeMenu();
      });
      document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && !menu.hidden) closePtypeMenu();
      });
      menu.addEventListener('click', (e) => {
        const opt = e.target.closest('[data-ptype]');
        if (opt) selectPtype(opt.dataset.ptype);
      });
      menu.addEventListener('keydown', (e) => {
        if (e.key !== 'Enter' && e.key !== ' ') return;
        const opt = e.target.closest('[data-ptype]');
        if (!opt) return;
        e.preventDefault();
        selectPtype(opt.dataset.ptype);
      });

      renderPtype();   // reflects a session-snapshot restore too

      // Language switch: re-label the trigger and the menu options.
      window.addEventListener('pw:langchange', () => {
        menu.querySelectorAll('.model-option').forEach((opt) => {
          const p = productTypeById(opt.dataset.ptype);
          const nm = opt.querySelector('.model-option-name');
          const ds = opt.querySelector('.model-option-desc');
          if (nm) nm.textContent = tr(p.name);
          if (ds) ds.textContent = tr(p.description);
        });
        renderPtype();
      });
    }
  }

  const tweenAccumulatedY = (delta) => {
    tween(() => accumulatedY, accumulatedY + delta, (v) => { accumulatedY = v; applyModelRotation(); });
  };
  // Zoom buttons feed the user-offset factor. The render-loop lerp animates
  // the radius toward the recomputed camGoalRadius (= autoFit × userFactor).
  $('#rotateL').addEventListener('click', () => tweenAccumulatedY(-Math.PI / 8));
  $('#rotateR').addEventListener('click', () => tweenAccumulatedY(Math.PI / 8));
  // Vertical zoom slider — drives userZoomFactor directly; the render loop lerps
  // the radius toward camGoalRadius (= autoFit × factor). Wheel/pinch push the
  // factor back onto the slider via syncZoomSlider().
  zoomSlider = $('#zoomSlider');
  if (zoomSlider) {
    zoomSlider.addEventListener('input', () => {
      const pos = +zoomSlider.value;
      zoomSlider.style.setProperty('--p', pos + '%');
      userZoomFactor = Math.max(ZOOM_FACTOR_MIN,
                                Math.min(ZOOM_FACTOR_MAX, zoomFactorFromSlider(pos)));
      applyZoom();
    });
    syncZoomSlider();   // seat the thumb + fill at the current factor
    // The rotated slider's WIDTH is its vertical length — keep it equal to the
    // track's live height. Desktop track is a fixed 148px; on mobile the track
    // flexes to whatever stage height is available, so it must be measured.
    const zoomTrack = zoomSlider.closest('.vp-zoom-track');
    if (zoomTrack && window.ResizeObserver) {
      new ResizeObserver(() => {
        zoomSlider.style.width = zoomTrack.clientHeight + 'px';
      }).observe(zoomTrack);
    }
  }
  $('#resetView')?.addEventListener('click', () => {
    tween(() => accumulatedY, 0, (v) => { accumulatedY = v; applyModelRotation(); }, 400);
    tween(() => peekX, 0, (v) => { peekX = v; applyModelRotation(); }, 400);
    // Restore the auto-fit zoom (resetZoom=true) and let the follower lerp
    // ease the radius back to it.
    frameCamera(false, true);
  });

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

  // Mouse-wheel zoom is intentionally DISABLED. Babylon's own camera wheel input
  // is already cleared (camera.inputs.clear()), and we no longer attach a custom
  // wheel handler — the old one projected the model's bounding box on every wheel
  // event (getHierarchyBoundingVectors), which stuttered/froze the viewer. Zoom is
  // UI-only now (the vertical zoom slider). Wheel over the canvas just scrolls the
  // page normally.
  $('#fullscreen').addEventListener('click', () => {
    const el = $('#viewport');
    if (!document.fullscreenElement) el.requestFullscreen?.();
    else document.exitFullscreen?.();
  });
})();
