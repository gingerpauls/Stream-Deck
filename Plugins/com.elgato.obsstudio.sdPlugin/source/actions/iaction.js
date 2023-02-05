// Copyright © 2022, Corsair Memory Inc. All rights reserved.

const EActionStateOn = 0;
const EActionStateOff = 1;

const EMultiActionStateOff = 1;
const EMultiActionStateOn = 0;

class IAction extends EventTarget {
	constructor(controller, uuid) {
		super();

		// APIs
		this._ctr = controller;
		this._sd = controller.streamdeck;
		this._obs = controller.obs();

		// Status & Data
		this._uuid = uuid; // Unique Class Identifier
		this._contexts = new Map(); // Map of known Contexts and their current Settings.
		this._inspector = null; // Inspector instance.

		// States
		this._states_id_to_name = new Map(); // State Id to Name
		this._states_name_to_id = new Map(); // State Name to Id

		// Listen to events
		this.addEventListener("willAppear", (event) => {
			this.__iaction_on_willAppear(event); 
		}, true);
		this.addEventListener("willDisappear", (event) => {
			this.__iaction_on_willDisappear(event); 
		}, true);
		//this.addEventListener("didReceiveSettings", (event) => { this.__on_didReceiveSettings(event); }, true);
		this.addEventListener("propertyInspectorDidAppear", (event) => {
			this.__iaction_on_propertyInspectorDidAppear(event); 
		}, true);
		this.addEventListener("propertyInspectorDidDisappear", (event) => {
			this.__iaction_on_propertyInspectorDidDisappear(event); 
		}, true);

		// RPC communication between Inspector and Action.
		this._rpc = new RPC("rpc.", this);
		this.rpc.addEventListener("log", (event) => {
			this.__iaction_on_rpc_log(event); 
		});
		this.rpc.addEventListener("send", (event) => {
			this.__iaction_on_rpc_send(event); 
		});
		this.addEventListener("sendToPlugin", (event) => {
			this.__iaction_on_sendToPlugin(event); 
		}, true);
	}

	// ---------------------------------------------------------------------------------------------- //
	// Accessors
	// ---------------------------------------------------------------------------------------------- //

	get controller() {
		return this._ctr;
	}

	get streamdeck() {
		return this._sd;
	}

	get obs() {
		return this._obs;
	}

	/** Unique identifier for this Action class.
	 *
	 */
	get uuid() {
		return this._uuid;
	}

	/** The currently active inspector instance.
	 *
	 * Only one inspector can be active per Action class.
	 *
	 */
	get inspector() {
		return this._inspector;
	}

	/** The RPC instance for the communication between Inspector and Action.
	 *
	 */
	get rpc() {
		return this._rpc;
	}

	/** Map of known contexts and their settings.
	 *
	 */
	get contexts() {
		return new Map(this._contexts);
	}

	// ---------------------------------------------------------------------------------------------- //
	// Functions
	// ---------------------------------------------------------------------------------------------- //

	/** Log a message
	 *
	 */
	log(msg) {
		this.controller.log(`[${this._uuid}] ${msg}`);
	}

	/** Retrieve the read-only status for a given context.
	 *
	 * Note: May create a shallow clone.
	 *
	 *
	 * @param {any} context The context for which to retrieve or store the status.
	 */
	status(context) {
		if (!this._contexts.has(context)) {
			this.log(`Context '${context}' requested status before registration.`);
			this.log(new Error().stack);
			return undefined;
		}

		let o = this._contexts.get(context);
		return o;
	}

	/** Store or retrieve settings for a given context.
	 *
	 * @param {any} context The context for which to retrieve or store the settings.
	 * @param {object} settings An object containing all settings to store. [Optional]
	 * @return {undefined|object} An object if the context is known, otherwise undefined.
	 */
	settings(context, settings = undefined) {
		if (!this._contexts.has(context)) {
			this.log(`Context '${context}' requested settings before registration.`);
			this.log(new Error().stack);
			return undefined;
		}

		let o = this._contexts.get(context);
		if (settings) {
			o.settings = settings;
			this._contexts.set(context, o);
			this.streamdeck.setSettings(context, settings);
		}

		if (o.settings !== undefined) {
			return o.settings;
		}
		return {};
	}

