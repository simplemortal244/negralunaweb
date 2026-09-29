#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
NEGRALUNA HOMESTUDIO · servidor local del prototipo
Sirve esta carpeta y expone /api/contenido para que la página
lea en vivo todo lo que pongas dentro de "contenido/".

USO:  python3 servir.py            (o doble clic en iniciar-servidor)
"""
import argparse
import json
import mimetypes
import os
import socket
import threading
import webbrowser
from datetime import datetime, timezone
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

BASE = os.path.dirname(os.path.abspath(__file__))
CONTENIDO = os.path.join(BASE, "contenido")
ESTADO_VISITAS = os.path.join(BASE, "visitas-estado.json")
PREMIO_CADA = 1000
ESTADO_COMENTARIOS = os.path.join(BASE, "comentarios-estado.json")
MAX_COMENTARIOS = 200
MAX_NOMBRE = 40
MAX_TEXTO = 600
CONTEXTO_RE = __import__("re").compile(r"[a-z0-9_\-/]{1,64}")

TEXT_EXT = {".txt", ".md"}
AUDIO_EXT = {".mp3", ".wav", ".ogg", ".m4a", ".flac", ".aac"}
VIDEO_EXT = {".mp4", ".webm", ".mov", ".mkv", ".avi"}
IMAGE_EXT = {".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg", ".avif", ".bmp"}


def kind_of(ext: str) -> str:
    if ext in TEXT_EXT:
        return "text"
    if ext in AUDIO_EXT:
        return "audio"
    if ext in VIDEO_EXT:
        return "video"
    if ext in IMAGE_EXT:
        return "image"
    return "file"


def walk(folder: str, prefix: str = "") -> dict:
    """Árbol plano {ruta: {kind, text?, bytes?}} de todo lo hay en contenido/."""
    files: dict = {}
    if not os.path.isdir(folder):
        return files
    for entry in sorted(os.listdir(folder)):
        if entry.startswith("."):
            continue
        rel = f"{prefix}{entry}"
        full = os.path.join(folder, entry)
        if os.path.isdir(full):
            files.update(walk(full, rel + "/"))
        else:
            ext = os.path.splitext(entry)[1].lower()
            item = {"kind": kind_of(ext), "bytes": os.path.getsize(full)}
            if item["kind"] == "text":
                try:
                    with open(full, "r", encoding="utf-8") as fh:
                        item["text"] = fh.read()
                except UnicodeDecodeError:
                    item["kind"] = "file"
            files[rel] = item
    return files


def leer_total() -> int:
    """Total de visitas guardado en visitas-estado.json (0 si aún no existe)."""
    try:
        with open(ESTADO_VISITAS, "r", encoding="utf-8") as fh:
            j = json.load(fh)
        t = j.get("total", 0)
        return t if isinstance(t, int) and t >= 0 else 0
    except Exception:
        return 0


def guardar_total(total: int) -> None:
    try:
        with open(ESTADO_VISITAS, "w", encoding="utf-8") as fh:
            json.dump({"total": total, "premioCada": PREMIO_CADA}, fh, ensure_ascii=False, indent=2)
    except Exception:
        pass


def leer_comentarios() -> list:
    """Comentarios del muro guardados en comentarios-estado.json."""
    try:
        with open(ESTADO_COMENTARIOS, "r", encoding="utf-8") as fh:
            j = json.load(fh)
        c = j.get("comentarios", [])
        return c if isinstance(c, list) else []
    except Exception:
        return []


def guardar_comentarios(lista: list) -> None:
    try:
        with open(ESTADO_COMENTARIOS, "w", encoding="utf-8") as fh:
            json.dump({"comentarios": lista}, fh, ensure_ascii=False, indent=2)
    except Exception:
        pass


def leer_comentarios_ctx(ctx: str) -> list:
    """Comentarios por contexto (cada proyecto/podcast/video tiene su hilo)."""
    try:
        with open(ESTADO_COMENTARIOS, "r", encoding="utf-8") as fh:
            j = json.load(fh)
        ctxs = j.get("por_contexto", {})
        if not isinstance(ctxs, dict):
            return []
        c = ctxs.get(ctx, [])
        return c if isinstance(c, list) else []
    except Exception:
        return []


def guardar_comentarios_ctx(ctx: str, lista: list) -> None:
    try:
        with open(ESTADO_COMENTARIOS, "r", encoding="utf-8") as fh:
            j = json.load(fh)
    except Exception:
        j = {}
    ctxs = j.get("por_contexto", {})
    if not isinstance(ctxs, dict):
        ctxs = {}
    ctxs[ctx] = lista[-MAX_COMENTARIOS:]
    j["por_contexto"] = ctxs
    try:
        with open(ESTADO_COMENTARIOS, "w", encoding="utf-8") as fh:
            json.dump(j, fh, ensure_ascii=False, indent=2)
    except Exception:
        pass


def limpiar_texto(v, maximo: int) -> str:
    """Fuera caracteres de control y recorta al límite del muro."""
    if not isinstance(v, str):
        return ""
    limpio = "".join(ch for ch in v if ch >= " " or ch == "\n")
    return limpio.strip()[:maximo]


def limpiar_contexto(v) -> str:
    """Normaliza un contexto (proyecto/podcast/etc.) para usarlo como llave."""
    if not isinstance(v, str):
        return "muro"
    s = v.strip().lower()
    m = CONTEXTO_RE.match(s)
    if not m:
        return "muro"
    return m.group(0)


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=BASE, **kwargs)

    def end_headers(self):
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def send_json(self, payload: dict, status: int = 200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def do_GET(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        qs = ""
        if "?" in self.path:
            qs = self.path.split("?", 1)[1]
        from urllib.parse import parse_qs
        params = parse_qs(qs)
        if path.rstrip("/") == "/api/contenido":
            payload = {
                "ok": True,
                "root": "contenido",
                "note": "Edita archivos dentro de contenido/ y recarga la página.",
                "files": walk(CONTENIDO),
            }
            self.send_json(payload)
            return
        if path.rstrip("/") == "/api/visitas":
            self.send_json({"ok": True, "total": leer_total(), "premioCada": PREMIO_CADA})
            return
        if path.rstrip("/") == "/api/comentarios":
            ctx_vals = params.get("context") or params.get("ctx") or []
            ctx = limpiar_contexto(ctx_vals[0] if ctx_vals else "muro")
            if ctx and ctx != "muro":
                self.send_json({"ok": True, "context": ctx, "comentarios": leer_comentarios_ctx(ctx)})
            else:
                self.send_json({"ok": True, "context": "muro", "comentarios": leer_comentarios()})
            return
        super().do_GET()

    def do_POST(self):
        path = self.path.split("?", 1)[0].split("#", 1)[0]
        if path.rstrip("/") == "/api/comentarios":
            try:  # cuerpo JSON: {nombre, texto, context?}
                n = int(self.headers.get("Content-Length") or 0)
                data = json.loads(self.rfile.read(n).decode("utf-8")) if n > 0 else {}
            except Exception:
                data = {}
            nombre = limpiar_texto(data.get("nombre"), MAX_NOMBRE) or "Anónimo"
            texto = limpiar_texto(data.get("texto"), MAX_TEXTO)
            if not texto:
                self.send_json({"ok": False, "error": "comentario vacío"}, 400)
                return
            ctx = limpiar_contexto(data.get("context") or "muro")
            comentario = {
                "nombre": nombre,
                "texto": texto,
                "fecha": datetime.now(timezone.utc).isoformat()
            }
            if ctx and ctx != "muro":
                lista = leer_comentarios_ctx(ctx)
                lista.append(comentario)
                guardar_comentarios_ctx(ctx, lista)
                self.send_json({"ok": True, "context": ctx, "comentario": lista[-1]})
                return
            # muro global (comportamiento original)
            lista = leer_comentarios()
            lista.append(comentario)
            del lista[:-MAX_COMENTARIOS]
            guardar_comentarios(lista)
            self.send_json({"ok": True, "comentario": lista[-1]})
            return
        if path.rstrip("/") != "/api/visitas":
            self.send_json({"ok": False, "error": "endpoint desconocido"}, 404)
            return
        try:  # leer y descartar el cuerpo si viene
            n = int(self.headers.get("Content-Length") or 0)
            if n > 0:
                self.rfile.read(n)
        except Exception:
            pass
        total = leer_total() + 1
        guardar_total(total)
        premio = total % PREMIO_CADA == 0
        self.send_json({
            "ok": True,
            "total": total,
            "premio": premio,
            "numero": total if premio else None,
            "premioCada": PREMIO_CADA,
        })

    def log_message(self, fmt, *args):  # logs discretos
        print("  ·", fmt % args)


def free_port(start: int) -> int:
    port = start
    while port < start + 20:
        with socket.socket(socket.AF_INET, socket.SOCK_STREAM) as s:
            try:
                s.bind(("127.0.0.1", port))
                return port
            except OSError:
                port += 1
    return start


def main():
    ap = argparse.ArgumentParser(description="Servidor local del prototipo NegraLuna")
    ap.add_argument("--port", type=int, default=8123)
    ap.add_argument("--no-open", action="store_true", help="no abrir el navegador")
    args = ap.parse_args()

    port = free_port(args.port)
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)

    url = f"http://localhost:{port}"
    print()
    print("  ╭──────────────────────────────────────────────╮")
    print("  │   ◆  NEGRALUNA HOMESTUDIO · mapa vivo        │")
    print("  ╰──────────────────────────────────────────────╯")
    print(f"   Página      →  {url}")
    print(f"   Contenido   →  {os.path.relpath(CONTENIDO, BASE)}/  (edítala y recarga)")
    print("   Para detener →  Ctrl + C")
    print()

    if not args.no_open:
        threading.Timer(1.0, lambda: webbrowser.open(url)).start()

    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n   Servidor detenido. ¡Hasta la próxima luna!\n")


if __name__ == "__main__":
    main()
