#!/bin/bash
# NegraLuna HomeStudio · lanzador para macOS / Linux
cd "$(dirname "$0")"
if command -v python3 >/dev/null 2>&1; then
  python3 servir.py
else
  echo ""
  echo "  [!] No encontré python3. En macOS instálalo con:  xcode-select --install"
  echo ""
  read -r -p "Presiona Enter para salir..."
fi
