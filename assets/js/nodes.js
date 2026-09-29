/* ============================================================
   NEGRALUNA · Árbol de nodos e íconos (SVG trazados a mano)
   Editar este archivo cambia la estructura del mapa.
   ============================================================ */

"use strict";

const ICONS = {
  luna: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6.2 6.2 0 0 0 9 8.7A9 9 0 1 1 12 3Z"/><path d="M17.5 5.5l.5 1.4 1.4.5-1.4.5-.5 1.4-.5-1.4-1.4-.5 1.4-.5Z" fill="currentColor" stroke="none"/></svg>',

  constelacion: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="5.5" cy="6.5" r="2.1"/><circle cx="18.5" cy="5" r="2.1"/><circle cx="12" cy="18.5" r="2.1"/><path d="M7.3 7.6l3.2 8.9M17 6.9l-3.5 9.7M7.6 6.2l8.9-1"/></svg>',

  sol: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2.5v2.6M12 18.9v2.6M2.5 12h2.6M18.9 12h2.6M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M18.7 5.3l-1.8 1.8M7.1 16.9l-1.8 1.8"/></svg>',

  pin: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 21.5S5.5 15.6 5.5 10.7a6.5 6.5 0 1 1 13 0c0 4.9-6.5 10.8-6.5 10.8Z"/><circle cx="12" cy="10.5" r="2.4"/></svg>',

  sobre: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5.5" width="17" height="13" rx="1.6"/><path d="M4.5 7.5l7.5 5.6 7.5-5.6"/></svg>',

  disco: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="8.6"/><circle cx="12" cy="12" r="2.4"/><path d="M12 6.4a5.6 5.6 0 0 1 5.6 5.6"/><path d="M12 17.6A5.6 5.6 0 0 1 6.4 12"/></svg>',

  libro: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2.5H20v19H6.5A2.5 2.5 0 0 1 4 19v-14A2.5 2.5 0 0 1 6.5 2.5Z"/><path d="M9 7h7M9 10.5h5"/></svg>',

  piramide: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M2.5 20.5h19"/><path d="M5.5 20.5v-3.4h13v3.4"/><path d="M8.5 17.1v-3.4h7v3.4"/><path d="M10.8 13.7v-3.4h2.4v3.4"/><path d="M12 6.2l1 2 2 .3-1.5 1.4.4 2-1.9-1-1.9 1 .4-2L9 8.5l2-.3Z"/></svg>',

  foto: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3.5" y="5" width="17" height="14" rx="1.6"/><circle cx="8.7" cy="9.6" r="1.6"/><path d="M4.5 16.5l4.6-4.6 3.6 3.6 2.8-2.8 4 4"/></svg>',

  video: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5.5" width="18" height="13" rx="2"/><path d="M10.3 9.4l4.6 2.6-4.6 2.6Z" fill="currentColor"/></svg>',

  nota: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M9.2 18.3V6.2l9-2v11.6"/><circle cx="7" cy="18.4" r="2.2"/><circle cx="16" cy="15.8" r="2.2"/></svg>',

  discobola: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2v2.8"/><circle cx="12" cy="11" r="6.2"/><path d="M6.4 9h11.2M6.4 13.2h11.2M12 4.8v12.4"/><path d="M19.5 4v2.6M18.2 5.3h2.6M4.5 17.5v2.6M3.2 18.8h2.6"/></svg>',

  juego: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="2.5" y="8" width="19" height="9.5" rx="4.7"/><path d="M8 10.7v4M6 12.7h4"/><circle cx="15.8" cy="11.3" r="1" fill="currentColor" stroke="none"/><circle cx="18" cy="13.8" r="1" fill="currentColor" stroke="none"/></svg>',

  microfono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><rect x="9" y="2.8" width="6" height="11" rx="3"/><path d="M5.5 11.5a6.5 6.5 0 0 0 13 0M12 18v3.2M9 21.2h6"/></svg>',

  pluma: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 3.5c-6.5 0-11.5 4-13.5 10l-3 7 7-3c6-2 9.5-7.5 9.5-14Z"/><path d="M7.5 16.5l6.5-6.5"/></svg>',

  mascara: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3.5h14V11a7 7 0 0 1-14 0Z"/><path d="M8.6 8.4l1 1-1 1-1-1ZM15.4 8.4l1 1-1 1-1-1Z" fill="currentColor" stroke="none"/><path d="M9.3 13.4c1.6 1.3 3.8 1.3 5.4 0"/></svg>',

  mezclador: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 4v16M12 4v16M18 4v16"/><circle cx="6" cy="9.5" r="1.9" fill="currentColor" stroke="none"/><circle cx="12" cy="15" r="1.9" fill="currentColor" stroke="none"/><circle cx="18" cy="7" r="1.9" fill="currentColor" stroke="none"/></svg>',

  charla: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M20.5 5.5h-17v10h5.5v4l4.5-4h7Z"/><path d="M8 9.5h.01M12 9.5h.01M16 9.5h.01" stroke-width="2.4"/></svg>',

  parlante: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3.5 9.5v5H7l5 4.5v-14L7 9.5Z"/><path d="M16 9.2a4.3 4.3 0 0 1 0 5.6M18.8 6.6a8.2 8.2 0 0 1 0 10.8"/></svg>',

  musicos: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="9" cy="7.8" r="3"/><path d="M3.5 20c0-3.1 2.4-5.2 5.5-5.2s5.5 2.1 5.5 5.2"/><circle cx="17" cy="9" r="2.4"/><path d="M16.5 14.6c2.5.2 4 2 4 4.4"/></svg>',

  pua: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 2.8c4.3 0 7.2 2.6 7.2 6.2 0 5.2-4.7 10.4-7.2 12.2C9.5 19.4 4.8 14.2 4.8 9c0-3.6 2.9-6.2 7.2-6.2Z"/><path d="M9.5 7.5c1.6-1 3.4-1 5 0"/></svg>',

  correo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4.2"/><path d="M16.2 12v1.6a2.6 2.6 0 0 0 5.2 0V12a9.4 9.4 0 1 0-3.7 7.5"/></svg>',

  telefono: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 3.8h4L10.5 8 8 10.2a12.8 12.8 0 0 0 5.8 5.8l2.2-2.5 4.2 1.5v4a2 2 0 0 1-2.2 2A16.8 16.8 0 0 1 3 6a2 2 0 0 1 2-2.2Z"/></svg>',

  paloma: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M21 3.5 10.5 14M21 3.5l-6.8 17.5-3.7-7-7-3.7Z"/></svg>',

  estrella: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3l2.4 5.3 5.6.6-4.2 3.9 1.2 5.7L12 15.6l-5 2.9 1.2-5.7L4 8.9l5.6-.6Z"/></svg>',

  montana: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M3 19l6-10 4 6.5L16 11l5 8Z"/><circle cx="17.5" cy="5.5" r="1.8"/></svg>',

  tienda: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M5 8h14l-1.2 12.2a1.8 1.8 0 0 1-1.8 1.6H8a1.8 1.8 0 0 1-1.8-1.6Z"/><path d="M8.5 10.5V7a3.5 3.5 0 0 1 7 0v3.5"/></svg>',

  trofeo: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M7 4h10v5a5 5 0 0 1-10 0Z"/><path d="M7 5.5H4.5a3.5 3.5 0 0 0 3.4 4.4M17 5.5h2.5a3.5 3.5 0 0 1-3.4 4.4"/><path d="M12 14v3M8.5 20.5h7M10 20.5c0-2 .7-3.5 2-3.5s2 1.5 2 3.5"/></svg>',

  corazon: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M12 20.3S3.6 15.2 3.6 9.4a4.6 4.6 0 0 1 8.4-2.6 4.6 4.6 0 0 1 8.4 2.6c0 5.8-8.4 10.9-8.4 10.9Z"/><path d="M7.6 10.1c.4-1 1.2-1.7 2.2-2"/></svg>',

  red: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><circle cx="6" cy="12" r="2.5"/><circle cx="17.5" cy="5.5" r="2.5"/><circle cx="17.5" cy="18.5" r="2.5"/><path d="M8.3 10.8l6.9-4M8.3 13.2l6.9 4"/></svg>'
};

