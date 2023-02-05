//==============================================================================
/**
@file       socket.js
@brief      Streamlabs Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a Streamlabs socket
function Socket(inAccountID = null) {
    // Check if the socket account is in the cache
    if (!(inAccountID in cache.data)) {
        return;
    }

    // Find the socket account
	var account = cache.data[inAccountID];

	getToken(account, function (success, result) {
		if (!success) {
			log(result);
			return;
		}
        
		// Initialize the websocket
		var socket = io(`https://sockets.streamlabs.com?token=${result}`, {transports: ['websocket']});
		
		// Event listener for state changes
		socket.on('event', function (evt) {

            // Disable the irrelevant socket
            if (!(inAccountID in cache.data)) {
                socket.removeAllListeners('event');
            }

            if (evt.type == 'muteVolume') {
                sendEvent('alertVolume', false);
            }
            else if (evt.type == 'unmuteVolume') {
                sendEvent('alertVolume', true);                    
            }
            else if (evt.type == 'pauseQueue') {
                sendEvent('alertPlaying', false);
            }
            else if (evt.type == 'unpauseQueue') {
                sendEvent('alertPlaying', true);                    
            }
            else if (evt.type == 'mediaShareEvent') {
                if (evt.message.type == 'requestPause') {
                    sendEvent('mediaPlaying', false); 
                }
                else if (evt.message.type == 'requestPlay') {
                    sendEvent('mediaPlaying', true); 
                }
            }
            else if (evt.type == 'mediaSharingSettingsUpdate') {
                var advancedSettings = evt.message.advanced_settings;
                if (advancedSettings.enabled != undefined) {
                    sendEvent('mediaPlaying', advancedSettings.enabled); 
                }
                if (advancedSettings.auto_play != undefined) {
                    sendEvent('mediaAutoplay', advancedSettings.auto_play)
                }
                if (advancedSettings.auto_show != undefined) {
                    sendEvent('mediaAutoShow', advancedSettings.auto_show)
                }
                if (advancedSettings.backup_playlist_enabled != undefined) {
                    sendEvent('mediaBackupList', advancedSettings.backup_playlist_enabled)
                }
                if (advancedSettings.moderation_queue != undefined) {
                    sendEvent('mediaModeration', advancedSettings.moderation_queue)
                }
                if (advancedSettings.requests_enabled != undefined) {
                    sendEvent('mediaRequests', advancedSettings.requests_enabled)
                }
            }
		});
    });
    
    // Private function called to send events for the actions
    function sendEvent(name, value) {
        var event = new CustomEvent(name, {
            detail: {
                account: inAccountID,
                value: value
            }
        });
        document.dispatchEvent(event);
    }

	// Private function called for the get token request
	function getToken(account, callback) {
        var url = "https://streamlabs.com/api/v1.0/socket/token"
                + "?access_token=" + encodeURIComponent(account.token);				
		var xhr = new XMLHttpRequest();
        xhr.responseType = 'json';
        xhr.open("GET", url, true);
        xhr.setRequestHeader('Content-Type', 'application/json');
        xhr.timeout = 2500;
        xhr.onload = function () {
            if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
                var result = xhr.response;
                if (result != undefined && result != null) {
                    if ('socket_token' in result) {
                        callback(true, result.socket_token);
                    }
                    else {
                        callback(false, "Account request failed.");
                    }
                }
                else {
                    callback(false, "Account response is undefined or null.");
                }
            }
            else {
                callback(false, 'Could not connect to the account.');
            }
        };
        xhr.onerror = function () {
            callback(false, 'Unable to connect to the account.');
        };
        xhr.ontimeout = function () {
            callback(false, 'Connection to the account timed out.');
        };
        xhr.send();
    }
};