(() => {
  'use strict';

  if (!window.GlitterFX) {
    document.body.innerHTML = '<div style="padding:32px;font-family:system-ui;color:white;background:#090a0e;min-height:100vh">GlitterFX failed to load. Serve the repository root over HTTP so ../../../glitterfx.js resolves correctly.</div>';
    return;
  }

  const $ = (id) => document.getElementById(id);
  const titleCase = (value) => value
    .split('-')
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(' ');

  const stage = $('fx-stage');
  const effectList = $('effect-list');
  const search = $('effect-search');
  const effectTitle = $('effect-title');
  const effectCount = $('effect-count');
  const stageEffectName = $('stage-effect-name');
  const stagePaletteName = $('stage-palette-name');
  const runtimeStatus = $('runtime-status');
  const fpsReadout = $('fps-readout');
  const toast = $('toast');

  const controls = {
    palette: $('palette'),
    blurMode: $('blur-mode'),
    density: $('density'),
    speed: $('speed'),
    size: $('size'),
    brightness: $('brightness'),
    blur: $('blur'),
    haze: $('haze'),
  };

  const outputs = {
    density: $('density-value'),
    speed: $('speed-value'),
    size: $('size-value'),
    brightness: $('brightness-value'),
    blur: $('blur-value'),
    haze: $('haze-value'),
  };

  const effects = GlitterFX.listEffects();
  const palettes = GlitterFX.listPalettes();
  const blurModes = GlitterFX.listBlurModes();

  let selectedIndex = 0;
  let fx = null;
  let paused = false;
  let autoplayTimer = null;
  let fpsRaf = null;
  let lastFpsTime = performance.now();
  let fpsFrames = 0;

  effectCount.textContent = effects.length + ' effects';

  function showToast(message) {
    toast.textContent = message;
    toast.classList.add('show');
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => toast.classList.remove('show'), 1600);
  }

  function fillSelect(select, values) {
    select.innerHTML = '';
    values.forEach((value) => {
      const option = document.createElement('option');
      option.value = value;
      option.textContent = titleCase(value);
      select.appendChild(option);
    });
  }

  fillSelect(controls.palette, palettes);
  fillSelect(controls.blurMode, blurModes);

  function renderEffectList(query = '') {
    effectList.innerHTML = '';
    const normalizedQuery = query.trim().toLowerCase();

    effects.forEach((name, index) => {
      if (normalizedQuery && !name.toLowerCase().includes(normalizedQuery)) return;

      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'effect-item' + (index === selectedIndex ? ' active' : '');
      button.dataset.effect = name;
      button.innerHTML =
        '<span class="effect-item-index">' + String(index + 1).padStart(2, '0') + '</span>' +
        '<span class="effect-item-name">' + titleCase(name) + '</span>';

      button.addEventListener('click', () => selectEffect(index));
      effectList.appendChild(button);
    });
  }

  function setRange(name, value, fallback) {
    const control = controls[name];
    if (!control) return;
    const numeric = Number.isFinite(Number(value)) ? Number(value) : fallback;
    control.value = String(numeric);
    outputs[name].value = numeric.toFixed(name === 'blur' ? 1 : 2);
  }

  function syncControlsFromDefaults(effectName) {
    const defaults = GlitterFX.getDefaults(effectName) || {};

    if (typeof defaults.palette === 'string' && palettes.includes(defaults.palette)) {
      controls.palette.value = defaults.palette;
    } else {
      controls.palette.value = palettes[0] || '';
    }

    controls.blurMode.value = blurModes.includes(defaults.blurMode)
      ? defaults.blurMode
      : (blurModes[0] || 'none');

    setRange('density', defaults.density, 1);
    setRange('speed', defaults.speed, 1);
    setRange('size', defaults.size, 1);
    setRange('brightness', defaults.brightness, 1);
    setRange('blur', defaults.blur, 0);
    setRange('haze', defaults.haze, 0);

    updateConfigOutput();
  }

  function currentPatch() {
    return {
      palette: controls.palette.value,
      blurMode: controls.blurMode.value,
      density: Number(controls.density.value),
      speed: Number(controls.speed.value),
      size: Number(controls.size.value),
      brightness: Number(controls.brightness.value),
      blur: Number(controls.blur.value),
      haze: Number(controls.haze.value),
    };
  }

  function currentConfig() {
    return {
      effect: effects[selectedIndex],
      ...currentPatch(),
    };
  }

  function updateConfigOutput() {
    const config = currentConfig();
    $('config-output').textContent =
      'new GlitterFX(element, ' + JSON.stringify(config, null, 2) + ');';

    stagePaletteName.textContent = config.palette || 'custom';
  }

  function destroyCurrent() {
    if (!fx) return;
    fx.destroy();
    fx = null;
  }

  function createEffect(name) {
    destroyCurrent();
    stage.innerHTML = '';

    fx = new GlitterFX(stage, currentConfig());

    if (paused) {
      fx.stop();
    }
  }

  function selectEffect(index) {
    selectedIndex = (index + effects.length) % effects.length;
    const name = effects[selectedIndex];

    syncControlsFromDefaults(name);
    createEffect(name);

    effectTitle.textContent = titleCase(name);
    stageEffectName.textContent = name;
    runtimeStatus.textContent = paused ? 'Paused' : 'Running';

    renderEffectList(search.value);

    const active = effectList.querySelector('.effect-item.active');
    active?.scrollIntoView({ block: 'nearest' });
  }

  function applyControlPatch(patch) {
    if (!fx) return;
    fx.update(patch);
    updateConfigOutput();
  }

  function bindRange(name) {
    controls[name].addEventListener('input', () => {
      const value = Number(controls[name].value);
      outputs[name].value = value.toFixed(name === 'blur' ? 1 : 2);
      applyControlPatch({ [name]: value });
    });
  }

  ['density', 'speed', 'size', 'brightness', 'blur', 'haze'].forEach(bindRange);

  controls.palette.addEventListener('change', () => {
    applyControlPatch({ palette: controls.palette.value });
  });

  controls.blurMode.addEventListener('change', () => {
    applyControlPatch({ blurMode: controls.blurMode.value });
  });

  search.addEventListener('input', () => renderEffectList(search.value));

  $('prev-effect').addEventListener('click', () => selectEffect(selectedIndex - 1));
  $('next-effect').addEventListener('click', () => selectEffect(selectedIndex + 1));

  $('reset-controls').addEventListener('click', () => {
    const name = effects[selectedIndex];
    syncControlsFromDefaults(name);
    createEffect(name);
    showToast('Effect reset');
  });

  $('pause-toggle').addEventListener('click', () => {
    paused = !paused;
    if (fx) {
      if (paused) fx.stop();
      else fx.start();
    }
    $('pause-toggle').textContent = paused ? 'Resume' : 'Pause';
    runtimeStatus.textContent = paused ? 'Paused' : 'Running';
  });

  function stopAutoplay() {
    if (autoplayTimer) {
      clearInterval(autoplayTimer);
      autoplayTimer = null;
    }
    $('autoplay').setAttribute('aria-pressed', 'false');
    $('autoplay').textContent = 'Autoplay';
  }

  function startAutoplay() {
    stopAutoplay();
    autoplayTimer = setInterval(() => selectEffect(selectedIndex + 1), 8000);
    $('autoplay').setAttribute('aria-pressed', 'true');
    $('autoplay').textContent = 'Stop autoplay';
  }

  $('autoplay').addEventListener('click', () => {
    if (autoplayTimer) stopAutoplay();
    else startAutoplay();
  });

  $('copy-config').addEventListener('click', async () => {
    const source = $('config-output').textContent;
    try {
      await navigator.clipboard.writeText(source);
      showToast('Config copied');
    } catch {
      showToast('Clipboard unavailable');
    }
  });

  window.addEventListener('keydown', (event) => {
    if (event.target && /input|select|textarea/i.test(event.target.tagName)) return;

    if (event.key === 'ArrowRight') selectEffect(selectedIndex + 1);
    if (event.key === 'ArrowLeft') selectEffect(selectedIndex - 1);
    if (event.key === ' ') {
      event.preventDefault();
      $('pause-toggle').click();
    }
  });

  function fpsLoop(now) {
    fpsFrames += 1;
    const elapsed = now - lastFpsTime;

    if (elapsed >= 750) {
      const fps = Math.round((fpsFrames * 1000) / elapsed);
      fpsReadout.textContent = fps + ' FPS';
      fpsFrames = 0;
      lastFpsTime = now;
    }

    fpsRaf = requestAnimationFrame(fpsLoop);
  }

  window.addEventListener('beforeunload', () => {
    stopAutoplay();
    if (fpsRaf) cancelAnimationFrame(fpsRaf);
    destroyCurrent();
  });

  renderEffectList();
  selectEffect(0);
  fpsRaf = requestAnimationFrame(fpsLoop);
})();
