//==============================================================================
/**
@file       main.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Global web socket
var websocket = null;

// Global cache
var cache = {};

// Global settings
var globalSettings = {};

// Global IRC Sockets
var ircSockets = {};

// Stream Deck Client ID
const clientID = "x8q05mnq46ssnugf2v03pq6dvkkg9c";

// Setup the websocket and handle communication
function connectElgatoStreamDeckSocket(inPort, inPluginUUID, inRegisterEvent, inInfo) {
		// Create array of currently used actions
		var actions = {};

		// Create a cache
		cache = new Cache();

		// Open the web socket to Stream Deck
		// Use 127.0.0.1 because Windows needs 300ms to resolve localhost
		websocket = new WebSocket("ws://127.0.0.1:" + inPort);

		// Web socket is connected
		websocket.onopen = function () {
				// Register plugin to Stream Deck
				registerPluginOrPI(inRegisterEvent, inPluginUUID);

				// Request the global settings of the plugin
				requestGlobalSettings(inPluginUUID);
		}

		// Add event listener
		document.addEventListener('newCacheAvailable', function () {
				// When a new cache is available
				Object.keys(actions).forEach(function (inContext) {
						// Inform all used actions that a new cache is available
						actions[inContext].newCacheAvailable(function () {
								// Find out type of action
								if (actions[inContext] instanceof ChatMessageAction) {
										var action = "com.elgato.twitch.chatmessage";
								}
								else if (actions[inContext] instanceof ClearAction) {
										var action = "com.elgato.twitch.clear";
								}								
								else if (actions[inContext] instanceof CreateClipAction) {
										var action = "com.elgato.twitch.createclip";
								}
								else if (actions[inContext] instanceof MarkerAction) {
										var action = "com.elgato.twitch.marker";
								}
								else if (actions[inContext] instanceof OpenLastClipAction) {
										var action = "com.elgato.twitch.openlastclip";
								}
								else if (actions[inContext] instanceof PlayAdAction) {
										var action = "com.elgato.twitch.playad";
								}
								else if (actions[inContext] instanceof StreamTitleAction) {
										var action = "com.elgato.twitch.streamtitle";
								}
								else if (actions[inContext] instanceof ViewersAction) {
										var action = "com.elgato.twitch.viewers";
								}								
								else if (actions[inContext] instanceof EmoteChatAction) {
										var action = "com.elgato.twitch.emotechat";
								}	
								else if (actions[inContext] instanceof FollowersChatAction) {
										var action = "com.elgato.twitch.followerschat";
								}
								else if (actions[inContext] instanceof SlowChatAction) {
										var action = "com.elgato.twitch.slowchat";
								}
								else if (actions[inContext] instanceof SubChatAction) {
										var action = "com.elgato.twitch.subchat";
								}
								// Inform PI of new cache
								sendToPropertyInspector(action, inContext, cache.data);
						});
				});
		}, false);

		// Web socked received a message
		websocket.onmessage = function (inEvent) {
				// Parse parameter from string to object
				var jsonObj = JSON.parse(inEvent.data);

				// Extract payload information
				var event = jsonObj['event'];
				var action = jsonObj['action'];
				var context = jsonObj['context'];
				var jsonPayload = jsonObj['payload'];

				// Key up event
				if(event == "keyUp") {
						var data = {};
						data.context = context;
						data.settings = jsonPayload['settings'];
						data.coordinates = jsonPayload['coordinates'];
						data.userDesiredState = jsonPayload['userDesiredState'];
						data.state = jsonPayload['state'];

						// Send onKeyUp event to actions
						if (context in actions) {
								actions[context].onKeyUp(data, function() {
										// Refresh the cache
										cache.update();
								});
						}
				}
				else if(event == "willAppear") {
						var settings = jsonPayload['settings'];

						// If this is the first visible action
						if(Object.keys(actions).length == 0) {
								// Start polling
								cache.update();
						}

						// Add current instance is not in actions array
						if (!(context in actions)) {
								// Add current instance to array
								if(action == "com.elgato.twitch.chatmessage") {
										actions[context] = new ChatMessageAction(context, settings);
								}
								else if(action == "com.elgato.twitch.clear") {
										actions[context] = new ClearAction(context, settings);
								}
								else if(action == "com.elgato.twitch.createclip") {
										actions[context] = new CreateClipAction(context, settings);
								}
								else if(action == "com.elgato.twitch.marker") {
										actions[context] = new MarkerAction(context, settings);
								}
								else if(action == "com.elgato.twitch.openlastclip") {
										actions[context] = new OpenLastClipAction(context, settings);
								}
								else if(action == "com.elgato.twitch.playad") {
										actions[context] = new PlayAdAction(context, settings);
								}
								else if(action == "com.elgato.twitch.streamtitle") {
										actions[context] = new StreamTitleAction(context, settings);
								}
								else if(action == "com.elgato.twitch.viewers") {
										actions[context] = new ViewersAction(context, settings);
										actions[context].startTimer();
								}
								else if(action == "com.elgato.twitch.emotechat") {
										actions[context] = new EmoteChatAction(context, settings);
								}	
								else if(action == "com.elgato.twitch.followerschat") {
										actions[context] = new FollowersChatAction(context, settings);
								}
								else if(action == "com.elgato.twitch.slowchat") {
										actions[context] = new SlowChatAction(context, settings);
								}
								else if(action == "com.elgato.twitch.subchat") {
										actions[context] = new SubChatAction(context, settings);
								}					
						}
				}
				else if(event == "willDisappear") {
						// Remove current instance from array
						if (context in actions) {
								if(action == "com.elgato.twitch.viewers") {
										actions[context].stopTimer();
								}
								delete actions[context];
						}
				}
				else if(event == "didReceiveGlobalSettings") {
						// Set global settings
						globalSettings = jsonPayload['settings'];

						// If at least one action is active
						if(Object.keys(actions).length > 0) {
								// Refresh the cache
								cache.update();
						}
				}
				else if(event == "didReceiveSettings") {
						var settings = jsonPayload['settings'];

						// Set settings
						if (context in actions) {
								actions[context].setSettings(settings);
						}
						
						// Refresh the cache
						cache.update();
				}
				else if(event == "propertyInspectorDidAppear") {
						// Send cache to PI
						sendToPropertyInspector(action, context, cache.data);
				}
		};
};
