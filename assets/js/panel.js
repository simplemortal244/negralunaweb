/* ============================================================
   NEGRALUNA · Panel de descubrimiento (cajón lateral)
   Muestra el contenido real si existe; si no, teje espacios
   reservados que se sienten vivos pero aún no están activos.
   ============================================================ */

"use strict";

/* ---------- toast global ---------- */
let _toastTimer = null;
function showToast(msg, ms) {
  const t = document.getElementById("toast");
  t.textContent = msg;
  t.classList.add("show");
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => t.classList.remove("show"), ms || 3200);
}

/* ---------- RADIO NEGRALUNA ----------
   Reproductor flotante FUERA de los nodos: lanza en aleatorio los
   audios de contenido/musica-fondo/ y sigue con otra canción al
   terminar cada una. Arranca encendida; el visitante puede apagarla
   o encenderla cuando quiera con su botón ON/OFF.
   Regla de oro: cuando suena un audio o un video dentro de un nodo
   (o el juego), la radio se calla sola; al terminar esa reproducción
   vuelve sola — pero solo si el interruptor del visitante quedó en ON. */

const RadioNegraLuna = (() => {
  const baseVol = 0.5;
  let el = null;          // el <audio> de la radio
  let lista = [];         // rutas de las canciones (contenido/musica-fondo/)
  let orden = [];         // orden aleatorio (índices de lista)
  let pos = -1;           // posición dentro del orden aleatorio
  let prefOn = true;      // el interruptor del visitante (ON por defecto)
  let cedida = false;     // callada porque un nodo (o el juego) está sonando
  let fadeId = 0;         // token para cancelar fundidos viejos
  let widget = null;

  function fadeTo(target, ms, done) {
    if (!el) return;
    const mi = ++fadeId;
    const start = el.volume, t0 = performance.now();
    const step = now => {
      if (!el || mi !== fadeId) return;   // un fundido nuevo cancela al anterior
      const k = Math.min(1, (now - t0) / ms);
      el.volume = Math.max(0, Math.min(1, start + (target - start) * k));
      if (k < 1) requestAnimationFrame(step);
      else if (done) done();
    };
    requestAnimationFrame(step);
  }

  function nombre(rel) {
    return rel.split("/").pop().replace(/\.(mp3|wav|ogg|m4a|flac|aac)$/i, "");
  }

  function barajar(primeraDistintaDe) {
    orden = lista.map((_, i) => i);
    for (let i = orden.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [orden[i], orden[j]] = [orden[j], orden[i]];
    }
    // para que una canción no se repita apenas terminó el ciclo completo
    if (orden.length > 1 && orden[0] === primeraDistintaDe) {
      [orden[0], orden[1]] = [orden[1], orden[0]];
    }
  }

  function lanzarActual() {
    if (!el || pos < 0 || !orden.length) return;
    el.src = Contenido.url(lista[orden[pos]]);
    const p = el.play();
    if (p && p.catch) p.catch(() => {});   // sin gesto aún: el primer toque la despierta
  }

  function siguiente() {
    if (!lista.length || !el) return;
    const ultima = pos >= 0 ? orden[pos] : -1;
    if (pos + 1 >= orden.length) {         // ciclo completo → baraja de nuevo
      let intentos = 0;
      do {
        barajar(ultima);
        intentos++;
      } while (orden.length > 1 && orden[0] === ultima && intentos < 8);
      pos = -1;
    }
    pos++;
    lanzarActual();
    pintar();
  }

  function pintar() {
    if (!widget) return;
    const suena = !!(el && !el.paused && !el.ended);
    widget.classList.toggle("on", prefOn);
    widget.classList.toggle("sonando", suena);
    const btn = widget.querySelector(".radio-btn");
    btn.textContent = prefOn ? "ON" : "OFF";
    btn.setAttribute("aria-pressed", String(prefOn));
    btn.setAttribute("aria-label", prefOn ? "Apagar la radio" : "Encender la radio");
    const hayTema = pos >= 0 && orden.length > 0;
    const tema = hayTema ? nombre(lista[orden[pos]]) : "buscando señal…";
    const track = widget.querySelector(".radio-track");
    track.textContent = prefOn ? tema : "en pausa";
    track.title = track.textContent;
  }

  /* los navegadores piden un gesto del visitante antes de sonar:
     armamos el despertar SIEMPRE al arrancar (idempotente) — al primer
     toque o tecla en cualquier parte de la página, la radio despierta */
  let despertarArmado = false;
  function despertarAlPrimerGesto() {
    if (despertarArmado) return;
    despertarArmado = true;
    const dar = () => {
      document.removeEventListener("pointerdown", dar);
      document.removeEventListener("keydown", dar);
      despertarArmado = false;
      if (!el || !prefOn || cedida) return;
      if (!el.src) siguiente();
      else el.play().catch(() => {});
    };
    document.addEventListener("pointerdown", dar);
    document.addEventListener("keydown", dar);
  }

  function tejerWidget() {
    widget = document.createElement("div");
    widget.id = "radio-nl";
    widget.setAttribute("role", "group");
    widget.setAttribute("aria-label", "Radio NegraLuna");
    widget.innerHTML =
      '<span class="radio-luz" aria-hidden="true"></span>' +
      '<div class="radio-info">' +
      '<span class="radio-nombre">Radio NegraLuna</span>' +
      '<span class="radio-track">buscando señal…</span>' +
      "</div>" +
      '<div class="radio-eq" aria-hidden="true"><i></i><i></i><i></i><i></i></div>' +
      '<button class="radio-btn" type="button" aria-pressed="true">ON</button>';
    document.body.appendChild(widget);
    widget.querySelector(".radio-btn").addEventListener("click", api.toggle);
  }

  const api = {
    iniciar() {
      try {
        lista = Contenido.list("musica-fondo").filter(f => f.kind === "audio").map(f => f.path);
      } catch (e) { lista = []; }
      if (!lista.length) return;   // sin canciones no hay radio: nada falso en pantalla
      try {
        el = new Audio();
        el.volume = 0;
        el.preload = "none";
        el.addEventListener("playing", () => { fadeTo(baseVol, 900); pintar(); });
        el.addEventListener("pause", pintar);
        el.addEventListener("ended", siguiente);   // terminó una → suena otra al azar
        barajar();
        pos = -1;
        tejerWidget();
        siguiente();             // encendida al abrir la página
        el.play().catch(() => {});   // si el navegador pide gesto, el despertar ya queda armado
        despertarAlPrimerGesto();
        pintar();
      } catch (e) { el = null; }
    },

    /* el botón ON/OFF del visitante */
    toggle() {
      if (!el) return;
      prefOn = !prefOn;
      if (!prefOn) {
        if (!el.paused) fadeTo(0, 260, () => { if (!prefOn && el) el.pause(); });
      } else if (!cedida) {
        if (el.src) { el.volume = 0; el.play().catch(() => {}); }
        else siguiente();
      }
      pintar();
    },

    /* un nodo (audio, video o juego) toma los parlantes: la radio se calla */
    ceder() {
      if (!el) return;
      cedida = true;
      if (!el.paused) fadeTo(0, 320, () => { if (cedida && el) el.pause(); });
    },

    /* la reproducción del nodo terminó (o el juego se cerró): la radio
       vuelve sola SOLO si el interruptor del visitante sigue en ON */
    reanudar() {
      if (!el || !cedida) return;
      cedida = false;
      if (!prefOn) return;
      el.play().catch(() => {});   // "playing" devuelve el volumen con su fundido
    }
  };

  return api;
})();

/* ---------- YouTubeRadio ----------
   Conecta los iframes de YouTube incrustados en el panel con la radio:
   cuando un visitante reproduce un video de YouTube, la radio se calla
   (igual que con los MP3 locales y los videos MP4). Usa la YouTube
   IFrame Player API (cargada en index.html como `YT.Player`).

   Si la API no carga (sin internet, dominio bloqueado), los videos
   igual se ven — solo no se calla la radio. Tolerante. */

const YouTubeRadio = (() => {
  let players = new Map();   // id -> YT.Player
  let nextId = 1;
  let cedido = false;
  let ready = false;
  // cola de iframes pendientes de attach cuando YT cargue
  let pendientes = [];

  // YT llama `onYouTubeIframeAPIReady` cuando está listo
  window.onYouTubeIframeAPIReady = function() {
    ready = true;
    pendientes.forEach(args => attach.apply(null, args));
    pendientes = [];
  };

  function attach(iframe) {
    if (!iframe) return;
    if (!window.YT || !YT.Player) {
      pendientes.push([iframe]);
      return;
    }
    // si ya tiene un player, no duplicar
    if (iframe.dataset.ytId) return;
    const id = "yt-" + nextId++;
    iframe.id = id;
    iframe.dataset.ytId = id;
    // aseguramos enablejsapi en el src
    const src = iframe.src || "";
    if (src.indexOf("enablejsapi") === -1) {
      const sep = src.indexOf("?") === -1 ? "?" : "&";
      iframe.src = src + sep + "enablejsapi=1&rel=0";
    }
    const player = new YT.Player(id, {
      events: {
        onReady: () => {},
        onStateChange: e => onState(e.data, id)
      }
    });
    players.set(id, player);
  }

  function onState(state, id) {
    // state: -1 sin empezar · 0 ended · 1 playing · 2 paused · 3 buffering · 5 cued
    if (state === 1) {
      // alguien reprodujo el video → la radio se calla
      if (!cedido) {
        cedido = true;
        RadioNegraLuna.ceder();
      }
    } else if (state === 0 || state === 2) {
      // ended o paused → la radio puede volver (solo si el visitante la dejó en ON)
      if (cedido) {
        cedido = false;
        RadioNegraLuna.reanudar();
      }
    }
  }

  function detachAll() {
    // al cerrar el panel: pausar todos los videos y soltar la radio
    players.forEach(p => {
      try { if (p && p.pauseVideo) p.pauseVideo(); } catch (e) {}
    });
    if (cedido) {
      cedido = false;
      RadioNegraLuna.reanudar();
    }
  }

  function clear() {
    // al cerrar panel: para todos, suelta la radio, pero NO borra los players
    // (si abres el mismo panel de nuevo, se reutilizan)
    players.forEach(p => {
      try { if (p && p.stopVideo) p.stopVideo(); } catch (e) {}
    });
    if (cedido) {
      cedido = false;
      RadioNegraLuna.reanudar();
    }
  }

  return { attach, clear, detachAll };
})();

