//==============================================================================
/**
@file       main.js
@brief      Streamlabs Plugin
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
								if (actions[inContext] instanceof AlertAction) {
									var action = "com.elgato.streamlabs.alert";
								}
								else if (actions[inContext] instanceof SkipAction) {
									var action = "com.elgato.streamlabs.alert.skip";
								}
								else if (actions[inContext] instanceof MuteAction) {
									var action = "com.elgato.streamlabs.alert.mute";
								}
								else if (actions[inContext] instanceof PauseAction) {
									var action = "com.elgato.streamlabs.alert.pause";
								}
								else if (actions[inContext] instanceof SpinWheelAction) {
									var action = "com.elgato.streamlabs.spinwheel";
								}
								else if (actions[inContext] instanceof PlayCreditsAction) {
									var action = "com.elgato.streamlabs.playcredits";
								}
								else if (actions[inContext] instanceof EmptyJarAction) {
									var action = "com.elgato.streamlabs.emptyjar";
								}
								else if (actions[inContext] instanceof ProfileAction) {
									var action = "com.elgato.streamlabs.changeprofile";
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
						var data = new Object();
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
								if(action == "com.elgato.streamlabs.alert") {
										actions[context] = new AlertAction(context, settings);
								}
								else if(action == "com.elgato.streamlabs.alert.skip") {
										actions[context] = new SkipAction(context, settings);
								}
								else if(action == "com.elgato.streamlabs.alert.mute") {
										actions[context] = new MuteAction(context, settings);
								}
								else if(action == "com.elgato.streamlabs.alert.pause") {
										actions[context] = new PauseAction(context, settings);
								}
								else if(action == "com.elgato.streamlabs.spinwheel") {
										actions[context] = new SpinWheelAction(context, settings);
								}
								else if(action == "com.elgato.streamlabs.playcredits") {
										actions[context] = new PlayCreditsAction(context, settings);
								}
								else if(action == "com.elgato.streamlabs.emptyjar") {
										actions[context] = new EmptyJarAction(context, settings);
								}
								else if(action == "com.elgato.streamlabs.changeprofile") {
										actions[context] = new ProfileAction(context, settings);
								}
								else if (action == "com.elgato.streamlabs.media.autoplay") {
										actions[context] = new AutoplayAction(context, settings);
								}
								else if (action == "com.elgato.streamlabs.media.autoshow") {
										actions[context] = new AutoShowAction(context, settings);
								}
								else if (action == "com.elgato.streamlabs.media.backuplist") {
										actions[context] = new BackupListAction(context, settings);
								}        
								else if (action == "com.elgato.streamlabs.media.moderation") {
										actions[context] = new ModerationAction(context, settings);
								}        
								else if (action == "com.elgato.streamlabs.media.pause") {
										actions[context] = new PauseMediaAction(context, settings);
								}        
								else if (action == "com.elgato.streamlabs.media.playback") {
										actions[context] = new PlaybackAction(context, settings);
								}        
								else if (action == "com.elgato.streamlabs.media.request") {
										actions[context] = new RequestAction(context, settings);
								}        
								else if (action == "com.elgato.streamlabs.media.skip") {
										actions[context] = new SkipVideoAction(context, settings);
								}             
								else if (action == "com.elgato.streamlabs.media.volume") {
										actions[context] = new VolumeAction(context, settings);
								}
						}
				}
				else if(event == "willDisappear") {
						// Remove current instance from array
						if (context in actions) {
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
						
						// Check if the action is volume change
						if (action == "com.elgato.streamlabs.media.volume") {
								VolumeAction.updateIcon(context, settings)
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
