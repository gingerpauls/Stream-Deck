// Copyright © 2022, Corsair Memory Inc. All rights reserved.

class ScreenshotInspector extends IInspector {
	constructor(uPort, uUUID, uEvent, uInfo, uActionInfo) {
		super(uPort, uUUID, uEvent, uInfo, uActionInfo);

		this._els = {
		};
		this._settings = {};
		this._have_settings = false;
		this._have_obs = false;

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
	}

	// ---------------------------------------------------------------------------------------------- //
	// Functions
	// ---------------------------------------------------------------------------------------------- //

	validate() {
		if (!this._have_obs) {
			this.show_processing_overlay("Waiting for OBS...".lox());
		} else if (!this._have_settings) {
			this.show_processing_overlay("Waiting for settings...".lox());
		} else {
			this.hide_overlays();
		}
	}

	apply_settings() {
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
		this.validate();
	}
}

let instance = null;
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo, inActionInfo) {
	try {
		instance = new ScreenshotInspector(inPort, inPluginUUID, inRegisterEvent, JSON.parseEx(inInfo), JSON.parseEx(inActionInfo));
	} catch (ex) {
		console.error(ex, ex.stack);
	}
}
