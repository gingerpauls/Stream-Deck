// Copyright © 2022, Corsair Memory Inc. All rights reserved.

class RecordInspector extends IInspector {
	constructor(uPort, uUUID, uEvent, uInfo, uActionInfo) {
		super(uPort, uUUID, uEvent, uInfo, uActionInfo);

		this._els = {
			longpress: document.querySelector("#longpress"),
			longpressbox: document.querySelector("#longpressbox")
		};
		this._settings = {};
		this._have_settings = false;
		this._have_obs = false;

		this._els.longpress.addEventListener("change", (event) => {
			this._on_longpress_change(event); 
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

		this.validate();
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
			throw Error("Missing parameters".lox());
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
		this.validate();
	}

	// ---------------------------------------------------------------------------------------------- //
	// Internals
	// ---------------------------------------------------------------------------------------------- //
	validate() {
		if (!this._have_obs) {
			this.show_processing_overlay("Waiting for OBS...".lox());
		} else {
			this.hide_overlays();
		}
	}

	apply_settings() {
		if (this._settings.isInMultiAction === true) {
			this._els.longpress.style.setProperty("display", "none");
			this._els.longpressbox.checked = false;
		} else {
			this._els.longpressbox.checked = (this._settings.longpress == true);
			this._els.longpress.style.removeProperty("display");
		}
	}

	_on_longpress_change(event) {
		this._settings.longpress = event.target.checked;
		this.notify("settings", this._settings);
	}
}

let instance = null;
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo, inActionInfo) {
	try {
		instance = new RecordInspector(inPort, inPluginUUID, inRegisterEvent, JSON.parseEx(inInfo), JSON.parseEx(inActionInfo));
	} catch (ex) {
		console.error(ex, ex.stack);
	}
}
