/* ============================================================
   NEGRALUNA · Lector de la carpeta de contenido
   Pide el árbol de archivos a /api/contenido y lo mantiene
   en memoria para todos los nodos del mapa.
   ============================================================ */

"use strict";

const Contenido = {
  files: null,   // { "ruta/relativa": {kind, text?, bytes?} }

  async load() {
    try {
      const r = await fetch("/api/contenido", { cache: "no-store" });
      if (!r.ok) throw new Error("HTTP " + r.status);
      const j = await r.json();
      if (!j || !j.ok || !j.files) throw new Error("respuesta inválida");
      this.files = j.files;
    } catch (e) {
      this.files = null;
    }
    return this;
  },

  /* ¿hay servidor leyendo la carpeta? (false si se abrió index.html
     con doble clic: los navegadores bloquean leer archivos locales) */
  ok() {
    return this.files !== null;
  },

  /* texto de un .txt (el servidor lo trae inline) */
  text(relPath) {
    if (!this.files) return null;
    const f = this.files[relPath];
    return f && f.kind === "text" ? f.text : null;
  },

  /* archivos dentro de una carpeta (fotos/, videos/, musica/) */
  list(dirRelPath) {
    const out = [];
    if (!this.files) return out;
    const pref = dirRelPath.replace(/\/?$/, "/");
    Object.keys(this.files).forEach(k => {
      if (k.startsWith(pref)) {
        const name = k.slice(pref.length);
        if (!name.includes("/")) out.push({ path: k, name, kind: this.files[k].kind, bytes: this.files[k].bytes });
      }
    });
    return out;
  },

  /* ¿existe al menos un archivo bajo una carpeta? */
  hasAny(dirRelPath) {
    return this.list(dirRelPath).length > 0;
  },

  url(relPath) {
    // encodeURI: fotos con espacios o acentos ("Mi Foto.PNG", "Polerón") no rompen la src
    return "contenido/" + encodeURI(relPath).replace(/#/g, "%23").replace(/\?/g, "%3F");
  },

  size(bytes) {
    if (!bytes && bytes !== 0) return "";
    if (bytes < 1024) return bytes + " B";
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(0) + " KB";
    return (bytes / 1024 / 1024).toFixed(1) + " MB";
  }
};
