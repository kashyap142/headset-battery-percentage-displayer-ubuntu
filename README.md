# headset-battery

Minimal GNOME Shell 50 extension: headphone icon + battery % in the top bar
while a Bluetooth headset is connected. Hidden otherwise.

## How it works

BlueZ reads the headset battery (HFP `AT+IPHONEACCEV`) and exposes
`org.bluez.Battery1`. UPower mirrors it as a `headset` device. The extension
subscribes to UPower via `UPowerGlib` and redraws on `notify::percentage`.
No polling.

- `src/logic.js`: pure filtering/formatting (tested)
- `src/extension.js`: panel indicator + UPower signal wiring
- `test/logic.test.js`: gate tests + live check against the running UPower

## Use

    ./install.sh          # runs tests, copies to ~/.local/share/gnome-shell/extensions, enables
    # first install on Wayland: log out and back in

    gjs -m test/logic.test.js          # tests only
    journalctl --user -b -g headset-battery   # errors, if any
    ./stop.sh             # hide now, stays off across logins; asks whether to remove files
    ./stop.sh --keep      # hide, keep files (no prompt)
    ./stop.sh --remove    # hide + uninstall (bring back: ./install.sh + re-login)
    bash test/stop.test.sh   # dry-run tests for stop.sh
    ./start.sh            # show again

## Limits

- Sony reports in 10% steps; updates arrive only when the headset sends them.
- `shell-version` is `["50"]`. After a GNOME upgrade, add the new version to
  `src/metadata.json`, reinstall, and re-login.
- Only `headset` / `headphones` UPower kinds are shown (not mice/keyboards).
