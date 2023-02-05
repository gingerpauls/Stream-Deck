// Copyright © 2022, Corsair Memory Inc. All rights reserved.

class TransitionStudioInspector extends IInspector {
	constructor(uPort, uUUID, uEvent, uInfo, uActionInfo) {
		super(uPort, uUUID, uEvent, uInfo, uActionInfo);

		this._have_obs = false;

		this.addEventListener("rpc.close", (event) => {
			this._on_rpc_close(event); 
		});
		this.addEventListener("rpc.open", (event) => {
			this._on_rpc_open(event); 
		});
	}

	// ---------------------------------------------------------------------------------------------- //
	// RPC
	// ---------------------------------------------------------------------------------------------- //
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
}

let instance = null;
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo, inActionInfo) {
	try {
		instance = new TransitionStudioInspector(inPort, inPluginUUID, inRegisterEvent, JSON.parseEx(inInfo), JSON.parseEx(inActionInfo));
	} catch (ex) {
		console.error(ex, ex.stack);
	}
}
