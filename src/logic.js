// Pure logic, no GNOME Shell imports, so it can be tested with plain `gjs -m`.

// UPowerGlib.DeviceKind values (stable UPower ABI: up-types.h).
export const KIND_HEADSET = 17;
export const KIND_HEADPHONES = 19;
const AUDIO_KINDS = new Set([KIND_HEADSET, KIND_HEADPHONES]);

/**
 * @param {{kind:number, is_present:boolean, percentage:number}} d
 * @returns {boolean} true if this device's battery should appear in the panel
 */
export function isTrackedDevice(d) {
    return AUDIO_KINDS.has(d.kind) &&
        d.is_present &&
        Number.isFinite(d.percentage) &&
        d.percentage > 0;
}

/**
 * Builds the panel text, e.g. "50%" or "50% · 80%" for two headsets.
 * @returns {string|null} null when nothing should be shown (indicator hidden)
 */
export function formatLabel(devices) {
    const parts = devices
        .filter(isTrackedDevice)
        .map(d => `${Math.round(d.percentage)}%`);
    return parts.length ? parts.join(' · ') : null;
}
