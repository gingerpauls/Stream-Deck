// Copyright © 2022, Corsair Memory Inc. All rights reserved.

class ReplayBufferSaveInspector extends IInspector {
	constructor(uPort, uUUID, uEvent, uInfo, uActionInfo) {
		super(uPort, uUUID, uEvent, uInfo, uActionInfo);

		this._have_obs = false;
		this._have_replaybuffer = false;
		this._is_rb_active = false;

		this.addEventListener("rpc.close", (event) => {
			this._on_rpc_close(event); 
		});
		this.addEventListener("rpc.open", (event) => {
			this._on_rpc_open(event); 
		});
		this.addEventListener("rpc.replaybuffer", (event) => {
			this._on_rpc_replaybuffer(event); 
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

	_on_rpc_replaybuffer(event) {
		event.preventDefault();
		this._have_replaybuffer = event.data.parameters().enabled;
		this._is_rb_active = event.data.parameters().active;
		this.validate();
	}

	// ---------------------------------------------------------------------------------------------- //
	// Internals
	// ---------------------------------------------------------------------------------------------- //
	validate() {
		this.hide_overlays();
		this.clear_messages();

		if (!this._have_obs) {
			this.show_processing_overlay("Waiting for OBS...".lox());
		}

		if (!this._have_replaybuffer) {
			this.add_warning("Replay Buffer is not enabled!".lox());
		} else if (!this._is_rb_active) {
			this.add_hint("Replay Buffer must be started for saving to work.".lox());
		}
	}
}

let instance = null;
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo, inActionInfo) {
	try {
		instance = new ReplayBufferSaveInspector(inPort, inPluginUUID, inRegisterEvent, JSON.parseEx(inInfo), JSON.parseEx(inActionInfo));
	} catch (ex) {
		console.error(ex, ex.stack);
	}
}
