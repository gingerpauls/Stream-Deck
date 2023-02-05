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
    if (action == "com.elgato.streamlabs.alert") {
        var pi = new AlertPI(inUUID, language);
    }
    else if (action == "com.elgato.streamlabs.alert.skip") {
        var pi = new SkipPI(inUUID, language);
    }
    else if (action == "com.elgato.streamlabs.alert.mute") {
        var pi = new MutePI(inUUID, language);
    }
    else if (action == "com.elgato.streamlabs.alert.pause") {
        var pi = new PausePI(inUUID, language);
    }
    else if (action == "com.elgato.streamlabs.spinwheel") {
        var pi = new SpinWheelPI(inUUID, language);
    }
    else if (action == "com.elgato.streamlabs.playcredits") {
        var pi = new PlayCreditsPI(inUUID, language);
    }
    else if (action == "com.elgato.streamlabs.emptyjar") {
        var pi = new EmptyJarPI(inUUID, language);
    }
    else if (action == "com.elgato.streamlabs.changeprofile") {
        var pi = new ProfilePI(inUUID, language);
    }
    else if (action == "com.elgato.streamlabs.media.autoplay") {
	    var pi = new AutoplayPI(inUUID, language);
    }
    else if (action == "com.elgato.streamlabs.media.autoshow") {
        var pi = new AutoShowPI(inUUID, language);
    }
    else if (action == "com.elgato.streamlabs.media.backuplist") {
        var pi = new BackupListPI(inUUID, language);
    }        
    else if (action == "com.elgato.streamlabs.media.moderation") {
        var pi = new ModerationPI(inUUID, language);
    }        
    else if (action == "com.elgato.streamlabs.media.pause") {
        var pi = new PauseMediaPI(inUUID, language);
    }        
    else if (action == "com.elgato.streamlabs.media.playback") {
        var pi = new PlaybackPI(inUUID, language);
    }        
    else if (action == "com.elgato.streamlabs.media.request") {
        var pi = new RequestPI(inUUID, language);
    }        
    else if (action == "com.elgato.streamlabs.media.skip") {
        var pi = new SkipVideoPI(inUUID, language);
    }                
    else if (action == "com.elgato.streamlabs.media.volume") {
        var pi = new VolumePI(inUUID, language);
    }

    var first = true;
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
        }
        else if(event == "sendToPropertyInspector") {
            // Save global cache
            cache = jsonPayload;

            // Load accounts
            pi.loadAccounts();

            // Load profiles only once
            if (pi instanceof ProfilePI && first) {
                pi.loadProfiles();
                first = false;
            }
        }
    };
}
