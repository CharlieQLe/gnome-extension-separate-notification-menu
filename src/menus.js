"use strict";
const { Clutter, Gio, GObject, St } = imports.gi;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const DateMenu = Main.panel.statusArea.dateMenu;

class ParentChild {
    constructor(child) {
        this.child = child;
        this.parent = child.get_parent();
    }
}

const IndicatorPC = new ParentChild(DateMenu._indicator);
const MessageListPC = new ParentChild(DateMenu._messageList);
const Width = MessageListPC.child.width;

let mediaMenu = null;
let notificationMenu = null;

const BaseMenu = class extends PanelMenu.Button {
    static {
        GObject.registerClass(this);
    }

    _init(section, iconName, index) {
        super._init(0);
        this._index = index;

        // Set the icon
        this._icon = new St.Icon({
            icon_name: iconName,
            style_class: "system-status-icon",
        });
        this.add_child(this._icon);

        // Get the section's parent-child and its list
        this._sectionPC = new ParentChild(section);
        this._list = this._sectionPC.child._list;

        // Create a scrollview
        this._scrollView = new St.ScrollView({
            hscrollbar_policy: St.PolicyType.NEVER,
            vscrollbar_policy: St.PolicyType.AUTOMATIC,
            style: "margin-top: 8px; margin-left: 8px; margin-bottom: 8px;",
        });
        this.menu.box.add_child(this._scrollView);
        const width = Width / St.ThemeContext.get_for_stage(global.stage).scale_factor;
        this.menu.box.style = `max-height: 512px; min-width: ${width}px; max-width: ${width}px;`;

        // Create a box
        this._box = new St.BoxLayout({
            vertical: true,
        });
        this._scrollView.add_actor(this._box);

        // Move the section
        this._sectionPC.parent.remove_child(this._sectionPC.child);
        this._box.add_child(this._sectionPC.child);
        
        // Connect signals
        this._signals = new Map([
            [this._list, [
                this._list.connect("actor-added", this._sync.bind(this)),
                this._list.connect("actor-removed", this._sync.bind(this)),
            ]],
        ]);
        
        // Sync
        this._sync();
    }

    _sync() {
        this.visible = this._list.get_children().length > 0;
    }

    cleanup() {
        // Disconnect all signals
        this._signals.forEach((signalIds, source) => signalIds.forEach(id => source.disconnect(id)));

        // Move section back to its original parent
        this._box.remove_child(this._sectionPC.child);
        this._sectionPC.parent.insert_child_at_index(this._sectionPC.child, this._index);

        // Destroy self
        this.destroy();
    }
}

const MediaMenu = class extends BaseMenu {
    static {
        GObject.registerClass(this);
    }

    _init() {
        super._init(MessageListPC.child._mediaSection, "emblem-music-symbolic", 0);
    }
}

const NotificationMenu = class extends BaseMenu {
    static DEFAULT_ICON_NAME = "preferences-system-notifications-symbolic";
    static DISABLED_ICON_NAME = "notifications-disabled-symbolic";
    
    static {
        GObject.registerClass(this);
    }

    _init() {
        this._settings = Gio.Settings.new("org.gnome.desktop.notifications");
        super._init(MessageListPC.child._notificationSection, this.iconName, 1);

        this._settings.connect("changed::show-banners", this._onNotificationBannerChanged.bind(this));

        // Clear button
        this._clearBtn = new St.Button({
            label: "Clear",
            can_focus: true,
            x_align: Clutter.ActorAlign.CENTER,
            style: "margin-top: 6px; margin-bottom: 12px;",
        });
        this._clearBtn.add_style_class_name("message-list-clear-button");
        this._clearBtn.add_style_class_name("button");
        log(`Clear style: ${this._clearBtn.get_style_class_name()}`);
        this.menu.box.add_child(this._clearBtn);
        this._clearBtn.connect("clicked", () => this._sectionPC.child.clear());
        this._clearBtn.visible = this._list.get_children().length > 1;
    }

    get iconName() {
        return this._settings.get_boolean("show-banners") ? NotificationMenu.DEFAULT_ICON_NAME : NotificationMenu.DISABLED_ICON_NAME;
    }

    _sync() {
        if (this._clearBtn) this._clearBtn.visible = this._list.get_children().length > 1;
        super._sync();
    }

    _onNotificationBannerChanged() {
        this._icon.set_icon_name(this.iconName);
    }
}

function initialize() {
    // Set DateMenu box padding
    DateMenu.menu.box.style = "padding: 4px 6px 6px 0px;";

    // Remove DND indicator
    IndicatorPC.parent.remove_child(IndicatorPC.child);

    // Remove message list
    MessageListPC.parent.remove_child(MessageListPC.child);    

    // Add media menu
    mediaMenu = new MediaMenu();
    Main.panel.addToStatusArea("mediaMenu", mediaMenu, 1);

    // Add notification menu
    notificationMenu = new NotificationMenu();
    Main.panel.addToStatusArea("notificationMenu", notificationMenu, 2);
}

function cleanup() {
    // Add message list
    MessageListPC.parent.insert_child_at_index(MessageListPC.child, 0);

    // Add dnd indicator
    IndicatorPC.parent.add_child(IndicatorPC.child);
        
    // Undo padding
    DateMenu.menu.box.style = null;
    
    // Cleanup menus
    if (mediaMenu) {
        mediaMenu.cleanup();
        mediaMenu = null;
    }
    if (notificationMenu) {
        notificationMenu.cleanup();
        notificationMenu = null;
    }
}
