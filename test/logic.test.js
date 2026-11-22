// Run: gjs -m test/logic.test.js
// Gate tests for the pure logic, plus one live check against the real UPower
// daemon (skipped when no headset is connected).
import UPower from 'gi://UPowerGlib';
import {formatLabel, isTrackedDevice, KIND_HEADSET, KIND_HEADPHONES} from '../src/logic.js';

let failed = 0, passed = 0;
function eq(name, actual, expected) {
    if (actual === expected) {
        passed++;
    } else {
        failed++;
        printerr(`FAIL ${name}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
    }
}
const dev = (kind, percentage, is_present = true) => ({kind, percentage, is_present});
const BATTERY = 2, MOUSE = 5, LINE_POWER = 1;

// Enum values we hardcode must match the installed UPowerGlib.
eq('KIND_HEADSET matches typelib', KIND_HEADSET, UPower.DeviceKind.HEADSET);
eq('KIND_HEADPHONES matches typelib', KIND_HEADPHONES, UPower.DeviceKind.HEADPHONES);

eq('no devices -> hidden', formatLabel([]), null);
eq('laptop battery only -> hidden', formatLabel([dev(BATTERY, 100)]), null);
eq('mouse ignored', formatLabel([dev(MOUSE, 70)]), null);
eq('ac adapter ignored', formatLabel([dev(LINE_POWER, 0, false)]), null);
eq('headset shown', formatLabel([dev(BATTERY, 100), dev(KIND_HEADSET, 50)]), '50%');
eq('headphones shown', formatLabel([dev(KIND_HEADPHONES, 80)]), '80%');
eq('rounds fractional', formatLabel([dev(KIND_HEADSET, 49.6)]), '50%');
eq('two headsets joined', formatLabel([dev(KIND_HEADSET, 50), dev(KIND_HEADPHONES, 80)]), '50% · 80%');
eq('not present -> hidden', formatLabel([dev(KIND_HEADSET, 50, false)]), null);
eq('0% (unknown) -> hidden', formatLabel([dev(KIND_HEADSET, 0)]), null);
eq('NaN -> hidden', formatLabel([dev(KIND_HEADSET, NaN)]), null);
eq('isTrackedDevice headset', isTrackedDevice(dev(KIND_HEADSET, 1)), true);
eq('100% shown', formatLabel([dev(KIND_HEADSET, 100)]), '100%');

// Live: real UPower devices go through the same code path the extension uses.
const live = UPower.Client.new_full(null).get_devices();
const liveLabel = formatLabel(live);
const headsets = live.filter(isTrackedDevice);
if (headsets.length) {
    const expected = headsets.map(d => `${Math.round(d.percentage)}%`).join(' · ');
    eq('live UPower headset', liveLabel, expected);
    print(`live: ${headsets.map(d => d.model).join(', ')} -> "${liveLabel}"`);
} else {
    print('live: no headset connected, live check skipped');
}

print(`${passed} passed, ${failed} failed`);
if (failed)
    imports.system.exit(1);
