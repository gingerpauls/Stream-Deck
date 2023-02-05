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

// Global plugin settings
var globalSettings = {};

// Global settings
var settings = {};

// Global cache
var cache = {};
  
// Setup the websocket and handle communication
function connectElgatoStreamDeckSocket(inPort, inUUID, inRegisterEvent, inInfo, inActionInfo) {
    // Parse parameter from string to object
    var actionInfo = JSON.parse(inActionInfo);
    var info = JSON.parse(inInfo);

    // Save global settings
    settings = actionInfo['payload']['settings'];

    // Retrieve language
    var language = info['application']['language'];

    // Retrieve action identifier
    var action = actionInfo['action'];

    // Open the web socket to Stream Deck
    // Use 127.0.0.1 because Windows needs 300ms to resolve localhost
	websocket = new WebSocket("ws://127.0.0.1:" + inPort);

    // WebSocket is connected, send message
	websocket.onopen = function () {
		// Register property inspector to Stream Deck
		registerPluginOrPI(inRegisterEvent, inUUID);

        // Request the global settings of the plugin
        requestGlobalSettings(inUUID);
	};

    // Create actions
    if (action == "com.elgato.twitch.chatmessage") {
        var pi = new ChatMessagePI(inUUID, language);
    }
    else if (action == "com.elgato.twitch.clear") {
        var pi = new ClearPI(inUUID, language);
    }
    else if (action == "com.elgato.twitch.createclip") {
        var pi = new CreateClipPI(inUUID, language);
    }
    else if (action == "com.elgato.twitch.marker") {
        var pi = new MarkerPI(inUUID, language);
    }
    else if (action == "com.elgato.twitch.openlastclip") {
        var pi = new OpenLastClipPI(inUUID, language);
    }
    else if (action == "com.elgato.twitch.playad") {
        var pi = new PlayAdPI(inUUID, language);
    }
    else if (action == "com.elgato.twitch.streamtitle") {
        var pi = new StreamTitlePI(inUUID, language);
    }
    else if (action == "com.elgato.twitch.viewers") {
        var pi = new ViewersPI(inUUID, language);
    }
    else if (action == "com.elgato.twitch.emotechat") {
        var pi = new EmoteChatPI(inUUID, language);
    }
    else if (action == "com.elgato.twitch.followerschat") {
        var pi = new FollowersChatPI(inUUID, language);
    }
    else if (action == "com.elgato.twitch.slowchat") {
        var pi = new SlowChatPI(inUUID, language);
    }
    else if (action == "com.elgato.twitch.subchat") {
        var pi = new SubChatPI(inUUID, language);
    }
     

    websocket.onmessage = function (evt) {
        // Received message from Stream Deck
        var jsonObj = JSON.parse(evt.data);
        var event = jsonObj['event'];
        var jsonPayload = jsonObj['payload'];

        if(event == "didReceiveGlobalSettings") {
            // Set global plugin settings
            globalSettings = jsonPayload['settings'];
        }
        else if(event == "didReceiveSettings") {
            // Save global settings after default was set
            settings = jsonPayload['settings'];

            if (pi instanceof StreamTitlePI) {
                // Load game
                pi.loadGame();
            }
        }
        else if(event == "sendToPropertyInspector") {
            // Save global cache
            cache = jsonPayload;

            // Load accounts
            pi.loadAccounts();
        }
    };
}
