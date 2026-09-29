/* ============================================================
   NEGRALUNA · Arranque
   ============================================================ */

"use strict";

/* ===========================================================
   NEGRALUNA · Contador de visitas + premio del visitante mil
   El servidor lleva el total (visitas-estado.json); cada sesión
   de navegador cuenta una sola vez. Cuando la visita es múltiplo
   de 1000, la página celebra al visitante y le deja reclamar su
   premio por WhatsApp o correo (el premio se escribe en
   contenido/visitas/premio.txt). Sin API real (hosting solo
   estático), el contador no se muestra: nada de números falsos.
   ============================================================ */

const ContadorVisitas = (() => {

  const KEY_SESION = "nl-visita-hecha";
  const PREMIO_TXT = "visitas/premio.txt";

  function fmt(n) {
    try { return n.toLocaleString("es-CL"); } catch (e) { return String(n); }
  }

  function lineaPrincipal(rel) {
    const raw = Contenido.text(rel);
    if (!raw) return null;
    const lines = raw.split(/\r?\n/).map(l => l.trim()).filter(l => l && !l.startsWith("## "));
    return lines.length ? lines[0] : null;
  }

  function mostrarChip(total) {
    let chip = document.getElementById("visitas-chip");
    if (!chip) {
      chip = document.createElement("span");
      chip.id = "visitas-chip";
      chip.title = "Contador de visitas · premio al visitante de cada 1000";
      const controles = document.getElementById("controls");
      (controles || document.body).appendChild(chip);
    }
    chip.innerHTML = "<b>" + fmt(total) + "</b> " + (total === 1 ? "visita" : "visitas");
  }

  function celebrar(numero) {
    if (document.getElementById("premio-float")) return;
    const premio = lineaPrincipal(PREMIO_TXT) || "un regalo sorpresa de NegraLuna";
    const detalle = (Contenido.text(PREMIO_TXT) || "").split(/\r?\n/).map(l => l.trim())
      .filter(l => l && !l.startsWith("## ") && l !== premio).join(" ");

    const fonoRaw = lineaPrincipal("contacto/telefono.txt") || "";
    const fonoOk = fonoRaw.replace(/\D/g, "").length >= 9 && fonoRaw.indexOf("XXXX") === -1;
    const mail = lineaPrincipal("contacto/mail.txt") || "hola@negraluna.cl";
    const mailOk = mail.indexOf("XXXX") === -1;
    const texto = "🏆 ¡Hola NegraLuna! Soy el visitante N° " + fmt(numero) + " y vengo a reclamar mi premio: " + premio;

    let botones = "";
    if (fonoOk) botones += '<button class="btn-tejido" data-premio-canal="whatsapp">Reclamar por WhatsApp</button>';
    if (mailOk) botones += '<button class="btn-fantasma" data-premio-canal="correo">Reclamar por correo</button>';
    if (!botones) botones = '<div class="premio-nota">Configura teléfono o correo en contenido/contacto/ para recibir el reclamo.</div>';

    const capas = document.createElement("div");
    capas.id = "premio-float";
    capas.setAttribute("role", "dialog");
    capas.innerHTML =
      '<div class="premio-caja">' +
      '<div class="premio-ic">' + (ICONS.trofeo || ICONS.estrella) + "</div>" +
      '<div class="premio-kicker">◆ NEGRALUNA · MAPA VIVO ◆</div>' +
      '<h2 class="premio-titulo">¡Eres el visitante ' + fmt(numero) + "!</h2>" +
      '<p class="premio-texto">El mapa te celebra: llegaste justo a la visita premiada.</p>' +
      '<div class="premio-regalo">' + premio + "</div>" +
      (detalle ? '<p class="premio-detalle">' + detalle + "</p>" : "") +
      '<div class="premio-botones">' + botones + "</div>" +
      '<button class="premio-cerrar" type="button">Seguir explorando el mapa</button>' +
      "</div>";
    document.body.appendChild(capas);
    requestAnimationFrame(() => capas.classList.add("on"));

    capas.querySelector(".premio-cerrar").addEventListener("click", () => capas.remove());
    capas.addEventListener("click", e => { if (e.target === capas) capas.remove(); });
    document.addEventListener("keydown", function esc(e) {
      if (e.key === "Escape") { capas.remove(); document.removeEventListener("keydown", esc); }
    });
    capas.addEventListener("click", e => {
      const b = e.target.closest("[data-premio-canal]");
      if (!b) return;
      const canal = b.dataset.premioCanal;
      if (canal === "whatsapp") {
        window.open("https://wa.me/" + fonoRaw.replace(/\D/g, "") + "?text=" + encodeURIComponent(texto), "_blank", "noopener");
      } else {
        window.location.href = "mailto:" + mail + "?subject=" + encodeURIComponent("Premio visitante N° " + fmt(numero)) + "&body=" + encodeURIComponent(texto);
      }
    });
  }

  async function iniciar() {
    let yaContada = false;
    try { yaContada = sessionStorage.getItem(KEY_SESION) === "1"; } catch (e) {}
    try {
      const r = await fetch("/api/visitas", { method: yaContada ? "GET" : "POST", cache: "no-store" });
      if (!r.ok) return;
      const j = await r.json();
      if (!j || !j.ok || typeof j.total !== "number") return;
      try { sessionStorage.setItem(KEY_SESION, "1"); } catch (e) {}
      mostrarChip(j.total);
      if (j.premio && j.numero) celebrar(j.numero);
    } catch (e) {
      /* sin servidor de visitas: el contador no se muestra — nada de números falsos */
    }
  }

  return { iniciar };
})();

