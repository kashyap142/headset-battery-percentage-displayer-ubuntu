#!/usr/bin/env bash
# Show the indicator again (no re-login needed once installed).
set -euo pipefail
gnome-extensions enable headset-battery@kunal.local
echo "headset-battery: started"
