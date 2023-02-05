// Copyright © 2022, Corsair Memory Inc. All rights reserved.

/* Filter Visibility Action

Toggles the enabled state of a filter.

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
const ESourceMediaAction_PlayPause = "play_pause";
const ESourceMediaAction_PlayStop = "play_stop";
const ESourceMediaAction_PlayRestart = "play_restart";
const ESourceMediaAction_Stop = "stop";

class SourceMediaAction extends IAction {
	// ---------------------------------------------------------------------------------------------- //
	// Statics
	// ---------------------------------------------------------------------------------------------- //

	// Should be static to the SourceMediaAction class.
	static MediaStatus = {
		Active: [EOBSSourceMediaStatus.Playing, EOBSSourceMediaAction.Opening, EOBSSourceMediaStatus.Buffering, EOBSSourceMediaStatus.Paused],
		Playing: [EOBSSourceMediaStatus.Playing, EOBSSourceMediaAction.Opening, EOBSSourceMediaStatus.Buffering],
		Paused: [EOBSSourceMediaStatus.Paused],
		Stopped: [EOBSSourceMediaStatus.None, EOBSSourceMediaStatus.Stopped, EOBSSourceMediaStatus.Ended, EOBSSourceMediaStatus.Error],
	};

	// ---------------------------------------------------------------------------------------------- //
	// Dynamics
	// ---------------------------------------------------------------------------------------------- //

	constructor(controller) {
		super(controller, "com.elgato.obsstudio.source.media");

		// Action States
		this.registerNamedState("active", 0);
		this.registerNamedState("inactive", 1);
		this.registerNamedState(EOBSSourceMediaAction.Play, 0); // Replaces "active"
		this.registerNamedState(EOBSSourceMediaAction.Pause, 1); // Replaces "inactive"
		this.registerNamedState(EOBSSourceMediaAction.Stop, 2);
		this.registerNamedState(EOBSSourceMediaAction.Restart, 3);

		// APIs
		this._api_source = this.obs.source_api;

		{ // RPC
			this.addEventListener("rpc.settings", (event) => {
				this._on_rpc_settings(event);
			});
			this.addEventListener("rpc.source.filters", (event) => {
				this._on_rpc_source(event);
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
			this.obs.addEventListener("obs.source.event.media", (event) => {
				this._on_obs_source_event_media(event);
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
			// Ignore any context that is inside of a multi-action.
			if (this.status(context).isInMultiAction === true) {
				return;
			}

			// Disable the item if OBS is not connected.
			if (!this.obs.connected()) {
				this.setState(context, "inactive");
				return;
			}

			let settings = this.settings(context);

			// Check if the source exists.
			let source = this._api_source.sources.get(settings.source);
			if (source === undefined) {
				this.setState(context, "inactive");
				return;
			}

			// Update Status
			switch (settings.action) {
			case ESourceMediaAction_PlayPause:
				if (SourceMediaAction.MediaStatus.Playing.includes(source.media_state.status)) {
					this.setState(context, "active");
				} else {
					this.setState(context, "inactive");
				}
				break;
			case ESourceMediaAction_PlayStop:
				if (SourceMediaAction.MediaStatus.Playing.includes(source.media_state.status)) {
					this.setState(context, "active");
				} else {
					this.setState(context, "inactive");
				}
				break;
			case ESourceMediaAction_PlayRestart:
				if (SourceMediaAction.MediaStatus.Playing.includes(source.media_state.status)) {
					this.setState(context, "active");
				} else {
					this.setState(context, "inactive");
				}
				break;
			case ESourceMediaAction_Stop:
				if (SourceMediaAction.MediaStatus.Playing.includes(source.media_state.status)) {
					this.setState(context, "active");
				} else {
					this.setState(context, "inactive");
				}
				break;
			}
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
		// Try to migrate any old settings to the new layout.
		this._migrate_settings(settings);

		// Apply default settings to any missing entries.
		this._default_settings(settings);

		// Store the settings to Stream deck.
		this.settings(context, settings);

		// Refresh the context.
		this.refresh(context);

		// Update the open inspector if it is for this action.
		if (this.inspector == context) {
			this.notify(this.inspector, "settings", settings);
			this._inspector_refresh();
		}

		// If not in a multi-action, update button images.
		if (this.status(context).isInMultiAction !== true) {
			switch (settings.action) {
			case ESourceMediaAction_PlayPause:
				this.setImage(context, "active", resources["./actions/source.media/pause-on.svg"]);
				this.setImage(context, "inactive", resources["./actions/source.media/play-off.svg"]);
				break;
			case ESourceMediaAction_PlayStop:
				this.setImage(context, "active", resources["./actions/source.media/stop-on.svg"]);
				this.setImage(context, "inactive", resources["./actions/source.media/play-off.svg"]);
				break;
			case ESourceMediaAction_PlayRestart:
				this.setImage(context, "active", resources["./actions/source.media/start-on.svg"]);
				this.setImage(context, "inactive", resources["./actions/source.media/play-off.svg"]);
				break;
			case ESourceMediaAction_Stop:
				this.setImage(context, "active", resources["./actions/source.media/stop-on.svg"]);
				this.setImage(context, "inactive", resources["./actions/source.media/stop-off.svg"]);
				break;
			}
		}
	}

	/** Migrate settings from older versions to newer versions.
	 *
	 */
	_migrate_settings(settings) {
		// No settings to migrate
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
				if (source[1].output_flags.get("controllable_media")) {
					settings.source = source[1].name;
					break;
				}
			}
		}

		if ((settings.action === undefined) || (typeof (settings.action) !== "string")) {
			settings.action = "play_stop";
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
			this.notify(this.inspector, "open");
			this._inspector_refresh_sources();
		} else {
			// OBS Studio is currently not available.
			this.notify(this.inspector, "close");
		}
	}

	_inspector_refresh_sources() {
		if (!this.inspector) return;

		// Generate a list of sources which has filters.
		let sources = [];
		for (let source of this._api_source.sources) {
			if (!source[1].output_flags.get("controllable_media")) {
				continue;
			}

			sources.push(source[0]);
		}

		this.notify(this.inspector, "sources", {
			"list": sources
		});
	}

	// ---------------------------------------------------------------------------------------------- //
	// Listeners
	// ---------------------------------------------------------------------------------------------- //

	_on_willAppear(ev) {
		ev.preventDefault();
		let settings = this.settings(ev.context);
		settings.isInMultiAction = ev.data.payload.isInMultiAction ? true : false;
		this._apply_settings(ev.context, settings);
	}

	_on_propertyInspectorDidAppear(ev) {
		ev.preventDefault();
		this._inspector_refresh();
	}

	async _on_pressed(ev) {
		ev.preventDefault();

		try {
			console.log("Pressed: ", ev)
			let settings = this.settings(ev.context);

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

			// Convert settings/state into a proper command to OBS.
			let media_action = EOBSSourceMediaAction.Stop;
			let media_status = [];
			let media_promise = undefined;
			if (ev.data.payload.isInMultiAction === true) {
				media_action = this.translateStateIdToName(ev.data.payload.userDesiredState);
			} else {
				if (SourceMediaAction.MediaStatus.Paused.includes(source.media_state.status)) {
					if (settings.action === ESourceMediaAction_Stop) {
						media_action = EOBSSourceMediaAction.Stop;
					} else {
						media_action = EOBSSourceMediaAction.Play;
					}
				} else if (SourceMediaAction.MediaStatus.Playing.includes(source.media_state.status)) {
					if (settings.action === ESourceMediaAction_PlayPause) {
						media_action = EOBSSourceMediaAction.Pause;
					} else if (settings.action === ESourceMediaAction_PlayRestart) {
						media_action = EOBSSourceMediaAction.Restart;
					} else {
						media_action = EOBSSourceMediaAction.Stop;
					}
				} else {
					if (settings.action === ESourceMediaAction_Stop) {
						media_action = EOBSSourceMediaAction.Stop;
					} else {
						media_action = EOBSSourceMediaAction.Restart;
					}
				}
			}
			switch (media_action) {
			case EOBSSourceMediaAction.Stop:
				media_status = SourceMediaAction.MediaStatus.Stopped;
				media_promise = source.control_media(EOBSSourceMediaAction.Stop);
				break;
			case EOBSSourceMediaAction.Play:
				media_status = SourceMediaAction.MediaStatus.Playing;
				// For better user-experience, it's better to have Play behave like Restart when
				// when the media source has not started playback or was stopped. Otherwise Play
				// only allows unpausing the media source, which is not what people expect.
				if ([EOBSSourceMediaStatus.Paused, EOBSSourceMediaStatus.Playing, EOBSSourceMediaStatus.Opening, EOBSSourceMediaStatus.Buffering].includes(source.media_state.status)) {
					media_promise = source.control_media(EOBSSourceMediaAction.Play);
				} else {
					media_promise = source.control_media(EOBSSourceMediaAction.Restart);
				}
				break;
			case EOBSSourceMediaAction.Pause:
				media_status = SourceMediaAction.MediaStatus.Paused;
				media_promise = source.control_media(EOBSSourceMediaAction.Pause);
				break;
			case EOBSSourceMediaAction.Restart:
				media_status = SourceMediaAction.MediaStatus.Playing;
				media_promise = source.control_media(EOBSSourceMediaAction.Restart);
				break;
			}

			// If everything went well, try and update the state.
			await media_promise;
			if (!media_status.includes(source.media_state.status)) {
				if (config.status)
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

	_on_obs_source_event_media(ev) {
		ev.preventDefault();
		this.refresh();
	}

	async _on_rpc_source(ev) {
		ev.preventDefault();

		// 1. Check if we are connected with OBS Studio.
		if (!this.obs.connected()) {
			// If not, send an error
			let err = JSONRPCError(EJSONRPCERROR_INTERNAL_ERROR, "Disconnected from OBS Studio.".lox());
			this.reply(this.inspector, rpc.id(), undefined, err.compile());
			return;
		}

		//
		this._inspector_refresh_filters();

		// Reply to call
		let reply = new JSONRPCResponse();
		reply.result(true);
		this.reply(ev.extra[0].context, ev.data.id(), reply.compile());
	}

	_on_rpc_settings(ev) {
		ev.preventDefault();
		let settings = ev.data.parameters();
		this._apply_settings(this.inspector, settings);
	}
}