(function () {

  function setBreadcrumb(node) {
    const bc = document.getElementById("breadcrumb");
    bc.innerHTML = "";
    const chain = [];
    let n = node;
    while (n) { chain.unshift(n); n = n.parent; }
    chain.forEach((c, i) => {
      if (i > 0) {
        const sep = document.createElement("span");
        sep.className = "sep";
        sep.textContent = "▸";
        bc.appendChild(sep);
      }
      const b = document.createElement("button");
      b.className = "crumb" + (i === chain.length - 1 ? " here" : "");
      b.textContent = c.label;
      b.addEventListener("click", () => {
        if (c.children) Engine.focusNode(c);
        else { Engine.focusNode(c); Panel.open(c); }
      });
      bc.appendChild(b);
    });
  }

  function activate(node) {
    setBreadcrumb(node);
    if (node.children) {
      Engine.toggle(node);
    } else {
      Panel.open(node);
      Engine.focusNode(node);
    }
  }

  /* volver atrás un paso en la cadena de nodos:
     - si hay panel abierto: lo cierra y enfoca al padre del nodo hoja
     - si no hay panel: colapsa el nodo enfocado y enfoca a su padre
     - si ya estás en la raíz: reencuadra el hero (no-op visible) */
  function goBack() {
    // 1) cerrar panel si está abierto (un paso atrás desde una hoja)
    const panel = document.getElementById("panel");
    const panelWasOpen = panel.classList.contains("on");
    if (panelWasOpen) {
      window.dispatchEvent(new CustomEvent("nl:close-panel"));
    }

    const focused = Engine.followedNode();

    // si no hay foco, o estás en la raíz, o el foco no tiene padre: a casa
    if (!focused || focused.id === "inicio" || !focused.parent) {
      Engine.focusHero(panelWasOpen ? 0 : 600);
      document.getElementById("breadcrumb").innerHTML = "";
      return;
    }

    const parent = focused.parent;

    // si no había panel abierto, el foco era un nodo expandido: colápsalo
    if (!panelWasOpen && focused.children && focused.expanded) {
      Engine.collapse(focused);
    }

    // enfoca al padre (que sigue expandido, mostrando a sus hijos — los hermanos del foco)
    if (parent.id === "inicio") {
      Engine.focusHero(600);
      document.getElementById("breadcrumb").innerHTML = "";
    } else {
      Engine.focusRing(parent);
      setBreadcrumb(parent);
    }
  }

  async function boot() {
    await Contenido.load();

    // si la página se abrió sin servidor, no puede leer la carpeta:
    // avisarlo claro una sola vez, con la solución en la mano
    if (!Contenido.ok()) {
      showToast("Esta página necesita su servidor para leer tu carpeta contenido/: cierra esto y abre la web con doble clic en iniciar-servidor.", 8000);
    }

    // Radio NegraLuna (widget flotante: música al azar de contenido/musica-fondo/)
    RadioNegraLuna.iniciar();

    // contador de visitas (+ premio del visitante mil, si corresponde)
    ContadorVisitas.iniciar();

    Engine.init({ onNodeActivate: activate, onNodeBack: goBack });
    Panel.bind();

    // backdrop del panel: tocar afuera (en móvil/cuando hay panel) también va atrás
    document.getElementById("panel-backdrop").addEventListener("click", goBack);

    // controles HUD
    document.getElementById("ctl-home").addEventListener("click", () => {
      Engine.focusHero();
      if (Panel.isOpen()) Panel.close();
    });
    document.getElementById("ctl-open").addEventListener("click", () => {
      document.getElementById("breadcrumb").innerHTML = "";
      Engine.expandOverview();
    });
    document.getElementById("ctl-clear").addEventListener("click", () => {
      document.getElementById("breadcrumb").innerHTML = "";
      Engine.collapseAll();
    });

    // pista inicial: se desvanece tras un rato o al primer gesto
    const hint = document.getElementById("hint");
    const touch = window.matchMedia("(pointer: coarse)").matches || "ontouchstart" in window;
    if (touch) {
      hint.innerHTML = "<b>Arrastra</b> para viajar · <b>pellizca</b> para acercar · <b>toca un nodo</b> para descubrirlo";
    }
    const hideHint = () => hint.classList.add("gone");
    setTimeout(hideHint, 9000);
    document.getElementById("space").addEventListener("pointerdown", () => setTimeout(hideHint, 3500), { once: true });

    // atajos
    document.addEventListener("keydown", e => {
      // si el visitante está escribiendo en un input/textarea/select o en
      // un contentEditable, los atajos de UNA tecla NO se disparan:
      // hace falta la "h" para escribir "hola", el espacio para " ", etc.
      const t = e.target;
      if (t && (t.tagName === "INPUT" || t.tagName === "TEXTAREA" || t.tagName === "SELECT" || t.isContentEditable)) return;
      if (e.key === "h") {
        Engine.focusHero();
        if (Panel.isOpen()) Panel.close();   // igual que el botón de brújula
      }
    });

    console.log("%c◆ NegraLuna HomeStudio · mapa vivo tejido a mano", "color:#d9a441;font-size:13px;");
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", boot);
  } else {
    boot();
  }
})();