/* ============================================================
   JUEGO EN PANTALLA — Discotopía corre DENTRO de la misma página:
   una capa de pantalla completa con el juego cargado dentro.
   Sin ventanas ni pestañas nuevas: la dirección web nunca cambia,
   así que funciona idéntico en localhost (iniciar-servidor), en el
   preview y en el dominio propio cuando exista — todo viaja por
   rutas relativas dentro del mismo sitio.
   ============================================================ */

const JuegoFloat = (() => {
  let wrap = null, frame = null;

  function asegurar() {
    if (wrap) return;
    wrap = document.createElement("div");
    wrap.id = "juego-float";
    wrap.setAttribute("aria-hidden", "true");
    wrap.innerHTML =
      '<iframe id="juego-frame" title="Discotopía · Luna Errante"></iframe>' +
      '<button id="juego-cerrar" type="button" aria-label="Volver al mapa" title="Volver al mapa (Esc)">\u2715</button>';
    document.body.appendChild(wrap);
    frame = wrap.querySelector("iframe");
    wrap.querySelector("#juego-cerrar").addEventListener("click", cerrar);
  }

  function abrir(src) {
    asegurar();
    if (frame.getAttribute("src") !== src) frame.setAttribute("src", src);
    wrap.classList.add("on");
    wrap.setAttribute("aria-hidden", "false");
    RadioNegraLuna.ceder();   // la radio le cede el paso al juego
  }

  function cerrar() {
    if (!wrap || !wrap.classList.contains("on")) return;
    wrap.classList.remove("on");
    wrap.setAttribute("aria-hidden", "true");
    frame.setAttribute("src", "about:blank");   // apaga el juego y su música
    RadioNegraLuna.reanudar();                  // y la radio vuelve
  }

  // el juego avisa "me cierro" (botón verde VOLVER AL MAPA o Esc dentro del juego)
  window.addEventListener("message", e => {
    if (e.data && e.data.tipo === "juego:cerrar") cerrar();
  });
  // Esc con el foco fuera del juego también cierra la capa
  document.addEventListener("keydown", e => {
    if (e.key === "Escape") cerrar();
  });

  return { abrir, cerrar, abierta: () => !!(wrap && wrap.classList.contains("on")) };
})();

