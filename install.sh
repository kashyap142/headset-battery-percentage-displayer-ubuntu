#!/usr/bin/env bash
# Install (copy) the extension for the current user and mark it enabled.
# Copies instead of symlinking: this repo lives on an NTFS drive mounted with
# `nofail`, and the panel indicator must survive that drive being absent.
set -euo pipefail
cd "$(dirname "$0")"

UUID=$(gjs -c 'print(JSON.parse(imports.gi.GLib.file_get_contents("src/metadata.json")[1].toString()).uuid)' 2>/dev/null \
    || python3 -c 'import json;print(json.load(open("src/metadata.json"))["uuid"])')
DEST="$HOME/.local/share/gnome-shell/extensions/$UUID"

gjs -m test/logic.test.js

mkdir -p "$DEST"
cp src/extension.js src/logic.js src/metadata.json "$DEST/"
echo "installed -> $DEST"

# Enable: works immediately if the shell already knows the extension,
# otherwise it is added to enabled-extensions so it loads at next login.
if ! gnome-extensions enable "$UUID" 2>/dev/null; then
    python3 - "$UUID" <<'EOF'
import ast, subprocess, sys
uuid = sys.argv[1]
cur = subprocess.check_output(["gsettings", "get", "org.gnome.shell", "enabled-extensions"], text=True).strip()
lst = [] if cur.startswith("@as") else ast.literal_eval(cur)
if uuid not in lst:
    lst.append(uuid)
    subprocess.check_call(["gsettings", "set", "org.gnome.shell", "enabled-extensions", str(lst)])
EOF
    echo "added to enabled-extensions; log out and back in (Wayland cannot reload the shell)"
else
    echo "enabled"
fi
