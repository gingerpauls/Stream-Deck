// Copyright © 2022, Corsair Memory Inc. All rights reserved.

/* Audio Mixer Action

Toggles the mute state of the configured audio source.

State:
- Enabled/On if the configured source is unmuted.
- Disabled/Off if the configured source is muted.

State Progression:
- Pressed:
	1. If we are not connected to OBS, show error.
	2. If the source is muted, unmute and turn button "On".
	3. In all other cases, mute the source and turn button "Off".
- obs.source.event.mute:
	1. If the source is muted, turn button "Off".
	2. If the source is unmuted, turn button "On".
- Refresh:
	1. If OBS is not connected, turn button "Off".
	2. If the source does not exist, turn button "Off".
	3. If the source is muted, turn button "Off".
	4. If the source is unmuted, turn button "On".

States:
- EActionOn: OBS is connected, Source exists, and Source is unmuted.
- EActionOff: OBS is disconnected, Source doesn't exist, or Source is unmuted.
*/

class SourceAudioMuteAction extends IAction {
	constructor(controller) {
		super(controller, "com.elgato.obsstudio.mixeraudio");

		// APIs
		this._api_source = this.obs.source_api;

		{ // RPC
			this.addEventListener("rpc.settings", (event) => {
				this._on_rpc_settings(event); 
			});
		}

		{ // Listeners
			// Stream Deck
			this.addEventListener("willAppear", (event) => {
				this._on_willAppear(event); 
			});
			this.addEventListener("propertyInspectorDidAppear", (event) => {
				this._on_propertyInspectorDidAppear(event); 
			});
			this.addEventListener("keyDown", (event) => {
				this._on_pressed(event); 
			});
			this.addEventListener("keyUp", (event) => {
				this._on_released(event); 
			});

			// OBS
			this.obs.addEventListener("open", (event) => {
				this._on_obs_open(event); 
			});
			this.obs.addEventListener("close", (event) => {
				this._on_obs_close(event); 
			});
			this.obs.addEventListener("obs.source.event.state", (event) => {
				this._on_obs_source_event_state(event); 
			});

			// Source API
			this._api_source.addEventListener("sources", (event) => {
				this._on_sources_changed(event); 
			});
		}
	}

	// ---------------------------------------------------------------------------------------------- //
	// Accessors
	// ---------------------------------------------------------------------------------------------- //

	// ---------------------------------------------------------------------------------------------- //
	// Functions
	// ---------------------------------------------------------------------------------------------- //

	/** Refresh the status of a specific context, or all contexts if none specified.
	 *
	 * @param {any} context The context to refresh, or undefined if refreshing all contexts.
	 */
	refresh(context) {
		if (context !== undefined) {
			let settings = this.settings(context);

			// Disable the item if OBS is not connected.
			if (!this.obs.connected()) {
				this.setState(context, EActionStateOff);
				return;
			}

			// Check if the source exists.
			let source = this._api_source.sources.get(settings.source);
			if (source === undefined) {
				this.setState(context, EActionStateOff);
				return;
			}

			// Update context according to current mute status.
			this.setState(context, source.audio_state.muted ? EActionStateOff : EActionStateOn);
		} else {
			// Refresh all contexts.
			for (let ctx of this.contexts.keys()) {
				this.refresh(ctx);
			}
		}
	}

	/** Apply and store settings to a context.
	 *
	 */
	_apply_settings(context, settings) {
		// 1. Try to migrate any old settings to the new layout.
		this._migrate_settings(settings);

		// 2. Apply default settings to any missing entries.
		this._default_settings(settings);

		// 3. Store the settings to Stream deck.
		this.settings(context, settings);

		// 4. Refresh the context.
		this.refresh(context);

		// 5. Update the open inspector if it is for this action.
		if (this.inspector == context) {
			this.notify(this.inspector, "settings", settings);
		}
	}

	/** Migrate settings from older versions to newer versions.
	 *
	 */
	_migrate_settings(settings) {
		// Migrate required information over to the new settings.

		let collection = "";
		if (typeof (settings.sceneCollection) !== "undefined") {
			collection = String(settings.sceneCollection);
			delete settings.sceneCollection;
		}

		if (typeof (settings.sceneId) !== "undefined") {
			delete settings.sceneId;
		}

		if (typeof (settings.sceneItemId) !== "undefined") {
			delete settings.sceneItemId;
		}

		if (typeof (settings.sourceId) !== "undefined") {
			settings.source = String(settings.sourceId);
			delete settings.sourceId;
			if (settings.source == "") {
				delete settings.source;
			}

			// Strip collection name from scene.
			if (settings.source.startsWith(collection)) {
				settings.source = settings.source.substring(collection.length);
			}
		}
	}