const Panel = (() => {

  const FAKE_MSG = "Este rincón aún no tiene contenido — escríbelo en tu carpeta contenido/.";
  const MAIL_DEFAULT = "hola@negraluna.cl";
  const FONO_DEFAULT = "+56 9 XXXX XXXX";

  let currentNode = null;

  /* ---------- utilidades ---------- */

  function chain(node) {
    const out = [];
    let n = node;
    while (n) { out.unshift(n); n = n.parent; }
    return out;
  }

  function icon(name, cls) {
    return (ICONS[name] || ICONS.estrella).replace("<svg ", '<svg class="' + (cls || "") + '" ');
  }

  function phBlock(title, sub, iconName) {
    return '<div class="ph" data-fake role="button" tabindex="0" aria-label="' + title + '">' +
      icon(iconName || "montana") +
      '<div class="ph-t">' + title + "</div>" +
      (sub ? '<div class="ph-s">' + sub + "</div>" : "") +
      "</div>";
  }

  /* render de texto simple: ## título, - lista, párrafos */
  function renderTxt(raw) {
    if (!raw || !raw.trim()) return "";
    const lines = raw.split(/\r?\n/);
    let html = "", ul = false, p = [];
    const flushP = () => { if (p.length) { html += "<p>" + p.join("<br>") + "</p>"; p = []; } };
    const flushUl = () => { if (ul) { html += "</ul>"; ul = false; } };
    lines.forEach(line => {
      const t = line.trim();
      if (!t) { flushP(); flushUl(); return; }
      const esc = escapeHtml(t).replace(/\*\*(.+?)\*\*/g, "<b>$1</b>");
      if (t.startsWith("## ")) { flushP(); flushUl(); html += "<h3>" + esc.slice(3) + "</h3>"; }
      else if (t.startsWith("- ")) { flushP(); if (!ul) { html += "<ul>"; ul = true; } html += "<li>" + esc.slice(2) + "</li>"; }
      else { flushUl(); p.push(esc); }
    });
    flushP(); flushUl();
    return html;
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  function txtSection(node, sectionTitle, opts) {
    const rel = node.txt || null;
    let raw = rel ? Contenido.text(rel) : null;
    // si la línea de tiempo se muestra aparte, sus líneas no van como bullets
    if (raw && opts && opts.omitirLineaTiempo) {
      raw = raw.split(/\r?\n/).filter(l => {
        const t = l.trim();
        return !(t.startsWith("- ") && /\b(?:19|20)\d{2}\b/.test(t));
      }).join("\n");
    }
    let html = '<div class="sec"><div class="sec-title">' + icon("pluma") + (sectionTitle || "La palabra") + "</div>";
    if (raw) {
      html += '<div class="txt">' + renderTxt(raw) + "</div>";
    } else {
      html += phBlock(
        "El texto de " + node.label,
        Contenido.ok() ? "escríbelo en contenido/" + (rel || "…") : "abre la web con iniciar-servidor para que lea tu carpeta",
        "libro"
      );
    }
    html += "</div>";
    return html;
  }

  function firstMeaningfulLine(rel) {
    const raw = Contenido.text(rel);
    if (!raw) return null;
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith("## "));
    return lines.length ? lines[0] : null;
  }

  /* ---------- galería con vista grande al pasar el cursor ----------
     Miniaturas a la izquierda + escenario a la derecha: la foto por
     la que pasa el cursor se abre en grande al lado derecho. */

  function primeraCarpetaConImagenes(candidates) {
    for (let i = 0; i < candidates.length; i++) {
      const imgs = Contenido.list(candidates[i]).filter(f => f.kind === "image");
      if (imgs.length) return { dir: candidates[i], files: imgs };
    }
    return null;
  }

  /* carpetas candidatas de fotos: la propia del nodo y las de sus ancestros */
  function candidatosFotos(node) {
    const out = [];
    if (node.kind === "galeria" && node.path && node.dir) out.push(node.path + "/" + node.dir);
    if (node.path) { out.push(node.path + "/fotos"); out.push(node.path); }
    let n = node.parent;
    while (n) { if (n.path) out.push(n.path + "/fotos"); n = n.parent; }
    return out;
  }

  function galSplit(files) {
    const u = f => Contenido.url(f.path);
    const primero = files[0];
    return '<div class="gal">' +
      '<div class="gal-thumbs" role="listbox" aria-label="Miniaturas — pasa el cursor para ver en grande">' +
      files.map((f, i) =>
        '<button type="button" class="gal-thumb' + (i === 0 ? " hot" : "") + '" role="option" aria-selected="' + (i === 0) +
        '" data-full="' + u(f) + '" data-cap="' + escapeHtml(f.name) + '" data-idx="' + i +
        '" aria-label="Ver foto ' + (i + 1) + ": " + escapeHtml(f.name) + '">' +
        '<img loading="lazy" src="' + u(f) + '" alt=""></button>'
      ).join("") +
      "</div>" +
      '<figure class="gal-stage">' +
      '<div class="gal-frame"><img src="' + u(primero) + '" alt="' + escapeHtml(primero.name) + '"></div>' +
      '<figcaption class="gal-cap"><span class="gal-name">' + escapeHtml(primero.name) + '</span><span class="gal-count">1 / ' + files.length + "</span></figcaption>" +
      "</figure></div>";
  }

  /* muestra una miniatura en grande en el escenario derecho */
  function galVer(th) {
    const gal = th.closest(".gal");
    if (!gal) return;
    const big = gal.querySelector(".gal-frame img");
    const nameEl = gal.querySelector(".gal-name");
    const countEl = gal.querySelector(".gal-count");
    const full = th.getAttribute("data-full");
    const cap = th.getAttribute("data-cap");
    if (big && big.getAttribute("src") !== full) {
      big.classList.add("swap");
      big.setAttribute("src", full);
      big.setAttribute("alt", cap || "");
      const listo = () => {
        big.classList.remove("swap"); big.removeEventListener("load", listo);
        encuadrarEnMarco(big);
      };
      big.addEventListener("load", listo);
      setTimeout(listo, 650); // si viene del caché y no dispara load
    }
    if (nameEl && cap) nameEl.textContent = cap;
    const idx = parseInt(th.getAttribute("data-idx"), 10);
    const total = gal.querySelectorAll(".gal-thumb").length;
    if (countEl) countEl.textContent = (idx + 1) + " / " + total;
    gal.querySelectorAll(".gal-thumb.hot").forEach(t => { t.classList.remove("hot"); t.setAttribute("aria-selected", "false"); });
    th.classList.add("hot");
    th.setAttribute("aria-selected", "true");
    // y la versión GRANDE, flotando al otro lado del panel
    galFlotanteVer(full, cap, idx, total);
  }

  /* ---------- vista grande flotante (al otro lado del panel) ----------
     Un solo elemento reutilizable en body: al pasar el cursor por una
     miniatura, la foto se abre MUCHO más grande, fuera del panel. */

  let galFloat = null, gfImg = null, gfName = null, gfCount = null;

  /* ---------- encuadre exacto ----------
     Fija el tamaño en px según la proporción NATURAL de la foto, dentro del
     presupuesto de pantalla. Así el marco abraza cada foto (vertical,
     horizontal o panorámica) sin recorte y sin colapsar nunca a 0×0 —
     el bug clásico de imágenes sin dimensiones intrínsecas dentro de flex. */

  function encuadrar(img, maxW, maxH) {
    const nw = img.naturalWidth, nh = img.naturalHeight;
    if (!nw || !nh) return;          // sin datos: manda la red de seguridad CSS
    img.style.width = "";            // limpia encuadres anteriores
    img.style.height = "";
    const r = Math.min(maxW / nw, maxH / nh, 1);   // nunca agranda de más
    img.style.width = Math.round(nw * r) + "px";
    img.style.height = Math.round(nh * r) + "px";
  }

  /* presupuesto de pantalla de la vista flotante (espejo de su CSS) */
  function presupuestoFlotante() {
    const vw = window.innerWidth, vh = window.innerHeight;
    let ancho = Math.min(vw * 0.44, 680);
    if (vw <= 1280) ancho = Math.min(vw * 0.50, 600);
    if (vw <= 980) ancho = vw * 0.56;
    return { w: ancho, h: vh * 0.78 };
  }

  /* para la vista grande DENTRO del panel: usa el ancho real del marco */
  function encuadrarEnMarco(img) {
    const marco = img.parentElement;
    const w = marco ? marco.clientWidth : 0;
    if (w > 40) encuadrar(img, w, window.innerHeight * 0.54);
  }

  function asegurarFlotante() {
    if (galFloat) return;
    galFloat = document.createElement("div");
    galFloat.id = "gal-float";
    galFloat.setAttribute("aria-hidden", "true");
    galFloat.innerHTML = '<div class="gf-frame"><img alt=""></div>' +
      '<div class="gf-cap"><span class="gf-name"></span><span class="gf-count"></span></div>';
    document.body.appendChild(galFloat);
    gfImg = galFloat.querySelector("img");
    gfName = galFloat.querySelector(".gf-name");
    gfCount = galFloat.querySelector(".gf-count");
  }

  function galFlotanteVer(src, cap, idx, total) {
    asegurarFlotante();
    const p = presupuestoFlotante();
    if (gfImg.getAttribute("src") !== src) {
      gfImg.classList.add("swap");
      gfImg.setAttribute("src", src);
      gfImg.setAttribute("alt", cap || "");
      const listo = () => {
        gfImg.classList.remove("swap"); gfImg.removeEventListener("load", listo);
        encuadrar(gfImg, p.w, p.h);
      };
      gfImg.addEventListener("load", listo);
      setTimeout(listo, 650);
    } else {
      encuadrar(gfImg, p.w, p.h);   // misma foto: reencuadre barato (resize)
    }
    if (cap) gfName.textContent = cap;
    if (!isNaN(idx)) gfCount.textContent = (idx + 1) + " / " + total;
    galFloat.classList.add("on");
  }

  /* al cambiar el tamaño de la ventana, la foto abierta se reencuadra */
  window.addEventListener("resize", () => {
    if (galFloat && galFloat.classList.contains("on") && gfImg.complete) {
      const p = presupuestoFlotante();
      encuadrar(gfImg, p.w, p.h);
    }
  });

  function galFlotanteOcultar() {
    if (galFloat) galFloat.classList.remove("on");
  }

  /* sección de fotos reutilizable en todos los nodos */
  function seccionFotos(node, opts) {
    opts = opts || {};
    const hallazgo = primeraCarpetaConImagenes(candidatosFotos(node));
    let html = '<div class="sec"><div class="sec-title">' + icon("foto") + (opts.title || "Fotos") + "</div>";
    if (hallazgo) {
      html += galSplit(hallazgo.files);
      if (node.kind === "galeria") {
        html += '<div class="grid" style="margin-top:10px"><div class="ph cell" data-fake>' + icon("estrella") +
          '<div class="ph-t">+ más fotos</div><div class="ph-s">sube a contenido/' + hallazgo.dir + "/</div></div></div>";
      }
    } else {
      const pista = node.kind === "galeria" && node.path && node.dir ? node.path + "/" + node.dir : (node.path ? node.path + "/fotos" : "…/fotos");
      html += phBlock(opts.phTitle || "Las fotos vivirán aquí", "copia imágenes a contenido/" + pista + "/ y recarga", "foto");
    }
    html += "</div>";
    return html;
  }

  /* ---------- secciones por tipo ---------- */

  /* ---------- línea de tiempo real ----------
     Lee los hitos del .txt: cada línea "- Evento: 2019" o
     "- 2019 — Evento" se convierte en un hito con su año.
     El orden es el que escribas en el archivo. */

  function parseLineaTiempo(raw) {
    if (!raw) return [];
    const out = [];
    raw.split(/\r?\n/).forEach(line => {
      const t = line.trim();
      if (!t.startsWith("- ")) return;
      const ym = t.match(/\b((?:19|20)\d{2})\b/);
      if (!ym) return;
      const year = ym[1];
      let what = t.slice(2).split(year).join(" ");
      what = what.replace(/^[\s:–—\-·,]+/, "").replace(/[\s:–—\-·,.]+$/, "").trim();
      out.push({ year: year, what: what || year });
    });
    return out;
  }

  function lineaTiempoHtml(items) {
    let h = '<div class="tl">';
    items.forEach(it => {
      h += '<div class="tl-item"><div class="tl-year">' + it.year + '</div>' +
        '<div class="tl-what">' + escapeHtml(it.what) + "</div></div>";
    });
    return h + "</div>";
  }

  function bodyTexto(node) {
    const esHitos = node.slot === "línea de tiempo";
    let html = txtSection(node, null, { omitirLineaTiempo: esHitos });
    if (esHitos) {
      const items = parseLineaTiempo(Contenido.text(node.txt));
      if (items.length) {
        html += '<div class="sec"><div class="sec-title">' + icon("piramide") + "Línea de tiempo</div>" +
          lineaTiempoHtml(items) + "</div>";
      }
    }
    html += seccionFotos(node, { title: "Fotos de " + parentLabel(node) });
    return html;
  }

  function bodyServicio(node) {
    let html = txtSection(node, "En qué consiste");
    html += seccionFotos(node, { title: "El estudio", phTitle: "Fotos de equipos y del lugar" });
    html += '<div class="sec"><div class="sec-title">' + icon("nota") + "Escúchalo</div>" +
      phBlock("Audio de muestra", "deja un .mp3 en contenido/" + node.path + "/ y lo tejeremos al reproductor", "nota") +
      "</div>";
    return html;
  }

  function parentLabel(node) {
    return node.parent && node.parent.parent ? node.parent.label : "el proyecto";
  }

  function bodyGaleria(node) {
    return seccionFotos(node, { title: "Fotos" });
  }

  function bodyVideos(node) {
    const dir = node.path + "/" + node.dir;
    const files = Contenido.list(dir).filter(f => f.kind === "video");
    const enlaces = parseEnlacesVideo(Contenido.text(dir + "/videos.txt"));
    let html = '<div class="sec"><div class="sec-title">' + icon("video") + "Videos</div>";
    if (files.length || enlaces.length) {
      html += enlaces.map(v =>
        v.ytId
          ? '<div class="vid"><div class="vid-embed"><iframe src="https://www.youtube-nocookie.com/embed/' + v.ytId + '" title="' + escapeHtml(v.titulo || "Video") + '" loading="lazy" allowfullscreen></iframe></div><div class="cap">' + escapeHtml(v.titulo || "Video") + "</div></div>"
          : '<div class="vid vid-link"><a class="btn-fantasma" href="' + escapeHtml(v.url) + '" target="_blank" rel="noopener">' + icon("video") + "Ver video" + (v.titulo ? " · " + escapeHtml(v.titulo) : "") + "</a></div>"
      ).join("") +
      files.map(f =>
        '<div class="vid"><video controls preload="metadata" src="' + Contenido.url(f.path) + '"></video><div class="cap">' + escapeHtml(f.name) + "</div></div>"
      ).join("");
    } else {
      html += phBlock(
        "Los videos de " + parentLabel(node) + " se proyectarán aquí",
        "copia .mp4 a contenido/" + dir + "/ o escribe enlaces de YouTube en contenido/" + dir + "/videos.txt",
        "video"
      );
    }
    html += "</div>";
    html += seccionFotos(node, { title: "Fotos de " + parentLabel(node) });
    // comentarios por proyecto (al pie de la sección de videos) — contexto = carpeta de videos
    html += seccionComentarios(dir, "Comenta los videos");
    return html;
  }

  /* enlaces de videos.txt: "Título | https://…" o solo la URL — YouTube se incrusta.
     Acepta los formatos: youtube.com/watch?v=XXX, youtu.be/XXX,
     youtube.com/embed/XXX, youtube.com/shorts/XXX — y URLs con parámetros
     extra (?t=30s, ?list=..., etc.) — el ID se limpia y se incrusta limpio. */
  function parseEnlacesVideo(raw) {
    const out = [];
    (raw || "").split(/\r?\n/).forEach(l => {
      const t = l.trim().replace(/^-\s*/, "");
      if (!t || t.startsWith("## ") || t.startsWith("#")) return;
      const m = t.match(/https?:\/\/\S+/);
      if (!m) return;
      const url = m[0];
      const titulo = t.slice(0, m.index).replace(/[:|·–—]\s*$/, "").trim();
      // ID de YouTube: 11 caracteres alfanuméricos, guion y guion bajo
      const yt = url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
      out.push({ url, titulo, ytId: yt ? yt[1] : null });
    });
    return out;
  }

  function bodyMusica(node) {
    const dir = node.path + "/" + node.dir;
    const files = Contenido.list(dir).filter(f => f.kind === "audio");
    let html = '<div class="sec"><div class="sec-title">' + icon("nota") + "Reproductor de música</div>";
    html += '<div class="player-big"><div class="pb-disc"></div>' +
      '<div class="pb-bar"><i></i></div>' +
      '<div class="pb-row"><span>SIDE A</span><span>' + escapeHtml(parentLabel(node)).toUpperCase() + "</span><span>33⅓ RPM</span></div></div>";
    if (files.length) {
      // las pistas se guardan como datos en el contenedor y el botón lanza
      // el NodePlayer (visualizador estilo WMP + auto-siguiente)
      const tracksData = files.map(f => ({
        name: f.name.replace(/\.(mp3|wav|ogg|m4a|flac|aac)$/i, ""),
        url: Contenido.url(f.path),
        size: f.bytes
      }));
      html += '<div class="musica-lista" data-tracks="' + escapeHtml(JSON.stringify(tracksData)) +
        '" data-artist="' + escapeHtml(parentLabel(node)) + '" style="margin-top:16px">' +
        files.map((f, i) => {
          const name = f.name.replace(/\.(mp3|wav|ogg|m4a|flac|aac)$/i, "");
          return '<div class="track" data-idx="' + i + '">' +
            '<button class="t-btn" data-track="' + i + '" aria-label="Reproducir ' + escapeHtml(name) + '">' +
            '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5l11 6.5-11 6.5Z"/></svg></button>' +
            '<div class="t-info"><div class="t-name">' + escapeHtml(name) + '</div><div class="t-meta">' + Contenido.size(f.bytes) + "</div></div>" +
            "</div>";
        }).join("") + "</div>";
    } else {
      html += '<div style="margin-top:16px">' + phBlock(
        "Las canciones de " + parentLabel(node) + " sonarán aquí",
        "deja .mp3 en contenido/" + dir + "/ y recarga",
        "nota"
      ) + "</div>";
    }
    html += "</div>";
    html += seccionFotos(node, { title: "Fotos de " + parentLabel(node) });
    // comentarios por proyecto (al pie de la sección de música) — el contexto
    // coincide con la carpeta de la música: proyectos/<proyecto>/musica
    html += seccionComentarios(dir, "Comenta la música");
    return html;
  }

  /* ---------- PODCAST ÓRBITA LUNA ----------
     Capítulos subidos como archivos (audio/ y video/) o enlaces de
     YouTube. capitulos.txt les da título y descripción con el formato
     "archivo-o-URL | Título | descripción opcional" (una por línea;
     las líneas que empiezan con # son ayuda y se ignoran). */

  function parseCapitulos(raw) {
    const out = [];
    (raw || "").split(/\r?\n/).forEach(l => {
      const t = l.trim().replace(/^-\s*/, "");
      if (!t || t.startsWith("#")) return;
      const parts = t.split("|").map(s => s.trim());
      const clave = parts[0] || "";
      out.push({
        clave,
        url: /^https?:\/\//i.test(clave) ? clave : null,
        titulo: parts[1] || "",
        desc: parts[2] || ""
      });
    });
    return out;
  }

  const EXT_MEDIA = /\.(mp3|wav|ogg|m4a|flac|aac|mp4|webm|mov|mkv|avi)$/i;

  /* cruza los archivos subidos con capitulos.txt: título amable si hay,
     nombre del archivo si no — nadie ve "track01_final_v2.mp3" sin contexto */
  function emparejarCapitulos(files, caps) {
    const mapa = {};
    caps.forEach(c => {
      if (c.url) return;
      mapa[c.clave.replace(EXT_MEDIA, "").toLowerCase()] = c;
    });
    return files.map(f => {
      const base = f.name.replace(EXT_MEDIA, "");
      const c = mapa[base.toLowerCase()];
      return { file: f, titulo: (c && c.titulo) || base, desc: (c && c.desc) || "" };
    });
  }

  function bodyPodcastAudio(node) {
    const dir = node.path + "/" + node.dir;
    const files = Contenido.list(dir).filter(f => f.kind === "audio");
    const eps = emparejarCapitulos(files, parseCapitulos(Contenido.text(dir + "/capitulos.txt")));
    let html = txtSection(node, "El podcast");
    html += '<div class="sec"><div class="sec-title">' + icon("parlante") + "Capítulos de audio</div>";
    if (eps.length) {
      // la lista entera alimenta al NodePlayer (visualizador + auto-siguiente)
      const tracksData = eps.map(e => ({
        name: e.titulo,
        url: Contenido.url(e.file.path),
        size: e.file.bytes
      }));
      html += '<div class="musica-lista" data-tracks="' + escapeHtml(JSON.stringify(tracksData)) +
        '" data-artist="Órbita Lunar" style="margin-top:16px">' +
        eps.map((e, i) =>
          '<div class="track" data-idx="' + i + '">' +
          '<span class="ep-num">EP ' + String(i + 1).padStart(2, "0") + "</span>" +
          '<button class="t-btn" data-track="' + i + '" aria-label="Reproducir ' + escapeHtml(e.titulo) + '">' +
          '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5l11 6.5-11 6.5Z"/></svg></button>' +
          '<div class="t-info"><div class="t-name" title="' + escapeHtml(e.titulo) + '">' + escapeHtml(e.titulo) + "</div>" +
          (e.desc
            ? '<div class="t-meta pod-desc">' + escapeHtml(e.desc) + "</div>"
            : '<div class="t-meta">' + escapeHtml(e.file.name) + " · " + Contenido.size(e.file.bytes) + "</div>") +
          '</div></div>'
        ).join("") + "</div>";
    } else {
      html += '<div style="margin-top:16px">' + phBlock(
        "Los capítulos de Órbita Lunar sonarán aquí",
        "deja .mp3 en contenido/" + dir + "/ y recarga · nómbralos 01, 02… para mantener el orden",
        "microfono"
      ) + "</div>";
    }
    html += "</div>";
    html += seccionFotos(node, { title: "Imágenes de Órbita Lunar" });
    // comentarios del podcast de audio
    html += seccionComentarios("podcast/orbita-lunar/audio", "Comenta el podcast");
    return html;
  }

  function bodyPodcastVideo(node) {
    const dir = node.path + "/" + node.dir;
    const files = Contenido.list(dir).filter(f => f.kind === "video");
    const caps = parseCapitulos(Contenido.text(dir + "/capitulos.txt"));
    const eps = emparejarCapitulos(files, caps);
    const enlaces = caps.filter(c => c.url);
    let html = txtSection(node, "El podcast");
    html += '<div class="sec"><div class="sec-title">' + icon("video") + "Capítulos de video</div>";
    if (eps.length || enlaces.length) {
      html += enlaces.map(c => {
        const yt = c.url.match(/(?:youtube(?:-nocookie)?\.com\/(?:watch\?v=|embed\/|shorts\/|live\/)|youtu\.be\/)([\w-]{11})/);
        const titulo = c.titulo || "Capítulo";
        return yt
          ? '<div class="vid"><div class="vid-embed"><iframe src="https://www.youtube-nocookie.com/embed/' + yt[1] + '" title="' + escapeHtml(titulo) + '" loading="lazy" allowfullscreen></iframe></div><div class="cap">' + escapeHtml(titulo) + (c.desc ? " — " + escapeHtml(c.desc) : "") + "</div></div>"
          : '<div class="vid vid-link"><a class="btn-fantasma" href="' + escapeHtml(c.url) + '" target="_blank" rel="noopener">' + icon("video") + "Ver capítulo" + (c.titulo ? " · " + escapeHtml(c.titulo) : "") + "</a></div>";
      }).join("") +
        eps.map(e =>
          '<div class="vid"><video controls preload="metadata" src="' + Contenido.url(e.file.path) + '"></video><div class="cap">' + escapeHtml(e.titulo) + (e.desc ? " — " + escapeHtml(e.desc) : "") + "</div></div>"
        ).join("");
    } else {
      html += phBlock(
        "Los capítulos en video se proyectarán aquí",
        "copia .mp4 a contenido/" + dir + "/ o pega enlaces de YouTube en contenido/" + dir + "/capitulos.txt",
        "video"
      );
    }
    html += "</div>";
    html += seccionFotos(node, { title: "Imágenes de Órbita Lunar" });
    // comentarios del podcast de video
    html += seccionComentarios("podcast/orbita-lunar/video", "Comenta el podcast");
    return html;
  }

  function bodyJuego(node) {
    const DIR_AUDIOS = "proyectos/luna-errante/discotopia/juego/audios";
    const canciones = Contenido.list(DIR_AUDIOS).filter(f => f.kind === "audio");
    let html = '<div class="sec"><div class="arcade">' +
      '<div class="coin">◆ DISCOTOPÍA ◆</div>' +
      '<div class="arc-sub">Rail shooter retro: pilotea la nave de Luna Errante<br>al ritmo de la música de la banda.</div>' +
      '<div class="arc-lights"><i></i><i></i><i></i><i></i><i></i></div>' +
      '<button class="btn-jugar" type="button" data-jugar>' + icon("juego") + "Insertar moneda · JUGAR</button>" +
      '<div class="arc-sub arc-mini">pantalla completa aquí mismo · Esc o ◀ VOLVER te traen de vuelta</div>' +
      "</div></div>";

    // música del juego: lo que haya en la carpeta de audios
    html += '<div class="sec"><div class="sec-title">' + icon("nota") + "Música del juego</div>";
    if (canciones.length) {
      html += '<p class="jl-count">' + canciones.length + " canción" + (canciones.length === 1 ? "" : "es") + " en la ranura:</p>" +
        '<ul class="jl">' + canciones.map(f =>
          '<li>' + escapeHtml(f.name.replace(/\.(mp3|wav|ogg|m4a|flac|aac)$/i, "")) + "</li>"
        ).join("") + "</ul>";
    } else {
      html += phBlock("La ranura de canciones está vacía", "sube audios a contenido/" + DIR_AUDIOS + "/", "nota");
    }
    html += '<p class="jl-pista">El reproductor del juego lee esa carpeta solo: lo que subas, suena. Teclas 1-9 cambian de canción y al terminar un tema sigue el siguiente.</p></div>';

    const raw = Contenido.text(node.txt);
    if (raw) html += txtSection(node, "Cómo se juega");
    html += seccionFotos(node, { title: "Fotos" });
    return html;
  }

  function bodyMapa(node) {
    let html = '<div class="sec"><div class="sec-title">' + icon("pin") + "Dónde teje NegraLuna</div>" +
      '<div class="map-wrap"><iframe title="Mapa: ' + escapeHtml(UBICACION.direccion) + '" loading="lazy" referrerpolicy="no-referrer-when-downgrade" src="' + UBICACION.mapsEmbed + '"></iframe></div>' +
      '<p style="margin-top:10px;font-size:12.5px;color:var(--hueso3);letter-spacing:.03em">El mapa carga con internet · Federico Errázuriz 264, Pinto, Ñuble.</p>' +
      '<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">' +
      '<a class="btn-fantasma" href="' + UBICACION.mapsRuta + '" target="_blank" rel="noopener">Cómo llegar</a>' +
      '<button class="btn-fantasma" data-copy="' + escapeHtml(UBICACION.direccion) + '">Copiar dirección</button>' +
      "</div></div>";
    const raw = Contenido.text(node.txt);
    if (raw) html += txtSection(node, "Referencias");
    html += seccionFotos(node, { title: "El lugar" });
    return html;
  }

  function bodyMail(node) {
    const rel = node.txt;
    const sinServidor = !Contenido.ok();
    const mail = (Contenido.ok() ? firstMeaningfulLine(rel) : null) || MAIL_DEFAULT;
    const isPlaceholder = mail.includes("XXXX");
    let html = '<div class="sec"><div class="sec-title">' + icon("correo") + "Mail</div>" +
      '<a class="c-row" href="mailto:' + escapeHtml(mail) + '">' +
      '<span class="c-ic">' + icon("correo") + "</span>" +
      "<span><span class='c-t'>Escríbenos a</span><br><span class='c-v'>" + escapeHtml(mail) + "</span></span></a>";
    if (sinServidor) html += '<div style="margin-top:10px">' + phBlock("Esta vista no lee tu carpeta", "cierra y abre la web con iniciar-servidor", "correo") + "</div>";
    else if (isPlaceholder) html += '<div style="margin-top:10px">' + phBlock("Correo por actualizar", "edita contenido/" + rel, "correo") + "</div>";
    html += "</div>";
    return html;
  }

  function bodyTelefono(node) {
    const rel = node.txt;
    const sinServidor = !Contenido.ok();
    const fono = (Contenido.ok() ? firstMeaningfulLine(rel) : null) || FONO_DEFAULT;
    const isPlaceholder = fono.includes("XXXX");
    let html = '<div class="sec"><div class="sec-title">' + icon("telefono") + "Teléfono</div>" +
      '<a class="c-row" href="tel:' + escapeHtml(fono.replace(/\s+/g, "")) + '">' +
      '<span class="c-ic">' + icon("telefono") + "</span>" +
      "<span><span class='c-t'>Llámanos</span><br><span class='c-v'>" + escapeHtml(fono) + "</span></span></a>";
    if (sinServidor) html += '<div style="margin-top:10px">' + phBlock("Esta vista no lee tu carpeta", "cierra y abre la web con iniciar-servidor", "telefono") + "</div>";
    else if (isPlaceholder) html += '<div style="margin-top:10px">' + phBlock("Teléfono por actualizar", "edita contenido/" + rel, "telefono") + "</div>";
    html += "</div>";
    return html;
  }

  function bodyFormulario(node) {
    /* canales reales: WhatsApp con el teléfono de contenido/contacto/telefono.txt
       y correo con contenido/contacto/mail.txt. Si el dato aún no se completa,
       el canal correspondiente no se muestra. */
    const mail = firstMeaningfulLine("contacto/mail.txt") || MAIL_DEFAULT;
    const fonoRaw = firstMeaningfulLine("contacto/telefono.txt") || "";
    const fonoDigits = fonoRaw.replace(/\D/g, "");
    const fonoOk = fonoDigits.length >= 9 && fonoRaw.indexOf("XXXX") === -1;
    const mailOk = mail.indexOf("XXXX") === -1;

    let html = '<div class="sec"><div class="sec-title">' + icon("paloma") + "Escríbenos</div>" +
      '<form class="form" id="nl-form">' +
      "<div><label for='f-nombre'>Tu nombre</label><input id='f-nombre' name='nombre' autocomplete='name' placeholder='¿Quién teje?'></div>" +
      "<div><label for='f-mail'>Tu correo</label><input id='f-mail' name='correo' type='email' autocomplete='email' placeholder='tu@correo.cl'></div>" +
      "<div><label for='f-msg'>Mensaje</label><textarea id='f-msg' name='mensaje' placeholder='Cuéntanos qué quieres crear…'></textarea></div>";
    if (fonoOk) html += '<button class="btn-tejido" type="button" data-canal="whatsapp">Enviar por WhatsApp</button>';
    if (mailOk) html += '<button class="btn-fantasma" type="button" data-canal="correo" style="margin-top:10px">Enviar por correo</button>';
    html += "</form></div>";
    const raw = Contenido.text(node.txt);
    if (raw) html += txtSection(node, "Notas");
    return html;
  }

  /* ---------- envío real del formulario ----------
     Abre WhatsApp (wa.me) o el cliente de correo con el mensaje
     ya compuesto: la persona lo revisa y lo manda. Sin servidores
     intermedios, sin datos guardados en ninguna parte. */

  function enviarFormulario(canal) {
    const form = document.getElementById("nl-form");
    if (!form) return;
    const nombre = form.querySelector("#f-nombre").value.trim();
    const correo = form.querySelector("#f-mail").value.trim();
    const mensaje = form.querySelector("#f-msg").value.trim();
    if (!mensaje) { showToast("Escribe tu mensaje primero: ¿qué quieres crear?"); return; }

    const quien = nombre
      ? "Soy " + nombre + (correo ? " (" + correo + ")" : "")
      : (correo ? "Mi correo: " + correo : "");
    const texto = "Hola NegraLuna 🌙" + (quien ? "\n" + quien : "") + "\n\n" + mensaje;

    if (canal === "whatsapp") {
      const digits = ((firstMeaningfulLine("contacto/telefono.txt") || "").replace(/\D/g, ""));
      if (digits.length < 9) { showToast("El teléfono aún no está configurado."); return; }
      window.open("https://wa.me/" + digits + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
      showToast("Abriendo WhatsApp con tu mensaje listo.");
    } else {
      const mail = firstMeaningfulLine("contacto/mail.txt") || MAIL_DEFAULT;
      const asunto = "Hola NegraLuna" + (nombre ? " · " + nombre : "");
      window.location.href = "mailto:" + mail + "?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(texto);
      showToast("Abriendo tu correo con el mensaje listo.");
    }
    form.reset();
  }

  /* ---------- TIENDA: escaparate + pedidos por WhatsApp/correo ----------
     Cada producto es una carpeta dentro de contenido/tienda/:
       mi-producto/producto.txt  → 1ª línea: nombre · línea "Precio: …" · resto: descripción
       mi-producto/fotos/        → su foto (la primera imagen es la del escaparate)
     Tolerante al mundo real: la foto puede ir suelta en la carpeta del producto
     (o en fotos/) y si falta producto.txt sirve cualquier otro .txt de la carpeta.
     El pedido viaja igual que el formulario: wa.me o mailto, sin servidores. */

  function productosTienda() {
    const porCarpeta = new Map();
    if (Contenido.ok()) {
      // recorrido directo del árbol: list() solo trae archivos sueltos,
      // y los productos viven en subcarpetas tienda/<producto>/…
      Object.keys(Contenido.files).forEach(k => {
        if (k.indexOf("tienda/") !== 0) return;
        const rest = k.slice("tienda/".length);
        const i = rest.indexOf("/");
        if (i < 1) return;                 // tienda.txt y sueltos: no son productos
        const id = rest.slice(0, i);
        if (id.startsWith("_")) return;    // carpetas _modelo: plantillas, no se venden
        if (!porCarpeta.has(id)) porCarpeta.set(id, []);
        const f = Contenido.files[k];
        porCarpeta.get(id).push({ path: k, name: rest, kind: f.kind, bytes: f.bytes });
      });
    }
    return Array.from(porCarpeta.entries()).map(([id, files]) => {
      // producto.txt es el canónico; si no está, sirve cualquier otro .txt de la carpeta
      const textos = files.filter(x => x.kind === "text");
      const txtF = textos.find(x => x.name === id + "/producto.txt") ||
                   textos.find(x => !x.name.split("/").pop().startsWith("_"));
      const enFotos = files.filter(x => x.kind === "image" && x.name.indexOf(id + "/fotos/") === 0);
      const enRaiz = files.filter(x => x.kind === "image" && x.name.slice(id.length + 1).indexOf("/") === -1);
      const img = enFotos[0] || enRaiz[0] || null;
      return { id, txtPath: txtF ? txtF.path : null, imgPath: img ? img.path : null };
    });
  }

  function parseProducto(raw) {
    const lines = (raw || "").split(/\r?\n/).map(l => l.trim());
    let nombre = "", precio = "", desc = [];
    lines.forEach(l => {
      if (!l || l.startsWith("## ")) return;
      if (!nombre) { nombre = l.replace(/^#\s*/, ""); return; }
      const m = l.match(/^(?:precio|valor)\s*[:=]\s*(.+)$/i);
      if (m) { if (!precio) precio = m[1]; return; }
      desc.push(l);
    });
    return { nombre, precio, desc };
  }

  function tarjetaProducto(p) {
    const d = parseProducto(p.txtPath ? Contenido.text(p.txtPath) : null);
    const nombre = d.nombre || p.id;
    const fonoRaw = firstMeaningfulLine("contacto/telefono.txt") || "";
    const fonoOk = fonoRaw.replace(/\D/g, "").length >= 9 && fonoRaw.indexOf("XXXX") === -1;
    const mail = firstMeaningfulLine("contacto/mail.txt") || MAIL_DEFAULT;
    const mailOk = mail.indexOf("XXXX") === -1;
    const foto = p.imgPath
      ? '<div class="prod-foto"><img loading="lazy" src="' + Contenido.url(p.imgPath) + '" alt="' + escapeHtml(nombre) + '"></div>'
      : '<div class="prod-foto sin">' + icon("foto") + "</div>";
    let acciones = "";
    if (fonoOk) acciones += '<button class="btn-tejido mini" data-pedido="whatsapp" data-producto="' + escapeHtml(nombre) + '">Encargar por WhatsApp</button>';
    if (mailOk) acciones += '<button class="btn-fantasma mini" data-pedido="correo" data-producto="' + escapeHtml(nombre) + '">Encargar por correo</button>';
    if (!acciones) acciones = '<div style="margin-top:6px">' + phBlock("Contacto por configurar", "edita contenido/contacto/telefono.txt o contacto/mail.txt", "correo") + "</div>";
    return '<article class="prod">' + foto +
      '<div class="prod-cuerpo">' +
      '<h3 class="prod-nombre">' + escapeHtml(nombre) + "</h3>" +
      (d.precio ? '<div class="prod-precio">' + escapeHtml(d.precio) + "</div>" : "") +
      (d.desc.length ? '<div class="prod-desc">' + renderTxt(d.desc.join("\n")) + "</div>" : "") +
      '<div class="prod-acciones">' + acciones + "</div>" +
      "</div></article>";
  }

  function bodyTienda(node) {
    let html = txtSection(node, "La tienda");
    html += '<div class="sec"><div class="sec-title">' + icon("tienda") + "En venta</div>";
    const prods = productosTienda();
    if (prods.length) {
      html += '<div class="shop">' + prods.map(tarjetaProducto).join("") + "</div>";
    } else {
      html += phBlock("El escaparate está vacío", "crea contenido/tienda/mi-producto/ con producto.txt y fotos/ — hay una plantilla en _modelo-producto", "tienda");
    }
    html += "</div>";
    return html;
  }

  function enviarPedido(canal, producto) {
    const texto = "Hola NegraLuna 🌙\nQuiero encargar: " + producto + "\n¿Me cuentan cómo coordinamos el pago y la entrega?";
    if (canal === "whatsapp") {
      const digits = ((firstMeaningfulLine("contacto/telefono.txt") || "").replace(/\D/g, ""));
      if (digits.length < 9) { showToast("El teléfono aún no está configurado."); return; }
      window.open("https://wa.me/" + digits + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
      showToast("Abriendo WhatsApp con tu encargo listo.");
    } else {
      const mail = firstMeaningfulLine("contacto/mail.txt") || MAIL_DEFAULT;
      window.location.href = "mailto:" + mail + "?subject=" + encodeURIComponent("Encargo: " + producto) + "&body=" + encodeURIComponent(texto);
      showToast("Abriendo tu correo con el encargo listo.");
    }
  }

  /* ---------- DONACIONES: cuenta + historial de donadores ----------
     El agradecimiento vive en contenido/donar/donar.txt, los datos
     de transferencia en cuenta.txt (cada línea "Etiqueta: valor" con
     botón de copiar) y el historial en donadores.txt: una línea por
     donador con "Nombre | $monto" — la web los ordena sola, del más
     alto al más bajo, y pone el sello "Destacado en redes" al podio. */

  function parseDonadores(raw) {
    const out = [];
    (raw || "").split(/\r?\n/).forEach(l => {
      const t = l.trim();
      if (!t || t.startsWith("#")) return;
      const parts = t.split("|");
      if (parts.length < 2) return;
      const nombre = parts[0].trim();
      const num = parseInt(parts[1].replace(/[^\d]/g, ""), 10);
      if (!nombre || !num) return;
      out.push({ nombre, num });
    });
    return out.sort((a, b) => b.num - a.num);
  }

  function montoCLP(n) {
    return "$" + n.toLocaleString("es-CL");
  }

  function canalesDisponibles() {
    const fonoRaw = firstMeaningfulLine("contacto/telefono.txt") || "";
    const mail = firstMeaningfulLine("contacto/mail.txt") || MAIL_DEFAULT;
    return {
      whatsapp: fonoRaw.replace(/\D/g, "").length >= 9 && fonoRaw.indexOf("XXXX") === -1,
      correo: mail.indexOf("XXXX") === -1
    };
  }

  function abrirCanal(canal, texto, asunto, okMsg) {
    if (canal === "whatsapp") {
      const digits = ((firstMeaningfulLine("contacto/telefono.txt") || "").replace(/\D/g, ""));
      if (digits.length < 9) { showToast("El teléfono aún no está configurado."); return; }
      window.open("https://wa.me/" + digits + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
      showToast(okMsg);
    } else {
      const mail = firstMeaningfulLine("contacto/mail.txt") || MAIL_DEFAULT;
      window.location.href = "mailto:" + mail + "?subject=" + encodeURIComponent(asunto) + "&body=" + encodeURIComponent(texto);
      showToast(okMsg);
    }
  }

  function bodyDonar(node) {
    let html = txtSection(node, "Gracias por ayudarnos");

    /* cuenta para transferir: cada línea "Etiqueta: valor" con copiar */
    const rawCuenta = Contenido.text("donar/cuenta.txt");
    html += '<div class="sec"><div class="sec-title">' + icon("corazon") + "Cuenta para donar</div>";
    if (rawCuenta) {
      const filas = rawCuenta.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith("#"));
      html += '<div class="cuenta">';
      filas.forEach(f => {
        const m = f.match(/^([^:]{1,30})[:]\s*(.+)$/);
        const k = m ? m[1] : "Dato";
        const v = m ? m[2] : f;
        html += '<div class="cta-fila"><span class="cta-k">' + escapeHtml(k) + "</span>" +
          '<span class="cta-v">' + escapeHtml(v) + "</span>" +
          '<button class="cta-copy" data-copy="' + escapeHtml(v) + '">Copiar</button></div>';
      });
      html += "</div>";
    } else {
      html += phBlock("Los datos de tu cuenta van aquí", "escríbelos en contenido/donar/cuenta.txt", "corazon");
    }
    const canales = canalesDisponibles();
    html += '<div style="display:flex;gap:10px;margin-top:14px;flex-wrap:wrap">';
    if (canales.whatsapp) html += '<button class="btn-tejido" data-donar="whatsapp">Quiero donar · WhatsApp</button>';
    if (canales.correo) html += '<button class="btn-fantasma" data-donar="correo">Quiero donar · correo</button>';
    html += "</div></div>";

    /* historial: del aporte más alto al más bajo */
    const donadores = parseDonadores(Contenido.text("donar/donadores.txt"));
    html += '<div class="sec"><div class="sec-title">' + icon("estrella") + "Historial de donadores</div>";
    html += '<p class="don-nota">Gracias a tu donación podemos seguir trabajando en nuestra música. A quienes aportan los <b>destacamos en nuestras redes sociales</b>: su nombre queda en este historial y su apoyo se cuenta en cada publicacion.</p>';
    if (donadores.length) {
      html += '<div class="don-lis">';
      donadores.forEach((d, i) => {
        const podio = i === 0 ? " oro" : i === 1 ? " plata" : i === 2 ? " bronce" : "";
        html += '<div class="don-item' + podio + '">' +
          '<span class="don-rank">' + (i + 1) + "</span>" +
          '<span class="don-nombre">' + escapeHtml(d.nombre) +
          (i < 3 ? '<span class="don-badge">' + icon("estrella") + "Destacado en redes</span>" : "") + "</span>" +
          '<span class="don-monto">' + montoCLP(d.num) + "</span></div>";
      });
      html += "</div>";
      html += '<p class="jl-pista">Ordenado de la donación más alta a la menor · agrega donadores en contenido/donar/donadores.txt: una línea, "Nombre | $monto".</p>';
    } else {
      html += phBlock("El historial espera su primer aporte", "agrega cada donador en contenido/donar/donadores.txt — una línea: Nombre | $monto", "estrella");
    }
    html += "</div>";
    return html;
  }

  function enviarDonacion(canal) {
    abrirCanal(canal,
      "Hola NegraLuna 🌙\nQuiero hacer una donación para apoyar la música del estudio. ¿Me pasan los datos para transferir?",
      "Quiero donar · NegraLuna",
      canal === "whatsapp" ? "Abriendo WhatsApp para coordinar tu donación." : "Abriendo tu correo para coordinar tu donación.");
  }

  /* ---------- REDES SOCIALES (nodo Contacto ▸ Redes) ----------
     A la cabeza, el nombre del proyecto; debajo, un enlace por cada
     línea de contenido/contacto/redes.txt con formato "Nombre | URL". */

  function parseRedes(raw) {
    const MAPA = [
      ["instagram", "foto"], ["youtube", "video"], ["spotify", "nota"],
      ["tiktok", "video"], ["facebook", "charla"], ["twitter", "charla"],
      ["x.com", "charla"], ["soundcloud", "parlante"], ["bandcamp", "disco"],
      ["whatsapp", "telefono"]
    ];
    const out = [];
    (raw || "").split(/\r?\n/).forEach(l => {
      const t = l.trim().replace(/^[-·]\s*/, "");
      if (!t || t.startsWith("#")) return;
      const m = t.match(/https?:\/\/\S+/);
      if (!m) return;
      const url = m[0];
      const nombre = t.slice(0, m.index).replace(/[|:·–—]\s*$/, "").trim() ||
        url.replace(/^https?:\/\/(www\.)?/, "").split("/")[0];
      const low = (nombre + " " + url).toLowerCase();
      let ic = "red";
      MAPA.some(p => { if (low.indexOf(p[0]) !== -1) { ic = p[1]; return true; } return false; });
      out.push({ nombre, url, icon: ic });
    });
    return out;
  }

  function bodyRedes(node) {
    let html = '<div class="sec redes-cab">' +
      '<img class="redes-logo" src="assets/logos/homestudio.png" alt="NegraLuna HomeStudio">' +
      '<div class="redes-nombre">NegraLuna <span>HomeStudio</span></div>' +
      '<div class="redes-sub">HomeStudio · Pinto, Ñuble, Chile</div>' +
      "</div>";
    const redes = parseRedes(Contenido.text(node.txt));
    html += '<div class="sec"><div class="sec-title">' + icon("red") + "Síguenos en nuestras redes</div>";
    if (redes.length) {
      html += '<div class="redes-lis">';
      redes.forEach(r => {
        html += '<a class="red-item" href="' + escapeHtml(r.url) + '" target="_blank" rel="noopener">' +
          '<span class="red-ic">' + icon(r.icon) + "</span>" +
          '<span class="red-info"><span class="red-nombre">' + escapeHtml(r.nombre) + "</span>" +
          '<span class="red-url">' + escapeHtml(r.url.replace(/^https?:\/\/(www\.)?/, "")) + "</span></span>" +
          icon("paloma") + "</a>";
      });
      html += "</div>";
      html += '<p class="jl-pista">Para cambiar o agregar redes, edita contenido/' + node.txt + " — una línea por red: Nombre | https://…</p>";
    } else {
      html += phBlock("Tus redes aparecen aquí", "escribe una línea por red en contenido/" + node.txt + " — formato: Nombre | https://…", "red");
    }
    html += "</div>";
    return html;
  }

  /* ---------- COMENTARIOS POR SECCIÓN (videos / música / podcast) ----------
     Cada hilo vive en su propio contexto (proyectos/negra-luna/musica,
     podcast/orbita-lunar/video, …). Si hay servidor, los comentarios se
     guardan por API (comentarios-estado.json ▸ por_contexto); si no, el
     comentario viaja por WhatsApp o correo al estudio, igual que el muro. */

  function seccionComentarios(contexto, titulo) {
    contexto = (contexto || "muro").toLowerCase().replace(/[^a-z0-9_\-/]/g, "");
    if (!contexto) contexto = "muro";
    const canales = canalesDisponibles();
    const formId = "nl-com-" + contexto.replace(/[^a-z0-9]/g, "");
    let html = '<div class="sec"><div class="sec-title">' + icon("charla") + (titulo || "Comentarios") + "</div>";
    html += '<form class="form nl-com-ctx" id="' + formId + '" data-ctx="' + escapeHtml(contexto) + '">' +
      "<div><label for='" + formId + "-n'>Tu nombre</label><input id='" + formId + "-n' maxlength='40' autocomplete='name' placeholder='¿Cómo te llamas?'></div>" +
      "<div><label for='" + formId + "-m'>Tu comentario</label><textarea id='" + formId + "-m' maxlength='600' placeholder='Cuéntanos qué te parece…'></textarea></div>" +
      '<div class="nl-com-botones">' +
      '<button class="btn-tejido" type="button" data-comentar-ctx="publicar">Publicar</button>';
    if (canales.whatsapp) html += '<button class="btn-fantasma" type="button" data-comentar-ctx="whatsapp" style="margin-left:8px">Por WhatsApp</button>';
    if (canales.correo) html += '<button class="btn-fantasma" type="button" data-comentar-ctx="correo" style="margin-left:8px">Por correo</button>';
    html += '</div></form>';
    html += '<div class="muro-ctx" data-ctx="' + escapeHtml(contexto) + '"><div class="muro-carga">Tejiendo los comentarios…</div></div>';
    html += '<p class="jl-pista">El estudio lee todos los comentarios; puede destacar los mejores en sus redes.</p></div>';
    return html;
  }

  async function cargarComentariosCtx(contexto) {
    const cajas = document.querySelectorAll('.muro-ctx[data-ctx="' + contexto + '"]');
    if (!cajas.length) return;
    let apiComs = [];
    try {
      const r = await fetch("/api/comentarios?context=" + encodeURIComponent(contexto), { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        if (j && j.ok && Array.isArray(j.comentarios)) { apiComs = j.comentarios; }
      }
    } catch (e) { /* sin API: el muro queda vacío hasta que alguien comente */ }
    cajas.forEach(caja => {
      if (!caja) return;
      const delMuro = apiComs.slice().reverse().map(c => Object.assign({}, c, { fecha: fechaCorta(c.fecha) || "" }));
      if (delMuro.length) {
        caja.innerHTML = '<div class="muro">' + delMuro.map(tarjetaComentario).join("") + "</div>";
      } else {
        caja.innerHTML = phBlock("Sé el primero en comentar", "deja tu palabra en el formulario de arriba", "charla");
      }
    });
  }

  async function enviarComentarioCtx(accion, contexto, form) {
    if (!form) return;
    // el primer <input> del formulario es el nombre; el <textarea> es el comentario.
    // (No usar input[type=text]: los <input> sin atributo type no matchean ese
    //  selector aunque su .type sea "text" por defecto — y rompería en silencio.)
    const nombreEl = form.querySelector("input");
    const textoEl = form.querySelector("textarea");
    if (!nombreEl || !textoEl) { showToast("El formulario de comentario no está completo."); return; }
    const nombre = nombreEl.value.trim();
    const texto = textoEl.value.trim();
    if (!texto) { showToast("Escribe tu comentario primero: ¿qué quieres decir?"); return; }
    const quien = nombre || "Anónimo";

    if (accion === "publicar") {
      try {
        const r = await fetch("/api/comentarios?context=" + encodeURIComponent(contexto), {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: quien, texto, context: contexto })
        });
        const j = await r.json();
        if (j && j.ok) {
          form.reset();
          showToast("¡Comentario publicado!");
          cargarComentariosCtx(contexto);
          return;
        }
        throw new Error("respuesta no ok");
      } catch (e) {
        showToast("Aquí no hay servidor de comentarios: usa WhatsApp o correo.");
        return;
      }
    }
    abrirCanal(accion,
      "Hola NegraLuna 🌙\nMi comentario para " + contexto + ":\n\n" + texto + "\n\n— " + quien,
      "Comentario · " + contexto + " · NegraLuna",
      accion === "whatsapp" ? "Abriendo WhatsApp con tu comentario listo." : "Abriendo tu correo con el comentario listo.");
    form.reset();
  }

  /* ---------- BLOG: el muro de apreciaciones y comentarios ----------
     Con servidor (iniciar-servidor o el preview), "Publicar en el
     muro" guarda por la API /api/comentarios — la misma idea del
     contador de visitas — y el comentario aparece al instante.
     Sin servidor, el comentario viaja por WhatsApp o correo, igual
     que los encargos de la tienda, y el estudio lo agrega al muro
     sembrándolo en contenido/blog/comentarios.txt. */

  function parseComentariosTxt(raw) {
    const out = [];
    let bloque = [];
    const flush = () => {
      const lines = bloque.map(l => l.replace(/\s+$/, "")).filter(l => l.trim());
      bloque = [];
      if (!lines.length) return;
      const primera = lines[0].split("|");
      out.push({
        nombre: (primera[0] || "").trim() || "Anónimo",
        fecha: (primera[1] || "").trim(),
        texto: lines.slice(1).join("\n").trim()
      });
    };
    (raw || "").split(/\r?\n/).forEach(l => {
      if (l.trim().startsWith("#")) return;
      if (!l.trim()) { flush(); return; }
      bloque.push(l);
    });
    flush();
    return out.filter(c => c.texto);
  }

  function fechaCorta(iso) {
    try {
      return new Date(iso).toLocaleDateString("es-CL", { day: "numeric", month: "short", year: "numeric" });
    } catch (e) { return ""; }
  }

  function tarjetaComentario(c) {
    const inicial = (c.nombre || "?").trim().charAt(0).toUpperCase();
    return '<article class="cmt">' +
      '<div class="cmt-avatar" aria-hidden="true">' + escapeHtml(inicial) + "</div>" +
      '<div class="cmt-cuerpo">' +
      '<div class="cmt-cab"><span class="cmt-nombre">' + escapeHtml(c.nombre || "Anónimo") + "</span>" +
      (c.fecha ? '<span class="cmt-fecha">' + escapeHtml(c.fecha) + "</span>" : "") + "</div>" +
      '<p class="cmt-texto">' + escapeHtml(c.texto || "").replace(/\n/g, "<br>") + "</p>" +
      "</div></article>";
  }

  async function cargarMuro() {
    const caja = document.getElementById("muro");
    if (!caja) return;
    let apiComs = [];
    try {
      const r = await fetch("/api/comentarios", { cache: "no-store" });
      if (r.ok) {
        const j = await r.json();
        if (j && j.ok && Array.isArray(j.comentarios)) { apiComs = j.comentarios; hayApi = true; }
      }
    } catch (e) { /* sin API: muro solo con los sembrados */ }
    if (!document.getElementById("muro")) return;   // el panel se cerró mientras
    const sembrados = parseComentariosTxt(Contenido.text("blog/comentarios.txt"));
    const delMuro = apiComs.slice().reverse().map(c => Object.assign({}, c, { fecha: fechaCorta(c.fecha) || "" }));
    const todos = sembrados.concat(delMuro);
    if (todos.length) {
      caja.innerHTML = '<div class="muro">' + todos.map(tarjetaComentario).join("") + "</div>";
    } else {
      caja.innerHTML = phBlock("El muro espera su primera palabra", "deja tu apreciación en el formulario de arriba", "charla");
    }
  }

  function bodyBlog(node) {
    let html = txtSection(node, "Este espacio es tuyo");
    const canales = canalesDisponibles();
    html += '<div class="sec"><div class="sec-title">' + icon("pluma") + "Deja tu comentario</div>" +
      '<form class="form" id="nl-comentario">' +
      "<div><label for='c-nombre'>Tu nombre</label><input id='c-nombre' maxlength='40' autocomplete='name' placeholder='¿Cómo te llamas?'></div>" +
      "<div><label for='c-msg'>Tu apreciación</label><textarea id='c-msg' maxlength='600' placeholder='¿Qué te parece la música, el estudio, el juego de Discotopía…?'></textarea></div>" +
      '<button class="btn-tejido" type="button" data-comentar="publicar">Publicar en el muro</button>';
    if (canales.whatsapp) html += '<button class="btn-fantasma" type="button" data-comentar="whatsapp" style="margin-top:10px">Enviar por WhatsApp</button>';
    if (canales.correo) html += '<button class="btn-fantasma" type="button" data-comentar="correo" style="margin-top:10px">Enviar por correo</button>';
    html += "</form></div>";
    html += '<div class="sec"><div class="sec-title">' + icon("charla") + "El muro</div>" +
      '<div id="muro"><div class="muro-carga">Tejiendo los comentarios…</div></div>' +
      '<p class="jl-pista">El estudio lee todos los comentarios y puede destacar los mejores en nuestras redes sociales.</p></div>';
    return html;
  }

  async function enviarComentario(accion) {
    const form = document.getElementById("nl-comentario");
    if (!form) return;
    const nombre = form.querySelector("#c-nombre").value.trim();
    const texto = form.querySelector("#c-msg").value.trim();
    if (!texto) { showToast("Escribe tu apreciación primero: ¿qué quieres contar?"); return; }
    const quien = nombre || "Anónimo";

    if (accion === "publicar") {
      try {
        const r = await fetch("/api/comentarios", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ nombre: quien, texto })
        });
        const j = await r.json();
        if (j && j.ok) {
          form.reset();
          showToast("¡Listo! Tu comentario ya está en el muro.");
          cargarMuro();
          return;
        }
        throw new Error("respuesta no ok");
      } catch (e) {
        showToast("Aquí no hay servidor de comentarios: usa los botones de WhatsApp o correo.");
        return;
      }
    }
    abrirCanal(accion,
      "Hola NegraLuna 🌙\nMi comentario para el muro:\n\n" + texto + "\n\n— " + quien,
      "Comentario para el muro · NegraLuna",
      accion === "whatsapp" ? "Abriendo WhatsApp con tu comentario listo." : "Abriendo tu correo con el comentario listo.");
    form.reset();
  }

  /* ---------- apertura / cierre ---------- */

  function open(node) {
    currentNode = node;
    galFlotanteOcultar();
    document.getElementById("p-icon").innerHTML = node.type === "center" ? icon("luna") : icon(node.icon);
    document.getElementById("p-title").innerHTML = escapeHtml(node.label) + (node.sub ? '<span class="p-sub">' + escapeHtml(node.sub) + "</span>" : "");
    document.getElementById("p-path").textContent = chain(node).map(n => n.label).join(" ▸ ");

    const body = document.getElementById("p-body");
    // los videos del panel anterior se apagan al abrir otro nodo (y la radio vuelve)
    body.querySelectorAll("video").forEach(v => { try { v.pause(); } catch (e) {} });
    let html = "";
    switch (node.kind) {
      case "texto": html = bodyTexto(node); break;
      case "servicio": html = bodyServicio(node); break;
      case "galeria": html = bodyGaleria(node); break;
      case "videos": html = bodyVideos(node); break;
      case "musica": html = bodyMusica(node); break;
      case "podcast-audio": html = bodyPodcastAudio(node); break;
      case "podcast-video": html = bodyPodcastVideo(node); break;
      case "juego": html = bodyJuego(node); break;
      case "tienda": html = bodyTienda(node); break;
      case "donar": html = bodyDonar(node); break;
      case "redes": html = bodyRedes(node); break;
      case "blog": html = bodyBlog(node); break;
      case "mapa": html = bodyMapa(node); break;
      case "mail": html = bodyMail(node); break;
      case "telefono": html = bodyTelefono(node); break;
      case "formulario": html = bodyFormulario(node); break;
      default: html = txtSection(node);
    }
    body.innerHTML = html;
    body.scrollTop = 0;
    // los videos de un nodo le ceden los parlantes a la radio y la
    // despiertan al terminar (si el interruptor del visitante sigue en ON)
    body.querySelectorAll("video").forEach(v => {
      v.addEventListener("play", () => RadioNegraLuna.ceder());
      v.addEventListener("pause", () => RadioNegraLuna.reanudar());
      v.addEventListener("ended", () => RadioNegraLuna.reanudar());
    });
    // los iframes de YouTube también le ceden los parlantes a la radio
    // (vía YouTube IFrame Player API — el script cargado en index.html)
    body.querySelectorAll("iframe").forEach(ifr => {
      if (ifr.src && ifr.src.indexOf("youtube") !== -1) {
        YouTubeRadio.attach(ifr);
      }
    });
    if (node.kind === "blog") cargarMuro();
    // carga comentarios contextuales (videos / música / podcast) — un hilo por sección
    body.querySelectorAll(".muro-ctx[data-ctx]").forEach(caja => {
      cargarComentariosCtx(caja.getAttribute("data-ctx"));
    });

    document.getElementById("panel").classList.add("on");
    document.getElementById("panel-backdrop").classList.add("on");
  }

  function close() {
    document.getElementById("panel").classList.remove("on");
    document.getElementById("panel-backdrop").classList.remove("on");
    // cerrar el panel también apaga los videos del nodo (la radio vuelve sola)
    document.querySelectorAll("#p-body video").forEach(v => { try { v.pause(); } catch (e) {} });
    // y los iframes de YouTube: para todos los videos y suelta la radio
    if (window.YouTubeRadio) YouTubeRadio.clear();
    stopAudio();
    if (window.NodePlayer) NodePlayer.stop();
    galFlotanteOcultar();
    currentNode = null;
  }

  function isOpen() {
    return document.getElementById("panel").classList.contains("on");
  }

  /* ---------- audio ---------- */

  let currentAudio = null;
  function stopAudio(reanudarMusica) {
    if (currentAudio) { currentAudio.pause(); currentAudio = null; }
    document.querySelectorAll(".t-btn").forEach(b => {
      b.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><path d="M8 5.5l11 6.5-11 6.5Z"/></svg>';
    });
    if (reanudarMusica !== false) RadioNegraLuna.reanudar();
  }

  /* ---------- eventos globales del panel ---------- */

  function bind() {
    document.getElementById("p-close").addEventListener("click", close);
    // backdrop: ya no llama a close() — main.js registra goBack() en el backdrop
    // para que tocar afuera del panel NO solo cierre, sino que dé un paso atrás
    // en la cadena de nodos (cierra panel + enfoca al padre del nodo hoja).
    window.addEventListener("nl:close-panel", close);
    document.addEventListener("keydown", e => { if (e.key === "Escape" && isOpen() && !JuegoFloat.abierta()) close(); });

    // delegación: placeholders falsos, audio, copiar, formulario
    const body = document.getElementById("p-body");
    // galería: al pasar el cursor (o enfocar/tocar) la foto se ve en grande a la derecha
    body.addEventListener("mouseover", e => {
      const th = e.target.closest(".gal-thumb");
      if (th && body.contains(th)) galVer(th);
    });
    body.addEventListener("focusin", e => {
      const th = e.target.closest(".gal-thumb");
      if (th && body.contains(th)) galVer(th);
    });
    // al salir de la galería, la vista grande se retira
    body.addEventListener("mouseout", e => {
      const gal = e.target.closest(".gal");
      if (gal && !(e.relatedTarget && gal.contains(e.relatedTarget))) galFlotanteOcultar();
    });

    body.addEventListener("click", e => {
      const th = e.target.closest(".gal-thumb");
      if (th) { galVer(th); return; }
      const jugar = e.target.closest("[data-jugar]");
      if (jugar) { JuegoFloat.abrir("juego-discotopia/"); return; }
      const ph = e.target.closest(".ph[data-fake]");
      if (ph) {
        ph.classList.remove("wiggle"); void ph.offsetWidth; ph.classList.add("wiggle");
        showToast(FAKE_MSG, 3600);
        return;
      }
      const btn = e.target.closest(".t-btn[data-track]");
      if (btn) {
        // botón de pista en el reproductor de un proyecto / podcast
        const lista = btn.closest(".musica-lista");
        if (lista) {
          const tracks = JSON.parse(lista.getAttribute("data-tracks") || "[]");
          const artist = lista.getAttribute("data-artist") || "NegraLuna";
          const idx = parseInt(btn.getAttribute("data-track"), 10);
          if (tracks.length) {
            // si es la misma pista reproduciéndose: pausar/despausar
            if (NodePlayer.isPlaying() && NodePlayer.currentPos() === idx) {
              NodePlayer.togglePlay();
            } else {
              NodePlayer.open(tracks, idx, artist);
            }
            return;
          }
        }
        // fallback para .t-btn antiguos con <audio> interno
        const audio = btn.parentElement.querySelector("audio");
        if (audio) {
          if (currentAudio && currentAudio !== audio) stopAudio(false);
          if (!audio.paused) { stopAudio(); return; }
          stopAudio(false);
          RadioNegraLuna.ceder();
          currentAudio = audio;
          audio.play().catch(() => showToast("El navegador no pudo reproducir el audio."));
          btn.innerHTML = '<svg viewBox="0 0 24 24" fill="currentColor"><rect x="7" y="5.5" width="3.6" height="13" rx="1"/><rect x="13.4" y="5.5" width="3.6" height="13" rx="1"/></svg>';
          audio.addEventListener("ended", () => { if (currentAudio === audio) stopAudio(); }, { once: true });
        }
        return;
      }
      const copyBtn = e.target.closest("[data-copy]");
      if (copyBtn) {
        const txt = copyBtn.dataset.copy;
        (navigator.clipboard ? navigator.clipboard.writeText(txt) : Promise.reject())
          .then(() => showToast("Copiado: " + txt))
          .catch(() => showToast(txt));
        return;
      }
      const pedido = e.target.closest("[data-pedido]");
      if (pedido) { enviarPedido(pedido.dataset.pedido, pedido.dataset.producto); return; }
      const donar = e.target.closest("[data-donar]");
      if (donar) { enviarDonacion(donar.dataset.donar); return; }
      const comentar = e.target.closest("[data-comentar]");
      if (comentar) { enviarComentario(comentar.dataset.comentar); return; }
      const comentarCtx = e.target.closest("[data-comentar-ctx]");
      if (comentarCtx) {
        const form = comentarCtx.closest("form.nl-com-ctx");
        const ctx = form ? form.getAttribute("data-ctx") : "muro";
        enviarComentarioCtx(comentarCtx.dataset.comentarCtx, ctx, form);
        return;
      }
    });

    // formulario: botones de canal real + Enter en el formulario
    body.addEventListener("click", e => {
      const canalBtn = e.target.closest("[data-canal]");
      if (canalBtn) { enviarFormulario(canalBtn.dataset.canal); return; }
    });
    body.addEventListener("submit", e => {
      if (e.target.id === "nl-form") {
        e.preventDefault();
        const prefiereWa = document.querySelector('#nl-form [data-canal="whatsapp"]');
        enviarFormulario(prefiereWa ? "whatsapp" : "correo");
      }
      if (e.target.id === "nl-comentario") {
        e.preventDefault();
        enviarComentario("publicar");
      }
      if (e.target.classList.contains("nl-com-ctx")) {
        e.preventDefault();
        const ctx = e.target.getAttribute("data-ctx") || "muro";
        enviarComentarioCtx("publicar", ctx, e.target);
      }
    });
  }

  return { open, close, isOpen, bind, node: () => currentNode };
})();
