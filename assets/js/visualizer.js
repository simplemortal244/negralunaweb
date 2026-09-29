/* ============================================================
   NEGRALUNA · Visualizador (estilo Windows Media Player clásico)
   Ventana flotante que abre cuando suena música desde un nodo de
   proyecto o podcast. Dibuja figuras al ritmo de la música usando
   Web Audio API (AnalyserNode) y avanza solo a la siguiente
   canción cuando la actual termina.
   ============================================================ */

"use strict";

const NodePlayer = (() => {
  /* --- estado --- */
  let audio = null;          // <audio> único para todo el reproductor
  let audioCtx = null;       // AudioContext
  let analyser = null;       // AnalyserNode
  let sourceNode = null;     // MediaElementSourceNode (una sola vez por audio)
  let connected = false;     // source → analyser → destination
  let playlist = [];          // [{ name, url, btn }]
  let pos = -1;               // índice dentro de playlist
  let wrap = null;            // contenedor de la ventana
  let canvas, cctx;            // canvas y su contexto 2D
  let rafId = null;            // requestAnimationFrame del dibujo
  let mode = 0;                // 0=barras · 1=ondas · 2=flor · 3=anillos
  let trackEl = null;          // elemento de título
  let artistEl = null;         // sub-título (proyecto)
  let playBtn = null;          // botón play/pausa
  let modeBtn = null;
  let artistLabel = "NegraLuna";
  let vol = 0.85;
  let freqData = null;
  let timeData = null;
  let particles = [];
  let hueRot = 0;

  /* --- helpers --- */
  function ensureAudio() {
    if (audio) return;
    audio = new Audio();
    audio.crossOrigin = "anonymous";
    audio.volume = vol;
    audio.preload = "metadata";
    audio.addEventListener("play", () => { RadioNegraLuna.ceder(); updatePlayBtn(); drawStart(); });
    audio.addEventListener("pause", () => { updatePlayBtn(); });
    audio.addEventListener("ended", () => {
      // auto-siguiente: si hay más tracks, sigue; si no, cierra
      if (pos + 1 < playlist.length) play(pos + 1);
      else stop();
    });
    audio.addEventListener("timeupdate", () => {
      if (!wrap || !wrap.classList.contains("on")) return;
      const bar = wrap.querySelector(".vp-progress i");
      if (bar && audio.duration) bar.style.width = (audio.currentTime / audio.duration * 100) + "%";
      const cur = wrap.querySelector(".vp-cur");
      const dur = wrap.querySelector(".vp-dur");
      if (cur) cur.textContent = fmtTime(audio.currentTime);
      if (dur && audio.duration) dur.textContent = fmtTime(audio.duration);
    });
  }

  function fmtTime(s) {
    if (!s || !isFinite(s)) return "0:00";
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return m + ":" + (sec < 10 ? "0" : "") + sec;
  }

  function ensureContext() {
    if (audioCtx) return;
    try {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = 1024;
      analyser.smoothingTimeConstant = 0.78;
      freqData = new Uint8Array(analyser.frequencyBinCount);
      timeData = new Uint8Array(analyser.fftSize);
      sourceNode = audioCtx.createMediaElementSource(audio);
      sourceNode.connect(analyser);
      analyser.connect(audioCtx.destination);
      connected = true;
    } catch (e) {
      console.warn("AudioContext no disponible:", e);
    }
  }

  /* --- ventana --- */
  function tejerVentana() {
    if (wrap) return;
    wrap = document.createElement("div");
    wrap.id = "visualizer";
    wrap.setAttribute("role", "dialog");
    wrap.setAttribute("aria-label", "Visualizador de música");
    wrap.innerHTML =
      '<div class="vp-chrome">' +
        '<div class="vp-titlebar">' +
          '<div class="vp-marquee">' +
            '<span class="vp-mode-tag" aria-hidden="true">VISUALIZACIONES</span>' +
            '<span class="vp-track">—</span>' +
          '</div>' +
          '<div class="vp-artist">—</div>' +
          '<button class="vp-close" type="button" aria-label="Cerrar visualizador" title="Cerrar (Esc)">×</button>' +
        '</div>' +
        '<div class="vp-stage">' +
          '<canvas class="vp-canvas"></canvas>' +
          '<div class="vp-overlay" aria-hidden="true"><span>MODO</span><b>Barras</b></div>' +
        '</div>' +
        '<div class="vp-controls">' +
          '<button class="vp-btn vp-prev" type="button" aria-label="Anterior" title="Anterior">⏮</button>' +
          '<button class="vp-btn vp-play" type="button" aria-label="Reproducir o pausar" title="Reproducir / Pausar">▶</button>' +
          '<button class="vp-btn vp-next" type="button" aria-label="Siguiente" title="Siguiente">⏭</button>' +
          '<div class="vp-progress"><i></i></div>' +
          '<span class="vp-cur">0:00</span><span class="vp-dur">0:00</span>' +
          '<button class="vp-btn vp-mode" type="button" aria-label="Cambiar visualización" title="Cambiar visualización">IFn</button>' +
          '<input class="vp-vol" type="range" min="0" max="1" step="0.01" value="' + vol + '" aria-label="Volumen">' +
        '</div>' +
      '</div>';
    document.body.appendChild(wrap);
    canvas = wrap.querySelector(".vp-canvas");
    cctx = canvas.getContext("2d");
    trackEl = wrap.querySelector(".vp-track");
    artistEl = wrap.querySelector(".vp-artist");
    playBtn = wrap.querySelector(".vp-play");
    modeBtn = wrap.querySelector(".vp-mode");
    wrap.querySelector(".vp-close").addEventListener("click", stop);
    wrap.querySelector(".vp-prev").addEventListener("click", () => prev());
    wrap.querySelector(".vp-next").addEventListener("click", () => next());
    playBtn.addEventListener("click", () => togglePlay());
    modeBtn.addEventListener("click", cycleMode);
    wrap.querySelector(".vp-vol").addEventListener("input", e => {
      vol = parseFloat(e.target.value);
      if (audio) audio.volume = vol;
    });
    document.addEventListener("keydown", e => {
      if (!wrap || !wrap.classList.contains("on")) return;
      // si el visitante está escribiendo en un formulario (comentario del
      // panel), los atajos no se disparan: hace falta el espacio y las
      // flechas para mover el cursor dentro del texto
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "Escape") { stop(); }
      else if (e.key === " ") { e.preventDefault(); togglePlay(); }
      else if (e.key === "ArrowRight" && e.shiftKey) { next(); }
      else if (e.key === "ArrowLeft" && e.shiftKey) { prev(); }
    });
  }

  function showWindow() {
    tejerVentana();
    wrap.classList.add("on");
    wrap.setAttribute("aria-hidden", "false");
    resizeCanvas();
    window.addEventListener("resize", resizeCanvas);
  }

  function hideWindow() {
    if (wrap) wrap.classList.remove("on");
    if (wrap) wrap.setAttribute("aria-hidden", "true");
    window.removeEventListener("resize", resizeCanvas);
    drawStop();
  }

  function resizeCanvas() {
    if (!canvas) return;
    const r = canvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(2, Math.floor(r.width * dpr));
    canvas.height = Math.max(2, Math.floor(r.height * dpr));
    cctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  /* --- controles --- */
  function open(tracks, idx, artist) {
    if (!tracks || !tracks.length) return;
    playlist = tracks.slice();
    pos = Math.max(0, Math.min(idx, tracks.length - 1));
    if (artist) artistLabel = artist;
    ensureAudio();
    showWindow();          // tejerVentana() se llama dentro de showWindow()
    bindButtons();
    loadCurrent();
    audio.play().then(ensureContext).catch(() => {
      showToast("El navegador no pudo reproducir el audio.");
    });
  }

  /* asocia cada pista del playlist con su botón en el panel (si sigue abierto) */
  function bindButtons() {
    const listas = document.querySelectorAll(".musica-lista");
    let listaActiva = null;
    // la lista activa es la que coincide con el artist y el número de pistas
    listas.forEach(l => {
      const a = l.getAttribute("data-artist");
      if (a === artistLabel || !listaActiva) listaActiva = l;
    });
    if (!listaActiva) return;
    const btns = listaActiva.querySelectorAll(".t-btn[data-track]");
    btns.forEach((b, i) => {
      if (playlist[i]) playlist[i].btn = b;
    });
  }

  function loadCurrent() {
    if (!audio || pos < 0 || pos >= playlist.length) return;
    const t = playlist[pos];
    audio.src = t.url;
    if (trackEl) trackEl.textContent = t.name;
    if (artistEl) artistEl.textContent = artistLabel;
    // marca el botón activo y limpia los demás
    playlist.forEach(p => { if (p.btn) resetBtn(p.btn); });
    if (t.btn) playingBtn(t.btn);
  }

  function play(idx) {
    if (idx == null) idx = pos;
    if (idx < 0 || idx >= playlist.length) return;
    pos = idx;
    loadCurrent();
    audio.play().then(ensureContext).catch(() => {});
  }

  function togglePlay() {
    if (!audio || !audio.src) return;
    if (audio.paused) {
      audio.play().then(ensureContext).catch(() => {});
    } else {
      audio.pause();
    }
  }

  function next() {
    if (pos + 1 < playlist.length) play(pos + 1);
    else if (playlist.length > 0) play(0); // bucle (repite la playlist)
  }

  function prev() {
    if (audio && audio.currentTime > 3) { audio.currentTime = 0; return; }
    if (pos > 0) play(pos - 1);
    else if (playlist.length > 0) play(playlist.length - 1);
  }

  function stop() {
    if (audio) { audio.pause(); audio.src = ""; }
    playlist.forEach(p => { if (p.btn) resetBtn(p.btn); });
    playlist = []; pos = -1;
    RadioNegraLuna.reanudar();
    hideWindow();
  }

  /* --- botones del listado --- */
  function playingBtn(btn) {
    if (!btn) return;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="5.5" width="3.6" height="13" rx="1"/><rect x="13.4" y="5.5" width="3.6" height="13" rx="1"/></svg>';
    btn.classList.add("playing");
  }
  function resetBtn(btn) {
    if (!btn) return;
    btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5l11 6.5-11 6.5Z"/></svg>';
    btn.classList.remove("playing");
  }
  function updatePlayBtn() {
    if (!playBtn || !audio) return;
    const paused = audio.paused;
    playBtn.textContent = paused ? "▶" : "❚❚";
  }

  /* --- modos de visualización --- */
  const MODE_NAMES = ["Barras", "Ondas", "Flor", "Anillos"];
  function cycleMode() {
    mode = (mode + 1) % 4;
    if (modeBtn) modeBtn.textContent = ["Bar", "Ond", "Flr", "Ani"][mode];
    const ov = wrap.querySelector(".vp-overlay b");
    if (ov) ov.textContent = MODE_NAMES[mode];
    particles = [];
  }

  /* --- bucle de dibujo --- */
  function drawStart() {
    if (rafId) return;
    const loop = () => {
      draw();
      rafId = requestAnimationFrame(loop);
    };
    rafId = requestAnimationFrame(loop);
  }
  function drawStop() {
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;
    if (cctx) {
      cctx.clearRect(0, 0, canvas.width, canvas.height);
    }
  }

  function draw() {
    if (!cctx || !canvas) return;
    const w = canvas.clientWidth, h = canvas.clientHeight;
    if (w < 2 || h < 2) return;
    // sin analyser: dibuja una visualización "silenciosa"
    let freq, wave;
    if (analyser && connected) {
      analyser.getByteFrequencyData(freqData);
      analyser.getByteTimeDomainData(timeData);
      freq = freqData; wave = timeData;
    } else {
      // datos sintéticos para no mostrar canvas vacío
      if (!freqData) freqData = new Uint8Array(64);
      if (!timeData) timeData = new Uint8Array(64);
      const t = performance.now() / 1000;
      for (let i = 0; i < freqData.length; i++) {
        freqData[i] = 80 + Math.sin(t * 1.4 + i * 0.3) * 40 + Math.sin(t * 0.7) * 20;
      }
      for (let i = 0; i < timeData.length; i++) {
        timeData[i] = 128 + Math.sin(t * 4 + i * 0.2) * 30;
      }
      freq = freqData; wave = timeData;
    }
    // fondo: fade suave (deja estela)
    cctx.fillStyle = "rgba(10, 6, 4, 0.32)";
    cctx.fillRect(0, 0, w, h);

    hueRot = (hueRot + 0.6) % 360;
    if (mode === 0) drawBars(w, h, freq);
    else if (mode === 1) drawWaves(w, h, wave);
    else if (mode === 2) drawFlower(w, h, freq);
    else drawRings(w, h, freq);
  }

  /* modo 0: barras espectrales clásicas (estilo WMP "Bars") */
  function drawBars(w, h, data) {
    const bars = 64;
    const step = Math.floor(data.length / bars) || 1;
    const gap = 3;
    const bw = (w - gap * (bars - 1)) / bars;
    for (let i = 0; i < bars; i++) {
      let v = 0;
      for (let j = 0; j < step; j++) v += data[i * step + j] || 0;
      v = v / step / 255;
      const bh = Math.max(2, v * h * 0.92);
      const x = i * (bw + gap);
      const y = h - bh;
      const hue = (hueRot + i * 4) % 360;
      const g = cctx.createLinearGradient(0, y, 0, h);
      g.addColorStop(0, "hsla(" + hue + ", 95%, 65%, 0.95)");
      g.addColorStop(0.5, "hsla(" + ((hue + 30) % 360) + ", 90%, 50%, 0.9)");
      g.addColorStop(1, "hsla(" + ((hue + 60) % 360) + ", 80%, 35%, 0.7)");
      cctx.fillStyle = g;
      cctx.fillRect(x, y, bw, bh);
      // brillo superior
      cctx.fillStyle = "hsla(" + hue + ", 100%, 80%, 0.95)";
      cctx.fillRect(x, y, bw, Math.min(3, bh));
      // reflejo inferior (más sutil)
      cctx.globalAlpha = 0.18;
      cctx.fillRect(x, h - bh, bw, bh);
      cctx.globalAlpha = 1;
    }
  }

  /* modo 1: onda osciloscópica (estilo WMP "Wave") */
  function drawWaves(w, h, data) {
    cctx.lineWidth = 2.2;
    cctx.lineJoin = "round";
    const mid = h / 2;
    for (let layer = 0; layer < 3; layer++) {
      const off = layer * 6;
      const hue = (hueRot + layer * 60) % 360;
      cctx.strokeStyle = "hsla(" + hue + ", 90%, 60%, " + (0.85 - layer * 0.22) + ")";
      cctx.beginPath();
      for (let i = 0; i < data.length; i++) {
        const x = (i / (data.length - 1)) * w;
        const v = (data[i] - 128) / 128;
        const y = mid + v * (h * 0.4) + Math.sin(i * 0.05 + performance.now() / 600) * off;
        if (i === 0) cctx.moveTo(x, y);
        else cctx.lineTo(x, y);
      }
      cctx.stroke();
    }
    // onda de fondo
    cctx.fillStyle = "hsla(" + hueRot + ", 100%, 60%, 0.08)";
    cctx.beginPath();
    cctx.moveTo(0, mid);
    for (let i = 0; i < data.length; i++) {
      const x = (i / (data.length - 1)) * w;
      const v = (data[i] - 128) / 128;
      const y = mid + v * (h * 0.4);
      cctx.lineTo(x, y);
    }
    cctx.lineTo(w, mid);
    cctx.closePath();
    cctx.fill();
  }

  /* modo 2: flor de pétalos (estilo WMP "Plenitude") */
  function drawFlower(w, h, data) {
    const cx = w / 2, cy = h / 2;
    const petals = 36;
    const baseR = Math.min(w, h) * 0.12;
    for (let i = 0; i < petals; i++) {
      const ang = (i / petals) * Math.PI * 2;
      const idx = Math.floor((i / petals) * data.length * 0.6);
      const v = (data[idx] || 0) / 255;
      const len = baseR + v * Math.min(w, h) * 0.42;
      const wid = 6 + v * 16;
      const hue = (hueRot + i * 10) % 360;
      cctx.save();
      cctx.translate(cx, cy);
      cctx.rotate(ang + performance.now() / 4000);
      const g = cctx.createLinearGradient(baseR, 0, len, 0);
      g.addColorStop(0, "hsla(" + hue + ", 90%, 50%, 0.15)");
      g.addColorStop(1, "hsla(" + hue + ", 100%, 65%, 0.95)");
      cctx.fillStyle = g;
      cctx.beginPath();
      cctx.moveTo(baseR, -wid);
      cctx.quadraticCurveTo(len * 0.5, -wid * 1.6, len, 0);
      cctx.quadraticCurveTo(len * 0.5, wid * 1.6, baseR, wid);
      cctx.closePath();
      cctx.fill();
      cctx.restore();
    }
    // centro pulsante
    const avg = data.length ? data.slice(0, 32).reduce((a, b) => a + b, 0) / 32 / 255 : 0;
    const r = baseR * 0.8 + avg * 16;
    const rg = cctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    rg.addColorStop(0, "hsla(" + hueRot + ", 100%, 80%, 0.95)");
    rg.addColorStop(0.7, "hsla(" + ((hueRot + 30) % 360) + ", 90%, 50%, 0.7)");
    rg.addColorStop(1, "hsla(" + ((hueRot + 60) % 360) + ", 80%, 35%, 0)");
    cctx.fillStyle = rg;
    cctx.beginPath();
    cctx.arc(cx, cy, r, 0, Math.PI * 2);
    cctx.fill();
  }

  /* modo 3: anillos concéntricos (estilo WMP "Spikes") */
  function drawRings(w, h, data) {
    const cx = w / 2, cy = h / 2;
    const rings = 6;
    for (let r = 0; r < rings; r++) {
      const baseR = Math.min(w, h) * (0.08 + r * 0.08);
      const segs = 96;
      const hue = (hueRot + r * 40) % 360;
      cctx.strokeStyle = "hsla(" + hue + ", 95%, 60%, " + (0.85 - r * 0.1) + ")";
      cctx.lineWidth = 2 + r * 0.5;
      cctx.beginPath();
      for (let i = 0; i <= segs; i++) {
        const ang = (i / segs) * Math.PI * 2;
        const idx = Math.floor((i / segs) * data.length * 0.7);
        const v = (data[idx] || 0) / 255;
        const rad = baseR + v * (40 - r * 4) + Math.sin(performance.now() / 600 + r) * 4;
        const x = cx + Math.cos(ang) * rad;
        const y = cy + Math.sin(ang) * rad;
        if (i === 0) cctx.moveTo(x, y);
        else cctx.lineTo(x, y);
      }
      cctx.closePath();
      cctx.stroke();
    }
    // púlsar central
    const avg = data.length ? data.slice(0, 24).reduce((a, b) => a + b, 0) / 24 / 255 : 0;
    const cr = 14 + avg * 22;
    const rg = cctx.createRadialGradient(cx, cy, 0, cx, cy, cr);
    rg.addColorStop(0, "hsla(" + hueRot + ", 100%, 90%, 0.95)");
    rg.addColorStop(1, "hsla(" + hueRot + ", 100%, 50%, 0)");
    cctx.fillStyle = rg;
    cctx.beginPath();
    cctx.arc(cx, cy, cr, 0, Math.PI * 2);
    cctx.fill();
  }

  /* --- API pública --- */
  return {
    open,
    play,
    pause: () => audio && audio.pause(),
    togglePlay,
    next,
    prev,
    stop,
    isPlaying: () => !!(audio && !audio.paused),
    currentPos: () => pos
  };
})();
