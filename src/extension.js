import GObject from 'gi://GObject';
import St from 'gi://St';
import Clutter from 'gi://Clutter';
import UPower from 'gi://UPowerGlib';

import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';

import {formatLabel} from './logic.js';

const Indicator = GObject.registerClass(
class HeadsetBatteryIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, 'Headset Battery', true /* no menu */);
        this.reactive = false;

        const box = new St.BoxLayout({style_class: 'panel-status-indicators-box'});
        box.add_child(new St.Icon({
            icon_name: 'audio-headphones-symbolic',
            style_class: 'system-status-icon',
        }));
        this._label = new St.Label({y_align: Clutter.ActorAlign.CENTER});
        box.add_child(this._label);
        this.add_child(box);
        this.visible = false;

        this._client = null;
        this._deviceSignals = new Map(); // object path -> [device, [signal ids]]
        this._cancelled = false;

        UPower.Client.new_async(null, (_src, res) => {
            if (this._cancelled)
                return;
            try {
                this._client = UPower.Client.new_finish(res);
            } catch (e) {
                console.error(`[headset-battery] UPower unavailable: ${e.message}`);
                return;
            }
            this._clientSignals = [
                this._client.connect('device-added', (_c, dev) => {
                    this._watch(dev);
                    this._sync();
                }),
                this._client.connect('device-removed', (_c, path) => {
                    this._unwatch(path);
                    this._sync();
                }),
            ];
            for (const dev of this._client.get_devices())
                this._watch(dev);
            this._sync();
        });
    }

    _watch(dev) {
        const path = dev.get_object_path();
        if (this._deviceSignals.has(path))
            return;
        const ids = ['notify::percentage', 'notify::is-present', 'notify::kind']
            .map(sig => dev.connect(sig, () => this._sync()));
        this._deviceSignals.set(path, [dev, ids]);
    }

    _unwatch(path) {
        const entry = this._deviceSignals.get(path);
        if (!entry)
            return;
        const [dev, ids] = entry;
        ids.forEach(id => dev.disconnect(id));
        this._deviceSignals.delete(path);
    }

    _sync() {
        const devices = [...this._deviceSignals.values()].map(([d]) => d);
        const text = formatLabel(devices);
        this.visible = text !== null;
        this._label.text = text ?? '';
    }

    destroy() {
        this._cancelled = true;
        for (const path of [...this._deviceSignals.keys()])
            this._unwatch(path);
        if (this._client && this._clientSignals)
            this._clientSignals.forEach(id => this._client.disconnect(id));
        this._client = null;
        super.destroy();
    }
});

export default class HeadsetBatteryExtension extends Extension {
    enable() {
        this._indicator = new Indicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator, 0, 'right');
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}
