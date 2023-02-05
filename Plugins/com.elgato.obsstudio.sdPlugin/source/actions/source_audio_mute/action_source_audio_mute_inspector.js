// Copyright © 2022, Corsair Memory Inc. All rights reserved.

class SourceAudioMuteInspector extends IInspector {
	constructor(uPort, uUUID, uEvent, uInfo, uActionInfo) {
		super(uPort, uUUID, uEvent, uInfo, uActionInfo);

		this._els = {
			source: document.querySelector("#source"),
			sources: document.querySelector("#source .sdpi-item-value"),
		};
		this._settings = {};
		this._have_settings = false;
		this._have_obs = false;
		this._have_sources = false;

		this._els.sources.addEventListener("change", (event) => {
			this._on_source_changed(event); 
		});

		this.addEventListener("rpc.settings", (event) => {
			this._on_rpc_settings(event); 
		});
		this.addEventListener("rpc.close", (event) => {
			this._on_rpc_close(event); 
		});
		this.addEventListener("rpc.open", (event) => {
			this._on_rpc_open(event); 
		});
		this.addEventListener("rpc.sources", (event) => {
			this._on_rpc_sources(event); 
		});

		this.sources_reset();
		this.validate();
	}

	// ---------------------------------------------------------------------------------------------- //
	// Functions
	// ---------------------------------------------------------------------------------------------- //

	validate() {
		if (!this._have_obs) {
			this.show_processing_overlay("Waiting for OBS...".lox());
		} else if (!this._have_settings) {
			this.show_processing_overlay("Waiting for settings...".lox());
		} else if (!this._have_sources) {
			this.show_processing_overlay("Waiting for sources...".lox());
		} else {
			this.hide_overlays();
		}
	}

	apply_settings() {
		this._els.sources.value = this._settings.source;
	}

	sources_clear() {
		while (this._els.sources.firstElementChild) {
			this._els.sources.removeChild(this._els.sources.firstElementChild);
		}
	}

	sources_add(name, value, disabled = false, selected = false) {
		let e = document.createElement("option");
		e.textContent = name;
		e.value = value;
		e.disabled = disabled;
		e.selected = selected;
		this._els.sources.appendChild(e);
	}

	sources_reset() {
		this.sources_clear();
		if (this._settings.source !== undefined) {
			this.sources_add(`[${this._settings.source}]`, this._settings.source, true, true);
		}
		this.apply_settings();
	}

	sources_update(data) {
		this.sources_clear();

		// data.list holds an ordered Object, which needs to be converted to an array.
		let sources = data.list;

		// Does the set contain the selected?
		if (!sources.includes(this._settings.source)) {
			// If not add it as a special unselectable entry.
			if (this._settings.source !== undefined) {
				this.sources_add(`[${this._settings.source}]`, this._settings.source, true, true);
			}
		}

		// Add all to the list.
		for (let source of sources) {
			this.sources_add(source, source, false);
		}

		// Re-apply settings to elements.
		this.apply_settings();
	}

	// ---------------------------------------------------------------------------------------------- //
	// RPC
	// ---------------------------------------------------------------------------------------------- //
	_on_rpc_settings(event) {
		event.preventDefault();
		let params = event.data.parameters();
		if (params) {
			this._settings = params;
			this._have_settings = true;
			this.apply_settings();
		} else {
			throw Error("Missing parameters");
		}
	}

	_on_rpc_close(event) {
		event.preventDefault();
		this._have_obs = false;
		this.validate();
	}

	_on_rpc_open(event) {
		event.preventDefault();
		this._have_obs = true;
		this._have_sources = false;
		this.sources_reset();
		this.validate();
	}

	_on_rpc_sources(event) {
		event.preventDefault();
		this._have_sources = true;
		this.sources_update(event.data.parameters());
		this.validate();
	}

	_on_source_changed(event) {
		this._settings.source = event.target.value;
		this.notify("settings", this._settings);
	}
}

let instance = null;
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo, inActionInfo) {
	try {
		instance = new SourceAudioMuteInspector(inPort, inPluginUUID, inRegisterEvent, JSON.parseEx(inInfo), JSON.parseEx(inActionInfo));
	} catch (ex) {
		console.error(ex, ex.stack);
	}
}
