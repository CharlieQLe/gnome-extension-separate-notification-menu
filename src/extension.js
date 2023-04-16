"use strict";

/* extension.js
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License as published by
 * the Free Software Foundation, either version 2 of the License, or
 * (at your option) any later version.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * along with this program.  If not, see <http://www.gnu.org/licenses/>.
 *
 * SPDX-License-Identifier: GPL-2.0-or-later
 */

/* exported init */

const Main = imports.ui.main;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Menus = Me.imports.menus;
const { DndIndicator } = Me.imports.doNotDisturb;

class Extension {
    constructor() {
    }

    enable() {
        Menus.initialize();
        this._dndIndicator = new DndIndicator();
    }

    disable() {
        Menus.cleanup();
        if (this._dndIndicator) {
            this._dndIndicator.destroy();
            this._dndIndicator = null;
        }
    }
}

function init() {
    return new Extension();
}
