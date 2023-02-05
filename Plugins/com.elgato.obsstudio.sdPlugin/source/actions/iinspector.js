// Copyright © 2022, Corsair Memory Inc. All rights reserved.

class IInspector extends EventTarget {
	constructor(uPort, uUUID, uEvent, uApplicationInfo, uActionInfo) {
		super();

		// Set members to their default state.
		this._appInfo = uApplicationInfo;
		this._actionInfo = uActionInfo;
		this._action = this._actionInfo.action;
		this._context = uUUID; //this._ainfo.context;

		{ // Set up StreamDeck connection.
			this._streamdeck = new StreamDeck(uPort, uUUID, uEvent, uApplicationInfo, uActionInfo);
			this.streamdeck.addEventListener("open", (ev) => {
				this._iinspector_on_streamdeck_open(ev); 
			});
			this.streamdeck.addEventListener("close", (ev) => {
				this._iinspector_on_streamdeck_close(ev); 
			});
			this.streamdeck.addEventListener("error", (ev) => {
				this._iinspector_on_streamdeck_error(ev); 
			});

			// This is necessary for RPC communication.
			this.streamdeck.addEventListener("sendToPropertyInspector", (event) => {
				this._iinspector_on_streamdeck_sendToInspector(event); 
			});
		}

		{ // Action RPC
			this._rpc = new RPC("rpc.", this);
			this.rpc.addEventListener("log", (event) => {
				this._iinspector_on_rpc_log(event); 
			});
			this.rpc.addEventListener("send", (event) => {
				this._iinspector_on_rpc_send(event); 
			});
		}

		// Initialize things.
		this._iinspector_initialize_overlays();
	}

	// ---------------------------------------------------------------------------------------------- //
	// Overlay
	// ---------------------------------------------------------------------------------------------- //
	_iinspector_initialize_overlays() {
		this._overlays = {};
		this._overlay = document.createElement("div");
		this._overlay.classList.add("overlay");
		document.querySelector("body").appendChild(this._overlay);

		{ // Processing Overlay
			let eContainer = document.createElement("div");
			eContainer.classList.add("processing");
			this._overlay.appendChild(eContainer);

			let eSpinner = document.createElement("div");
			eSpinner.classList.add("icon");
			eContainer.appendChild(eSpinner);

			let eSpinnerItem = document.createElement("div");
			eSpinnerItem.classList.add("item");
			eSpinner.appendChild(eSpinnerItem);

			let eText = document.createElement("div");
			eText.classList.add("text");
			eText.textContent = "Sample Text";
			eContainer.appendChild(eText);

			this._overlays["processing"] = {
				"container": eContainer,
				"text": eText,
			};
		}

		{ // Warning Overlay
			let eContainer = document.createElement("div");
			eContainer.classList.add("warning");
			this._overlay.appendChild(eContainer);

			let eIcon = document.createElement("div");
			eIcon.classList.add("icon");
			eIcon.textContent = "⚠";
			eContainer.appendChild(eIcon);

			let eText = document.createElement("div");
			eText.classList.add("text");
			eText.textContent = "Sample Text";
			eContainer.appendChild(eText);

			this._overlays["warning"] = {
				"container": eContainer,
				"text": eText,
			};
		}

		{ // Error Overlay
			let eContainer = document.createElement("div");
			eContainer.classList.add("error");
			this._overlay.appendChild(eContainer);

			let eIcon = document.createElement("div");
			eIcon.classList.add("icon");
			eIcon.textContent = "❌";
			eContainer.appendChild(eIcon);

			let eText = document.createElement("div");
			eText.classList.add("text");
			eText.textContent = "Sample Text";
			eContainer.appendChild(eText);

			this._overlays["error"] = {
				"container": eContainer,
				"text": eText,
			};
		}

		this.hide_overlays();
	}

	hide_overlays() {
		this._overlay.style.setProperty("display", "none");
		this._overlays["processing"].container.style.setProperty("display", "none");
		this._overlays["warning"].container.style.setProperty("display", "none");
		this._overlays["error"].container.style.setProperty("display", "none");
	}

