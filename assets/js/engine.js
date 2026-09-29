/* ============================================================
   NEGRALUNA · Motor del mapa vivo
   Nodos DOM + hilos SVG, pan/zoom/pinza, cámara animada,
   expansión tipo acordeón, flotación y pulsos de invitación.
   ============================================================ */

"use strict";

const Engine = (() => {

  let world, edgesSvg;
  const nodesIndex = {};   // id -> node
  let allNodes = [];
  let cam = { x: 0, y: 0, s: 1 };
  let camAnim = null;
  const pointers = new Map();
  let pinch = null;
  let dragMoved = false;
  let onNodeActivate = null;
  let onNodeBack = null;
  let vw = 0, vh = 0;
  let capas = [];   // planos de fondo con parallax
  let motes = [];   // polvo del primer plano

  /* --- órbita viva del mapa ---
     TODOS los nodos orbitan siempre; el único quieto es el primario (inicio).
     El nodo que visitas queda centrado porque la CÁMARA lo persigue, no
     porque se congele. */
  let followNode = null;   // nodo que la cámara mantiene centrado (sigue orbitando)
  let followOffY = 0;      // desfase vertical del encuadre (los anillos dejan aire arriba)
  let lastT = 0;
  const CON_TRANSLATE = typeof CSS !== "undefined" && CSS.supports && CSS.supports("translate", "1px 1px");

  /* --- azar determinista (mismo mapa en cada visita) --- */
  let seed = 20260911;
  function rnd() { seed = (seed * 16807) % 2147483647; return (seed - 1) / 2147483646; }

  function el(tag, cls, parent) {
    const n = document.createElement(tag);
    if (cls) n.className = cls;
    if (parent) parent.appendChild(n);
    return n;
  }

  /* ================= LAYOUT ================= */

  function layoutTree(root) {
    root.x = 0; root.y = 0; root.depth = 0; root.parent = null;
    const mains = root.children || [];
    mains.forEach((m, i) => {
      const ang = (-90 + (360 / mains.length) * i) * Math.PI / 180;
      m.x = Math.cos(ang) * 350;
      m.y = Math.sin(ang) * 350;
      m.depth = 1; m.parent = root;
      layoutFan(m, ang);
    });
  }

  function layoutFan(node, outAng) {
    const kids = node.children || [];
    if (!kids.length) return;
    const n = kids.length;
    const baseR = node.depth === 1 ? 315 : node.depth === 2 ? 230 : 165;
    // reparto PROPORCIONAL: los hermanos ocupan todo el círculo a intervalos
    // iguales (2π/n) y todos al mismo radio — el anillo queda parejo y girando
    // mantiene esa distancia exacta para siempre
    kids.forEach((k, i) => {
      const ang = outAng + (Math.PI * 2 * i) / n;
      k.x = node.x + baseR * Math.cos(ang);
      k.y = node.y + baseR * Math.sin(ang);
      k.depth = node.depth + 1; k.parent = node;
      layoutFan(k, ang);
    });
  }

  /* ================= ÓRBITA (mapa vivo) =================
     Cada hijo gira alrededor de su padre; los hermanos comparten ritmo
     (el abanico gira rígido, sin chocarse) y cada nivel gira al contrario:
     un astrolario tejido, lento pero evidente. */

  /* hilo entre dos nodos: se recalcula en cada frame mientras orbitan */
  function edgeD(p, n) {
    const dx = n.x - p.x, dy = n.y - p.y;
    const len = Math.hypot(dx, dy) || 1;
    const nx = -dy / len, ny = dx / len;
    const bow = len * 0.14 * n.bowSign;
    return "M" + p.x.toFixed(1) + " " + p.y.toFixed(1) +
      " C " + (p.x + dx * 0.35 + nx * bow).toFixed(1) + " " + (p.y + dy * 0.35 + ny * bow).toFixed(1) +
      ", " + (p.x + dx * 0.65 + nx * bow).toFixed(1) + " " + (p.y + dy * 0.65 + ny * bow).toFixed(1) +
      ", " + n.x.toFixed(1) + " " + n.y.toFixed(1);
  }

  /* ritmo de un anillo: segundos por vuelta según profundidad, dirección alternada.
     Lento (nunca menos de media vuelta por minuto) pero EVIDENTE: en pantalla
     los nodos avanzan su propio diámetro cada ~2 segundos. */
  function ritmoAnillo(p) {
    const periodo = p.depth === 0 ? 55 : p.depth === 1 ? 38 : 30;
    const dir = p.depth % 2 === 0 ? 1 : -1;
    const aire = 1 + (rnd() - 0.5) * 0.24;   // cada anillo respira a su aire
    return (Math.PI * 2 / periodo) * dir * aire;
  }

  function ponerPos(elNode, x, y) {
    if (CON_TRANSLATE) elNode.style.translate = x.toFixed(1) + "px " + y.toFixed(1) + "px";
    else { elNode.style.left = x.toFixed(1) + "px"; elNode.style.top = y.toFixed(1) + "px"; }
  }

  function pasoOrbita(dt) {
    for (const n of allNodes) {
      const p = n.parent;
      if (!p) continue;                     // solo el primario (sin padre) queda quieto
      n.orbAng += n.orbW * dt;
      n.x = p.x + Math.cos(n.orbAng) * n.orbR;
      n.y = p.y + Math.sin(n.orbAng) * n.orbR;
      if (!n._shown) continue;              // oculto: sigue su órbita, sin pintar
      ponerPos(n.el, n.x, n.y);
      if (n._edgeOn) {
        const d = edgeD(p, n);
        n.edgeEl.setAttribute("d", d);
        n.flowEl.setAttribute("d", d);
      }
    }
  }

  function startOrbita() {
    // la órbita SIEMPRE corre: es el corazón pedido del mapa
    // (única excepción real: pestaña oculta, el navegador pausa solo)
    lastT = performance.now();
    const step = now => {
      const dt = Math.min(0.05, (now - lastT) / 1000);
      lastT = now;
      pasoOrbita(dt);
      // seguimiento de cámara: el nodo visitado queda centrado MIENTRAS sigue orbitando
      if (followNode && !camAnim && !pinch) {
        if (!followNode._shown) { followNode = null; }   // lo colapsaron: soltar
        else {
          const t = centroDe(followNode);
          cam.x = t[0]; cam.y = t[1];
          applyCam();
        }
      }
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  /* ================= CONSTRUCCIÓN DOM ================= */

  function buildNode(node) {
    nodesIndex[node.id] = node;
    allNodes.push(node);

    // las hojas heredan la carpeta de su banda: las que tienen `dir`
    // apuntan directo a la banda (banda/fotos), las demás a banda/hoja
    if (!node.path && node.parent && node.parent.path) {
      node.path = node.dir ? node.parent.path : node.parent.path + "/" + node.id;
    }

    const elNode = el("div", "node hidden d" + Math.min(node.depth, 3));
    if (node.type === "center") elNode.classList.add("center");
    if (node.leaf) elNode.classList.add("leaf");
    ponerPos(elNode, node.x, node.y);
    elNode.dataset.id = node.id;
    node._shown = false; node._edgeOn = false;

    const float = el("div", "node-float", elNode);
    float.style.setProperty("--fd", (5 + rnd() * 3.2).toFixed(2) + "s");
    float.style.setProperty("--fdel", (-rnd() * 6).toFixed(2) + "s");
    el("div", "node-shadow", float);   // ancla del nodo al plano del mapa

    const ball = el("div", "ball", float);
    if (node.type === "center") {
      el("div", "orbiter", ball);
      ball.insertAdjacentHTML("beforeend", ICONS.luna.replace("<svg ", '<svg class="moon" '));
    } else {
      ball.innerHTML = ICONS[node.icon] || ICONS.estrella;
    }
    // logo propio del nodo (si existe): círculo calzado justo con la bola
    if (node.logo) {
      const img = el("img", "logo-ball", ball);
      img.alt = node.label + " " + (node.sub || "");
      img.src = node.logo + "?_=v1";
      img.addEventListener("load", () => elNode.classList.add("has-logo"));
      img.addEventListener("error", () => img.remove());
    }

    const label = el("div", "label", float);
    label.innerHTML = escapeHtml(node.label) + (node.sub ? '<span class="sub">' + escapeHtml(node.sub) + "</span>" : "");

    node.el = elNode;

    // hilo hacia el padre (y órbita propia alrededor de él)
    if (node.parent) {
      const p = node.parent;
      const dx = node.x - p.x, dy = node.y - p.y;
      node.orbAng = Math.atan2(dy, dx);
      node.orbR = Math.hypot(dx, dy);
      if (p._ringW === undefined) p._ringW = ritmoAnillo(p);
      node.orbW = p._ringW;              // hermanos comparten ritmo: abanico rígido
      node.bowSign = rnd() > 0.5 ? 1 : -1;
      const d = edgeD(p, node);
      const path = document.createElementNS("http://www.w3.org/2000/svg", "path");
      path.setAttribute("d", d);
      path.setAttribute("class", "edge e" + Math.min(node.depth - 1, 2));
      edgesSvg.appendChild(path);
      const flow = document.createElementNS("http://www.w3.org/2000/svg", "path");
      flow.setAttribute("d", d);
      flow.setAttribute("class", "edge-flow");
      edgesSvg.appendChild(flow);
      node.edgeEl = path; node.flowEl = flow;
    }

    // eventos
    const stop = e => e.stopPropagation();
    elNode.addEventListener("pointerdown", stop);
    elNode.addEventListener("click", e => {
      e.stopPropagation();
      // nodo atenuado (fuera del sistema visitado) o ya enfocado: va atrás
      // (no se abre — solo devuelve a la cadena anterior de nodos).
      // El resto (lit, hijo del nodo enfocado) se activa normalmente.
      if (elNode.classList.contains("dim") || node === followNode) {
        if (onNodeBack) onNodeBack();
      } else if (onNodeActivate) {
        onNodeActivate(node);
      }
    });
    elNode.addEventListener("mouseenter", () => { if (node.edgeEl && !elNode.classList.contains("dim")) node.edgeEl.classList.add("hot"); });
    elNode.addEventListener("mouseleave", () => { if (node.edgeEl) node.edgeEl.classList.remove("hot"); });

    world.appendChild(elNode);

    (node.children || []).forEach(buildNode);
  }

  function escapeHtml(s) {
    return String(s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  }

  /* ================= VISIBILIDAD ================= */

  function showNode(node, i) {
    node._shown = true;
    node.el.classList.remove("hidden");
    if (node.edgeEl) { node.edgeEl.classList.add("on"); node.flowEl.classList.add("on"); node._edgeOn = true; }
    node.el.classList.remove("pop");
    void node.el.offsetWidth;
    node.el.style.animationDelay = (i * 55) + "ms";
    node.el.classList.add("pop");
  }

  function hideNode(node) {
    node._shown = false;
    node.el.classList.add("hidden");
    if (node.edgeEl) { node.edgeEl.classList.remove("on"); node.flowEl.classList.remove("on"); node._edgeOn = false; }
  }

  function hideSubtree(node) {
    (node.children || []).forEach(c => {
      if (c.expanded) hideSubtree(c);
      c.expanded = false;
      c.el.classList.remove("open");
      hideNode(c);
    });
  }

  function expand(node, opts) {
    opts = opts || {};
    if (!node.children || node.expanded) return;
    // acordeón: los hermanos expandidos se cierran (salvo vista general)
    if (!opts.force && node.parent) {
      node.parent.children.forEach(s => { if (s !== node && s.expanded) collapse(s); });
    }
    node.expanded = true;
    node.el.classList.remove("invite");
    node.el.classList.add("open");
    node.children.forEach((c, i) => showNode(c, i));
    if (!opts.silent) focusRing(node);   // la cámara lo centra y lo sigue; su anillo lo orbita
  }

  /* ================= FOCO LUMINOSO =================
     Al visitar un sistema (nodo + su anillo), los nodos que no están
     ejerciendo función en ese momento se atenúan: la vista se queda
     con lo que importa. Todo vuelve al volver a casa o explorar libre. */

  function litSet(focus) {
    const lit = new Set();
    if (!focus) return lit;
    lit.add(focus);
    if (focus.parent) lit.add(focus.parent);
    const ancla = (focus.children && focus.children.length) ? focus : focus.parent;
    (ancla && ancla.children || []).forEach(c => { if (c._shown) lit.add(c); });
    return lit;
  }

  function aplicarFoco(focus) {
    const lit = litSet(focus);
    for (const n of allNodes) {
      const d = !!focus && n._shown && !lit.has(n);
      n.el.classList.toggle("dim", d);
      if (n.edgeEl) n.edgeEl.classList.toggle("dim", d);
    }
  }

  function collapse(node) {
    if (!node.children) return;
    hideSubtree(node);
    node.expanded = false;
    node.el.classList.remove("open");
  }

  function toggle(node) {
    if (node.children) {
      if (node.expanded) { collapse(node); } else { expand(node); }
    } else if (onNodeActivate) {
      onNodeActivate(node);
    }
  }

  /* ================= CÁMARA ================= */

  function applyCam() {
    world.style.transform = "translate(" + cam.x + "px," + cam.y + "px) scale(" + cam.s + ")";
    aplicarProfundidad();
  }

  /* ================= PROFUNDIDAD (planos que viajan a distinta velocidad) ================= */

  function initProfundidad() {
    capas = [
      { id: "capa-nebulosa", f: 0.07, z: 0.22, tile: 1000 },
      { id: "capa-lejos",    f: 0.16, z: 0.32, tile: 190 },
      { id: "capa-medio",    f: 0.34, z: 0.45, tile: 260 },
      { id: "capa-cerca",    f: 0.55, z: 0.58, tile: 380 }
    ].map(c => Object.assign(c, { el: document.getElementById(c.id) })).filter(c => c.el);

    const cont = document.getElementById("polvo");
    if (cont) {
      for (let i = 0; i < 22; i++) {
        const m = el("span", "mote", cont);
        const dot = el("i", "", m);
        dot.style.setProperty("--ms", (2.5 + rnd() * 5).toFixed(1) + "px");
        dot.style.setProperty("--md", (12 + rnd() * 15).toFixed(1) + "s");
        dot.style.setProperty("--mdel", (-rnd() * 27).toFixed(1) + "s");
        dot.style.setProperty("--mo", (0.16 + rnd() * 0.26).toFixed(2));
        m._bx = rnd(); m._by = rnd();
        motes.push(m);
      }
    }
    aplicarProfundidad();
  }

  function aplicarProfundidad() {
    // planos lejanos: viajan MENOS que el mapa y se acercan/alejan suave con el zoom;
    // el módulo por período del mosaico los hace infinitos sin bordes
    for (const c of capas) {
      const s = Math.pow(cam.s, c.z);
      const period = c.tile * s;
      const tx = (cam.x * c.f) % period;
      const ty = (cam.y * c.f) % period;
      c.el.style.transform = "translate3d(" + tx.toFixed(2) + "px," + ty.toFixed(2) + "px,0) scale(" + s.toFixed(4) + ")";
    }
    // polvo delantero: viaja MÁS que el mapa, envuelto en toro (nunca se acaba)
    if (motes.length) {
      const w = window.innerWidth, h = window.innerHeight;
      const W = w * 1.6, H = h * 1.6, fx = 1.35;
      const ox = ((cam.x * fx) % W + W) % W;
      const oy = ((cam.y * fx) % H + H) % H;
      for (const m of motes) {
        const x = ((m._bx * W + ox) % W) - W / 2 + w / 2;
        const y = ((m._by * H + oy) % H) - H / 2 + h / 2;
        m.style.transform = "translate3d(" + x.toFixed(1) + "px," + y.toFixed(1) + "px,0)";
      }
    }
  }

  function easeInOutCubic(t) { return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }

  /* ancho del panel cuando está abierto: el centro se aparta para no quedar bajo él */
  function panelAbierto() {
    return document.getElementById("panel").classList.contains("on") ? Math.min(580, vw) : 0;
  }

  /* posición de cámara deseada AHORA para tener n centrado (se recalcula por frame:
   el nodo sigue orbitando mientras la cámara lo persigue) */
  function centroDe(n) {
    const cx = (vw - panelAbierto()) / 2;
    const cy = vh / 2 + followOffY;
    return [cx - n.x * cam.s, cy - n.y * cam.s];
  }

  function animateCamTo(tx, ty, ts, dur, fn) {
    const from = Object.assign({}, cam);
    const t0 = performance.now();
    const ms = dur || 680;
    if (camAnim) cancelAnimationFrame(camAnim);
    const step = now => {
      const k = Math.min(1, (now - t0) / ms);
      const e = easeInOutCubic(k);
      let ax = tx, ay = ty;
      if (fn) { const t = fn(); ax = t[0]; ay = t[1]; }   // el objetivo orbita: perseguirlo en vivo
      cam.x = from.x + (ax - from.x) * e;
      cam.y = from.y + (ay - from.y) * e;
      cam.s = from.s + (ts - from.s) * e;
      applyCam();
      if (k < 1) camAnim = requestAnimationFrame(step);
      else camAnim = null;
    };
    camAnim = requestAnimationFrame(step);
  }

  function focusFit(nodes, extraScale) {
    if (!nodes.length) return;
    heroCam = false;
    aplicarFoco(null);
    vw = window.innerWidth; vh = window.innerHeight;
    let x0 = 1e9, y0 = 1e9, x1 = -1e9, y1 = -1e9;
    nodes.forEach(n => {
      const pad = 90;
      x0 = Math.min(x0, n.x - pad); y0 = Math.min(y0, n.y - pad);
      x1 = Math.max(x1, n.x + pad); y1 = Math.max(y1, n.y + pad);
    });
    const bw = x1 - x0, bh = y1 - y0;
    const pw = panelAbierto();
    const availW = vw - pw, availH = vh - 90;
    let s = Math.min((availW * 0.92) / bw, (availH * 0.9) / bh, 1.28);
    s = Math.max(0.42, s) * (extraScale || 1);
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    const tx = (availW / 2) - cx * s;
    const ty = (availH / 2) + 30 - cy * s;
    animateCamTo(tx, ty, s);
  }

  function fitHome() {
    followNode = null;
    const root = nodesIndex["inicio"];
    focusFit([root].concat(root.children));
  }

  /* vista hero: el nodo central Y los hijos que lo orbitan (r=350) caben
     juntos en pantalla. Responsive: la escala se calcula con el círculo
     completo (centro + anillo), así se ve igual de bien en celular,
     tablet y PC — el nodo NegraLuna no se ve enorme, sino a escala con
     sus 8 nodos orbitando a su alrededor. */
  let heroCam = false;

  function focusHero(dur) {
    const root = nodesIndex["inicio"];
    vw = window.innerWidth; vh = window.innerHeight;
    heroCam = true;
    followOffY = 0;
    followNode = root;   // en casa la cámara sigue al primario (él no orbita: vista estable)
    aplicarFoco(null);   // en casa todo brilla

    // círculo de encuadre: radio de la órbita + bola + rótulo + aire
    const orbitR = 350;        // distancia del centro a cada hijo principal
    const ballR = 60;            // radio aproximado de la bola del hijo (depth 1)
    const labelR = 40;           // alto + ancho extra del rótulo
    const totalR = orbitR + ballR + labelR;  // ≈ 450
    // disponible: todo el ancho, alto menos HUD (breadcrumb arriba ~30, hint/controles abajo ~70)
    const availW = vw - 24;
    const availH = vh - 100;
    let s = Math.min(availW / (2 * totalR), availH / (2 * totalR));
    s = clamp(s, 0.32, 3.5);

    const tx = (vw / 2) - root.x * s;
    const ty = (vh / 2) - root.y * s;
    const fn = () => [(vw / 2) - root.x * cam.s, (vh / 2) - root.y * cam.s];
    animateCamTo(tx, ty, s, dur || 900, fn);
  }

  function focusNode(node) {
    vw = window.innerWidth; vh = window.innerHeight;
    heroCam = false;
    followNode = node; followOffY = 0;   // la cámara lo persigue; él sigue orbitando
    aplicarFoco(node);                   // lo que no participa en este momento, se atenúa
    const s = Math.max(cam.s, 1.05);
    const fn = () => centroDe(node);
    const t = fn();
    animateCamTo(t[0], t[1], s, 680, fn);
  }

  /* al ir a un nodo con hijos: el encuadre abraza al nodo Y su anillo completo,
     para que la vista abrace el sistema entero girando. Responsive: en móvil
     el clamp es más bajo (0.32) y el padding es mayor para que los rótulos no
     se corten en el borde de la pantalla. */
  function focusRing(node) {
    heroCam = false;
    vw = window.innerWidth; vh = window.innerHeight;
    followNode = node; followOffY = 30;
    aplicarFoco(node);
    let maxR = 200;
    (node.children || []).forEach(c => {
      if (c._shown) maxR = Math.max(maxR, Math.hypot(c.x - node.x, c.y - node.y));
    });
    maxR += 160;   // bola + rótulo (ancho y alto) + aire para que no se corten en el borde
    const availW = vw - panelAbierto(), availH = vh - 90;
    let s = Math.min((availW * 0.5) / maxR, (availH * 0.5) / maxR, 1.5);
    s = Math.max(0.32, s);
    const fn = () => centroDe(node);
    const t = fn();
    animateCamTo(t[0], t[1], s, 760, fn);
  }

  function expandOverview() {
    followNode = null;
    const root = nodesIndex["inicio"];
    (root.children || []).forEach(m => { if (m.children) expand(m, { silent: true, force: true }); });
    const vis = [root];
    root.children.forEach(m => {
      if (!m.el.classList.contains("hidden")) vis.push(m);
      (m.children || []).forEach(c => { if (!c.el.classList.contains("hidden")) vis.push(c); });
    });
    focusFit(vis, 0.94);
  }

  function collapseAll() {
    const root = nodesIndex["inicio"];
    (root.children || []).forEach(m => { if (m.expanded) collapse(m); });
    focusHero();
  }

  /* ================= GESTOS (pan / zoom / pinza) ================= */

  function bindGestures(space) {

    space.addEventListener("pointerdown", e => {
      if (e.target !== space && e.target !== world && e.target !== edgesSvg) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      dragMoved = false;
      if (pointers.size === 1) {
        space.setPointerCapture(e.pointerId);
        world.classList.add("dragging");
      } else if (pointers.size === 2) {
        const pts = [...pointers.values()];
        pinch = {
          d0: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y),
          mx0: (pts[0].x + pts[1].x) / 2, my0: (pts[0].y + pts[1].y) / 2,
          cam0: Object.assign({}, cam)
        };
      }
    });

    space.addEventListener("pointermove", e => {
      if (!pointers.has(e.pointerId)) return;
      const prev = pointers.get(e.pointerId);
      const cur = { x: e.clientX, y: e.clientY };
      pointers.set(e.pointerId, cur);

      if (pointers.size === 2 && pinch) {
        const pts = [...pointers.values()];
        const d = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y);
        const mx = (pts[0].x + pts[1].x) / 2, my = (pts[0].y + pts[1].y) / 2;
        let s = clamp(pinch.cam0.s * (d / (pinch.d0 || 1)), 0.32, 4.6);
        const wx = (pinch.mx0 - pinch.cam0.x) / pinch.cam0.s;
        const wy = (pinch.my0 - pinch.cam0.y) / pinch.cam0.s;
        cam.s = s;
        cam.x = mx - wx * s;
        cam.y = my - wy * s;
        applyCam();
        dragMoved = true;
        return;
      }

      const dx = cur.x - prev.x, dy = cur.y - prev.y;
      if (Math.abs(dx) + Math.abs(dy) > 2) {
        dragMoved = true; heroCam = false; followNode = null;
        aplicarFoco(null);   // exploración libre: todos los nodos vuelven a brillar
      }
      if (dragMoved) {
        cam.x += dx; cam.y += dy;
        applyCam();
      }
    });

    const up = e => {
      pointers.delete(e.pointerId);
      if (pointers.size < 2) pinch = null;
      if (pointers.size === 0) world.classList.remove("dragging");
    };
    space.addEventListener("pointerup", up);
    space.addEventListener("pointercancel", up);

    // clic en el vacío: si hay panel abierto, lo cierra; si no, va atrás
    // (al padre del nodo enfocado, o a casa si ya estás en la raíz).
    space.addEventListener("click", e => {
      if (e.target !== space && e.target !== world && e.target !== edgesSvg) return;
      if (dragMoved) return;
      // si el panel está abierto, el backdrop se encarga de cerrarlo;
      // aquí (panel cerrado) lo que toca afuera siempre va atrás.
      if (onNodeBack) onNodeBack();
    });

    // rueda: zoom al cursor
    space.addEventListener("wheel", e => {
      e.preventDefault();
      const factor = Math.exp(-e.deltaY * 0.0016);
      heroCam = false;
      const s2 = clamp(cam.s * factor, 0.32, 4.6);
      const wx = (e.clientX - cam.x) / cam.s;
      const wy = (e.clientY - cam.y) / cam.s;
      cam.s = s2;
      cam.x = e.clientX - wx * s2;
      cam.y = e.clientY - wy * s2;
      applyCam();
    }, { passive: false });
  }

  function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

  /* ================= API ================= */

  return {
    init(opts) {
      world = document.getElementById("world");
      edgesSvg = document.getElementById("edges");
      onNodeActivate = opts.onNodeActivate;
      onNodeBack = opts.onNodeBack;
      initProfundidad();
      layoutTree(TREE);

      // sendero del anillo principal: los hilos de las ramas viajan sobre él
      const sendero = document.createElementNS("http://www.w3.org/2000/svg", "circle");
      sendero.setAttribute("cx", "0"); sendero.setAttribute("cy", "0");
      sendero.setAttribute("r", "350");
      sendero.setAttribute("class", "orbit-ring");
      edgesSvg.appendChild(sendero);

      buildNode(TREE);
      bindGestures(document.getElementById("space"));
      startOrbita();

      // invitación a explorar
      nodesIndex["inicio"].el.classList.add("invite");
      (TREE.children || []).forEach(m => { if (m.children) nodesIndex[m.id].el.classList.add("invite"); });

      // estado inicial: centro + nodos principales, y la cámara llega al hero
      const root = nodesIndex["inicio"];
      root._shown = true;                         // marca el nodo raíz como visible
      root.el.classList.remove("hidden");
      TREE.children.forEach((m, i) => showNode(m, i));
      requestAnimationFrame(() => focusHero(1250));

      window.addEventListener("resize", () => {
        vw = window.innerWidth; vh = window.innerHeight;
        if (heroCam) focusHero(360);   // el hero se reencuadra si giran/cambian la ventana
      });
    },
    expand, collapse, toggle, expandOverview, collapseAll, fitHome, focusHero, focusNode,
    focusRing, node: id => nodesIndex[id],
    followedNode: () => followNode
  };
})();