	notify(context, method, parameters = undefined, ...extra) {
		this.rpc.notify(method, parameters, {
			"context": context,
		}, ...extra);
	}

	call(context, method, callback, parameters = undefined, timeout = 10000, ...extra) {
		this.rpc.call(method, callback, parameters, timeout, {
			"context": context,
		}, ...extra);
	}

	reply(context, id, result, error = undefined, ...extra) {
		this.rpc.reply(id, result, error, {
			"context": context,
		}, ...extra);
	}

	getState(context) {
		// Retrieve the stored context information (by-ref).
		let o = this._contexts.get(context);

		// If the state has yet to be set, set the default one.
		if (typeof (o.state) !== "number") {
			o.state = EActionStateOff;
		}

		// Return the actual state.
		return o.state;
	}

	setState(context, state, force = false) {
		// Retrieve the stored context information (by-ref).
		let o = this._contexts.get(context);

		if ((typeof state) == "string") {
			state = this._states_name_to_id.get(state);
		}

		// Verify that the new state is different (and not a forced update).
		if ((o.state === state) && (force === false)) {
			return;
		}

		// Signal Stream Deck to update the specified context.
		this.streamdeck.setState(context, state);

		// Update the stored state.
		o.state = state;
	}

	setImage(context, state, image, target = 0) {
		if ((typeof state) == "string") {
			state = this._states_name_to_id.get(state);
		}

		this.streamdeck.setImage(context, state, image, target);
	}

	registerNamedState(name, id) {
		this._states_id_to_name.set(id, name);
		this._states_name_to_id.set(name, id);
	}

	translateStateIdToName(id) {
		return this._states_id_to_name.get(id);
	}

	translateStateNameToId(name) {
		return this._states_name_to_id.get(name);
	}

	// ---------------------------------------------------------------------------------------------- //
	// Listeners
	// ---------------------------------------------------------------------------------------------- //
	__iaction_on_willAppear(event) { // Track context and load settings.
		let status = {};
		status.state = 0;
		status.isInMultiAction = event.data.isInMultiAction;
		Object.assign(status, event.data.payload);
		this._contexts.set(event.context, status);
	}

	__iaction_on_willDisappear(event) { // Untrack context and save settings.
		if (!this._contexts.has(event.context)) {
			return;
		}

		let o = this._contexts.get(event.context);
		this._contexts.delete(event.context);
		if (!o.settings) {
			return;
		}

		this.streamdeck.setSettings(event.context, o.settings);
	}

	__iaction_on_propertyInspectorDidAppear(event) {
		this._inspector = event.context;
	}

	__iaction_on_propertyInspectorDidDisappear(event) {
		if (this._inspector == event.context) {
			this._inspector = null;
		}
	}

	__iaction_on_sendToPlugin(event) {
		event.preventDefault();
		if (config.debug_inspector) {
			this.log(`RECV <${event.context}> ${JSON.stringifyEx(event.data.payload)}`);
		}
		this._rpc.recv(event.data.payload, {
			"context": event.context,
		});
	}

	__iaction_on_rpc_log(event) {
		// Also log the context if we have one.
		let ctx = "";
		if (event.extra.length > 0) {
			ctx = `<${event.extra[0].context.toString()}>`;
		}

		this.log(`${ctx} ${event.data.toString()}`);
	}

	__iaction_on_rpc_send(event) {
		if (config.debug_inspector) {
			this.log(`SEND <${event.extra[0].context}> ${JSON.stringifyEx(event.data)}`);
		}
		this.streamdeck.sendToPropertyInspector(
			this.uuid,
			event.extra[0].context,
			event.data
		);
	}
}
