#!/usr/bin/env bash
# Run: bash test/stop.test.sh   (dry run, never touches the real extension)
cd "$(dirname "$0")/.." || exit 1
export HB_DRY_RUN=1
pass=0 fail=0
check() { # name, expected substring, actual output
    if [[ $3 == *"$2"* ]]; then pass=$((pass+1)); else fail=$((fail+1)); echo "FAIL $1: wanted '$2' in: $3"; fi
}
check "--keep disables"        "+ gnome-extensions disable"   "$(./stop.sh --keep)"
check "-k disables"            "+ gnome-extensions disable"   "$(./stop.sh -k)"
check "--remove uninstalls"    "+ gnome-extensions uninstall" "$(./stop.sh --remove)"
check "-r uninstalls"          "+ gnome-extensions uninstall" "$(./stop.sh -r)"
check "prompt y uninstalls"    "+ gnome-extensions uninstall" "$(echo y   | ./stop.sh)"
check "prompt YES uninstalls"  "+ gnome-extensions uninstall" "$(echo YES | ./stop.sh)"
check "prompt n keeps"         "+ gnome-extensions disable"   "$(echo n   | ./stop.sh)"
check "prompt empty keeps"     "+ gnome-extensions disable"   "$(echo     | ./stop.sh)"
check "prompt EOF keeps"       "+ gnome-extensions disable"   "$(./stop.sh </dev/null)"
check "prompt junk keeps"      "+ gnome-extensions disable"   "$(echo maybe | ./stop.sh)"
check "keep never uninstalls"  "files kept"                   "$(./stop.sh --keep)"
out=$(./stop.sh --bogus 2>&1); code=$?
check "bad flag exit 2"        "2" "$code"
check "bad flag message"       "unknown option" "$out"
out=$(./stop.sh --keep extra 2>&1); code=$?
check "extra arg exit 2"       "2" "$code"
check "help"                   "--remove" "$(./stop.sh --help)"
echo "$pass passed, $fail failed"
[[ $fail == 0 ]]
