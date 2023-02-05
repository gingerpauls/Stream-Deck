// Copyright © 2022, Corsair Memory Inc. All rights reserved.

class RecordPauseInspector extends IInspector {
	constructor(uPort, uUUID, uEvent, uInfo, uActionInfo) {
		super(uPort, uUUID, uEvent, uInfo, uActionInfo);

		this._have_obs = false;
		this._is_recording = false;

		this.addEventListener("rpc.close", (event) => {
			this._on_rpc_close(event); 
		});
		this.addEventListener("rpc.open", (event) => {
			this._on_rpc_open(event); 
		});
		this.addEventListener("rpc.recording", (event) => {
			this._on_rpc_recording(event); 
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

	_on_rpc_recording(event) {
		event.preventDefault();
		this._is_recording = event.data.parameters().active;
		this.validate();
	}

	// ---------------------------------------------------------------------------------------------- //
	// Internals
	// ---------------------------------------------------------------------------------------------- //
	validate() {
		this.clear_messages();
		this.hide_overlays();

		if (!this._have_obs) {
			this.show_processing_overlay("Waiting for OBS...".lox());
		}

		if (!this._is_recording) {
			this.add_hint("To pause a recording start recording first.".lox());
		}
	}
}

let instance = null;
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo, inActionInfo) {
	try {
		instance = new RecordPauseInspector(inPort, inPluginUUID, inRegisterEvent, JSON.parseEx(inInfo), JSON.parseEx(inActionInfo));
	} catch (ex) {
		console.error(ex, ex.stack);
	}
}
