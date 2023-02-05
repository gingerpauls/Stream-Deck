//==============================================================================
/**
@file       playbackAction.js
@brief      Streamlabs Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a playback action
function PlaybackAction(inContext, inSettings) {
	// Inherit from Action
	Action.call(this, inContext, inSettings);

	// Before overwriting parrent method, save a copy of it
	var actionOnKeyUp = this.onKeyUp;

	// Public function called on key up event
	this.onKeyUp = function(inData, inCallback) {
		// Call actions onKeyUp method
		actionOnKeyUp.call(this, inData, playback);
		inCallback();
	};

	// Private function called for the playback request
	function playback(account, target, callback) {
		var url = "https://streamlabs.com/api/v1.0/media-share/playback-video";
		var xhr = new XMLHttpRequest();
		xhr.responseType = 'json';
		xhr.open("PUT", url, true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.timeout = 2500;
		xhr.onload = function () {
			if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
				var result = xhr.response;
				if (result != undefined && result != null) {
					if ('success' in result) {
						callback(true, result);
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
		var obj = new Object();
		obj.access_token = account.token;
		var data = JSON.stringify(obj);
		xhr.send(data);
	}
};