/* ---------- helpers ---------- */

function leaf(id, label, icon, kind, extra) {
  return Object.assign({ id, label, icon, kind, leaf: true }, extra || {});
}

/* las 5 secciones estándar de cada banda, con rutas txt explícitas */
function bandLeaves(base) {
  return [
    leaf("biografia", "Biografía", "libro", "texto", { txt: base + "/biografia.txt" }),
    leaf("hitos", "Hitos", "piramide", "texto", { txt: base + "/hitos.txt", slot: "línea de tiempo" }),
    leaf("fotos", "Fotos", "foto", "galeria", { dir: "fotos" }),
    leaf("videos", "Videos", "video", "videos", { dir: "videos" }),
    leaf("musica", "Reproductor de música", "nota", "musica", { dir: "musica" })
  ];
}

/* ---------- EL ÁRBOL ---------- */

const TREE = {
  id: "inicio",
  label: "NegraLuna",
  sub: "HomeStudio",
  icon: "luna",
  type: "center",
  logo: "assets/logos/homestudio.png",
  children: [
    {
      id: "proyectos",
      label: "Proyectos",
      icon: "constelacion",
      children: [
        {
          id: "negra-luna",
          label: "Negra Luna",
          icon: "disco",
          logo: "assets/logos/negra-luna.png",
          path: "proyectos/negra-luna",
          children: [
            ...bandLeaves("proyectos/negra-luna"),
          ]
        },
        {
          id: "luna-errante",
          label: "Luna Errante",
          icon: "disco",
          logo: "assets/logos/luna-errante.png",
          path: "proyectos/luna-errante",
          children: [
            ...bandLeaves("proyectos/luna-errante"),,
            {
              id: "discotopia",
              label: "Discotopía",
              icon: "discobola",
              logo: "assets/logos/discotopia.png",
              path: "proyectos/luna-errante/discotopia",
              children: [
                leaf("mundo-discotopia", "Mundo Discotopía", "libro", "texto", { path: "proyectos/luna-errante/discotopia/mundo", txt: "proyectos/luna-errante/discotopia/mundo/mundo.txt" }),
                leaf("videos-discotopia", "Videos", "video", "videos", { dir: "videos" }),
                leaf("musica-discotopia", "Música", "nota", "musica", { dir: "musica" }),
                leaf("juego", "Juego", "juego", "juego", { logo: "assets/logos/juego-discotopia.png", txt: "proyectos/luna-errante/discotopia/juego.txt" })
              ]
            }
          ]
        },
        {
          id: "negra-cumbia",
          label: "Negra Cumbia",
          icon: "disco",
          path: "proyectos/negra-cumbia",
          children: [
            ...bandLeaves("proyectos/negra-cumbia"),
          ]
        },
        {
          id: "simple-mortal",
          label: "Simple Mortal",
          icon: "disco",
          path: "proyectos/simple-mortal",
          children: [
            ...bandLeaves("proyectos/simple-mortal"),
          ]
        }
      ]
    },
    {
      id: "servicios",
      label: "Servicios",
      icon: "sol",
      children: [
        leaf("grabacion", "Grabación, edición, mezcla y masterización", "microfono", "servicio", { path: "servicios/grabacion", txt: "servicios/grabacion.txt", sub: "equipos y lugar" }),
        leaf("composicion", "Composición", "pluma", "servicio", { path: "servicios/composicion", txt: "servicios/composicion.txt" }),
        leaf("artes-escenicas", "Composición · artes escénicas", "mascara", "servicio", { path: "servicios/artes-escenicas", txt: "servicios/artes-escenicas.txt" }),
        leaf("produccion", "Producción", "mezclador", "servicio", { path: "servicios/produccion", txt: "servicios/produccion.txt" }),
        leaf("asesorias", "Asesorías", "charla", "servicio", { path: "servicios/asesorias", txt: "servicios/asesorias.txt" }),
        leaf("musica-en-vivo", "Música en vivo", "parlante", "servicio", { path: "servicios/musica-en-vivo", txt: "servicios/musica-en-vivo.txt" }),
        leaf("musicos-de-sesion", "Músicos de sesión", "musicos", "servicio", { path: "servicios/musicos-de-sesion", txt: "servicios/musicos-de-sesion.txt" }),
        leaf("clases", "Clases de instrumentos y canto", "pua", "servicio", { path: "servicios/clases", txt: "servicios/clases.txt" })
      ]
    },
    {
      id: "podcast",
      label: "Órbita Lunar",
      sub: "podcast",
      icon: "microfono",
      path: "podcast/orbita-lunar",
      children: [
        leaf("orbita-audio", "Capítulos de audio", "parlante", "podcast-audio", { dir: "audio", txt: "podcast/orbita-lunar/presentacion.txt" }),
        leaf("orbita-video", "Capítulos de video", "video", "podcast-video", { dir: "video", txt: "podcast/orbita-lunar/presentacion.txt" })
      ]
    },
    {
      id: "tienda",
      label: "Tienda",
      icon: "tienda",
      kind: "tienda",
      leaf: true,
      path: "tienda",
      txt: "tienda/tienda.txt"
    },
    {
      id: "donar",
      label: "Donaciones",
      icon: "corazon",
      kind: "donar",
      leaf: true,
      path: "donar",
      txt: "donar/donar.txt"
    },
    {
      id: "blog",
      label: "Comentarios",
      icon: "charla",
      kind: "blog",
      leaf: true,
      path: "blog",
      txt: "blog/blog.txt"
    },
    {
      id: "ubicacion",
      label: "Ubicación",
      icon: "pin",
      kind: "mapa",
      leaf: true,
      path: "ubicacion",
      txt: "ubicacion.txt"
    },
    {
      id: "contacto",
      label: "Contacto",
      icon: "sobre",
      children: [
        leaf("redes", "Redes sociales", "red", "redes", { txt: "contacto/redes.txt" }),
        leaf("mail", "Mail", "correo", "mail", { txt: "contacto/mail.txt" }),
        leaf("telefono", "Teléfono", "telefono", "telefono", { txt: "contacto/telefono.txt" }),
        leaf("escribenos", "Escríbenos", "paloma", "formulario", { txt: "contacto/escribenos.txt" })
      ]
    }
  ]
};

/* dirección real del estudio (nodo Ubicación) */
const UBICACION = {
  direccion: "Federico Errázuriz 264, Pinto, Ñuble, Chile",
  mapsEmbed: "https://www.google.com/maps?q=Federico+Err%C3%A1zuriz+264,+Pinto,+%C3%91uble,+Chile&output=embed",
  mapsRuta: "https://www.google.com/maps/dir/?api=1&destination=Federico+Err%C3%A1zuriz+264,+Pinto,+%C3%91uble,+Chile"
};