	/** Apply any default settings that may be necessary.
	 *
	 */
	_default_settings(settings) {
		// Can't do anything if OBS Studio is not connected.
		if (!this.obs.connected()) return;

		if ((settings.source === undefined) || (typeof (settings.source) !== "string")) {
			for (let source of this._api_source.sources) {
				// Find the first proper audio source and set it as the default.
				if (source[1].output_flags.get("audio")) {
					settings.source = source[1].name;
					break;
				}
			}
		}
	}

	_inspector_refresh() {
		// Don't do anything if there is no inspector.
		if (!this.inspector) return;

		// Grab relevant information.
		let context = this.inspector;
		let settings = this.settings(context);

		// Inform about current settings.
		this.notify(this.inspector, "settings", settings);

		// Perform different tasks depending on if OBS is available or not.
		if (this.obs.connected()) {
			// We've restored connection to OBS Studio.
			this.notify(this.inspector, "open");

			// Inform about currently available scenes.
			this._inspector_refresh_sources();
		} else {
			// OBS Studio is currently not available.
			this.notify(this.inspector, "close");
		}
	}

	_inspector_refresh_sources() {
		// Don't do anything if there is no inspector.
		if (!this.inspector) return;

		// Prevent mangling of Source ordering by JSON.stringifyEx.
		let names = [];
		for (let source of this._api_source.sources) {
			// Skip over all sources which do not have any audio output.
			if (source[1].output_flags.get("audio") !== true)
				continue;

			names.push(source[0]);
		}
		names.sort((a, b) => a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }));

		this.notify(this.inspector, "sources", {
			"list": names
		});
	}

	// ---------------------------------------------------------------------------------------------- //
	// Listeners
	// ---------------------------------------------------------------------------------------------- //

	_on_willAppear(ev) {
		ev.preventDefault();
		let settings = this.settings(ev.context);
		this._apply_settings(ev.context, settings);
	}

	_on_propertyInspectorDidAppear(ev) {
		ev.preventDefault();
		this._inspector_refresh();
	}

	async _on_pressed(ev) {
		ev.preventDefault();

		try {
			let settings = this.settings(ev.context);

			// What state does the user want the button to be in?
			let desiredState = false;
			if (ev.data.payload.isInMultiAction == true) {
				desiredState = (ev.data.payload.userDesiredState === EActionStateOff);
			} else {
				desiredState = (ev.data.payload.state === EActionStateOn);
			}

			// Show an alert if OBS Studio is not running or connected.
			if (!this.obs.connected()) {
				// This also automatically reverts the state of the action.
				this.streamdeck.showAlert(ev.context);
				return;
			}

			// Show an alert if the source no longer exists.
			let source = this._api_source.sources.get(settings.source);
			if (source === undefined) {
				this.streamdeck.showAlert(ev.context);
				return;
			}

			// If everything went well, try and update the muted state.
			let result = await source.set_audio_muted(desiredState);
			if (source.audio_state.muted != desiredState) {
				this.streamdeck.showAlert(ev.context);
			} else {
				if (config.status)
					this.streamdeck.showOk(ev.context);
			}
		} catch (ex) {
			this.streamdeck.showAlert(ev.context);
			return;
		}
	}

	_on_released(ev) {
		ev.preventDefault();
	}

	_on_obs_open(ev) {
		ev.preventDefault();
		this.refresh();
		this._inspector_refresh();
	}

	_on_obs_close(ev) {
		ev.preventDefault();
		this.refresh();
		this._inspector_refresh();
	}

	_on_sources_changed(ev) {
		ev.preventDefault();
		this.refresh();
		this._inspector_refresh_sources();
	}

	_on_obs_source_event_state(ev) {
		ev.preventDefault();
		this.refresh();
	}

	_on_rpc_settings(ev) {
		ev.preventDefault();
		let settings = ev.data.parameters();
		this._apply_settings(this.inspector, settings);
	}
}
