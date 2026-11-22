#!/usr/bin/env bash
# Stop the headset battery indicator.
#   ./stop.sh            hide it; asks whether to also remove the installed files
#   ./stop.sh --keep     hide it, keep files (./start.sh brings it back, no re-login)
#   ./stop.sh --remove   hide it and uninstall (bring back: ./install.sh + re-login)
# HB_DRY_RUN=1 prints the commands instead of running them (used by tests).
set -euo pipefail
UUID=headset-battery@kunal.local

usage() { sed -n '2,6p' "$0" | sed 's/^# \{0,1\}//'; }
run() { if [[ ${HB_DRY_RUN:-} == 1 ]]; then echo "+ $*"; else "$@"; fi; }

remove=""
case "${1:-}" in
    --remove|-r) remove=yes ;;
    --keep|-k)   remove=no ;;
    -h|--help)   usage; exit 0 ;;
    "")          ;;
    *)           echo "unknown option: $1" >&2; usage >&2; exit 2 ;;
esac
if [[ $# -gt 1 ]]; then echo "too many arguments" >&2; usage >&2; exit 2; fi

if [[ -z $remove ]]; then
    read -r -p "Also remove the installed files? [y/N] " ans || ans=""
    [[ ${ans,,} == y || ${ans,,} == yes ]] && remove=yes || remove=no
fi

if [[ $remove == yes ]]; then
    # uninstall disables, deletes the files and drops it from enabled-extensions
    run gnome-extensions uninstall "$UUID"
    echo "headset-battery: stopped and removed (reinstall: ./install.sh, then log out/in)"
else
    run gnome-extensions disable "$UUID"
    echo "headset-battery: stopped (files kept, ./start.sh to show again)"
fi