	show_processing_overlay(text) {
		this.hide_overlays();
		this._overlays["processing"].text.innerHTML = text;
		this._overlays["processing"].container.style.removeProperty("display");
		this._overlay.style.removeProperty("display");
	}

	show_warning_overlay(text) {
		this.hide_overlays();
		this._overlays["warning"].text.innerHTML = text;
		this._overlays["warning"].container.style.removeProperty("display");
		this._overlay.style.removeProperty("display");
	}

	show_error_overlay(text) {
		this.hide_overlays();
		this._overlays["error"].text.innerHTML = text;
		this._overlays["error"].container.style.removeProperty("display");
		this._overlay.style.removeProperty("display");
	}

	// ---------------------------------------------------------------------------------------------- //
	// Warnings/Hints API
	// ---------------------------------------------------------------------------------------------- //
	_iinspector_create_message(type, text, selector) {
		// Create the message itself.
		let eMessage = document.createElement("div");
		eMessage.classList.add("message");
		eMessage.classList.add(type);
		eMessage.innerHTML = text;

		// Insert it into the DOM.
		let container = document.querySelector(".sdpi-wrapper");
		if (selector !== undefined) {
			let target = container.querySelector(selector);
			if ((target !== undefined) && (target !== null))
				container.insertBefore(eMessage, target);
		} else {
			container.appendChild(eMessage);
		}

		return eMessage;
	}

	clear_messages() {
		let els = document.querySelectorAll(".message");
		for (let el of els) {
			el.parentElement.removeChild(el);
		}
	}

	add_hint(text, before_selector) {
		this._iinspector_create_message("hint", text, before_selector);
	}

	add_warning(text, before_selector) {
		this._iinspector_create_message("warning", text, before_selector);
	}

	// ---------------------------------------------------------------------------------------------- //
	// Stream Deck API
	// ---------------------------------------------------------------------------------------------- //
	get streamdeck() {
		return this._streamdeck;
	}

	log(message) {
		this.streamdeck.log(`[${this._actionInfo.action}] ${message.toString()}`);
	}

	_iinspector_on_streamdeck_open(event) {
		let ev = new Event("open", { "bubbles": true });
		ev.data = event;
		this.dispatchEvent(ev);
		this.log("Ready to Work.");
	}

	_iinspector_on_streamdeck_close(event) {
		let ev = new Event("close", { "bubbles": true });
		ev.data = event;
		this.dispatchEvent(ev);
	}

	_iinspector_on_streamdeck_error(event) {
		let ev = new Event("error", { "bubbles": true });
		ev.data = event;
		this.dispatchEvent(ev);
	}

	_iinspector_on_streamdeck_sendToInspector(event) {
		event.preventDefault();
		if (config.debug_inspector) {
			this.log(`RECV ${JSON.stringifyEx(event.payload)}`);
		}
		this._rpc.recv(event.payload);
	}

	// ---------------------------------------------------------------------------------------------- //
	// RPC Messaging
	// ---------------------------------------------------------------------------------------------- //
	get rpc() {
		return this._rpc;
	}

	notify(method, parameters = undefined, ...extra) {
		this._rpc.notify(method, parameters, {
			"context": this._context,
		}, ...extra);
	}

	call(method, callback, parameters = undefined, timeout = 10000, ...extra) {
		this._rpc.call(method, callback, parameters, timeout, {
			"context": this._context,
		}, ...extra);
	}

	reply(id, result, error = undefined, ...extra) {
		this._rpc.reply(id, result, error, {
			"context": this._context,
		}, ...extra);
	}

	// This function handles log information from the RPC handler.
	_iinspector_on_rpc_log(event) {
		this.log(`${event.data}`);
	}

	// This function handles network sends from the RPC handler.
	_iinspector_on_rpc_send(event) {
		if (config.debug_inspector) {
			this.log(`SEND ${JSON.stringifyEx(event.data)}`);
		}
		this.streamdeck.sendToPlugin(event.data);
	}
}
