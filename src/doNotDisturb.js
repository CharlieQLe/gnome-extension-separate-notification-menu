const { Gio, GObject, St } = imports.gi;
const QuickSettings = imports.ui.quickSettings;
const QuickSettingsMenu = imports.ui.main.panel.statusArea.quickSettings;

const DndQuickToggle = class extends QuickSettings.QuickToggle {
    static {
        GObject.registerClass(this);
    }

    _init() {
        super._init({
            title: "Do Not Disturb",
            iconName: "notifications-disabled-symbolic"
        });
        this._settings = Gio.Settings.new("org.gnome.desktop.notifications");
        this._settings.connect("changed::show-banners", this._update.bind(this));
        this.connect("destroy", () => this._settings.run_dispose());
        this.connect("clicked", () => this._settings.set_boolean("show-banners", !this._settings.get_boolean("show-banners")));
        this._update();
    }

    _update() {
        const checked = !this._settings.get_boolean("show-banners");
        if (this.checked !== checked) this.set({ checked });
    }
}

var DndIndicator = class extends QuickSettings.SystemIndicator {
    static {
        GObject.registerClass(this);
    }

    _init() {
        super._init();
        this._indicator = this._addIndicator();
        this._indicator.icon_name = "notifications-disabled-symbolic";
        this.quickSettingsItems.push(new DndQuickToggle());
        this._settings = Gio.Settings.new("org.gnome.desktop.notifications");
        this._settings.connect("changed::show-banners", this._update.bind(this));
        this.connect("destroy", () => {
            this.quickSettingsItems.forEach(item => item.destroy());
            this._settings.run_dispose();
        });
        QuickSettingsMenu._indicators.insert_child_at_index(this, 0);
        QuickSettingsMenu._addItems(this.quickSettingsItems);
        this.quickSettingsItems.forEach(item => QuickSettingsMenu.menu._grid.set_child_below_sibling(item, QuickSettingsMenu._backgroundApps.quickSettingsItems[0]));
        this._update();
    }

    _update() {
        this._indicator.visible = !this._settings.get_boolean("show-banners");
    }
}
