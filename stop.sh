#!/usr/bin/env bash
# Hide the indicator now (no re-login needed) and keep it off across logins.
# Files stay installed; ./start.sh turns it back on.
set -euo pipefail
gnome-extensions disable headset-battery@kunal.local
echo "headset-battery: stopped"
