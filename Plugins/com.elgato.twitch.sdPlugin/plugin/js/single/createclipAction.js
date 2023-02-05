//==============================================================================
/**
@file       createclipAction.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a create clip action
function CreateClipAction(inContext, inSettings) {
	// Inherit from Action
	Action.call(this, inContext, inSettings);

	// Before overwriting parrent method, save a copy of it
	var actionOnKeyUp = this.onKeyUp;

	// Public function called on key up event
	this.onKeyUp = function(inData, inCallback) {
		// Call actions onKeyUp method
		actionOnKeyUp.call(this, inData, create);
		inCallback();
	};

	// Private function called for the create clip request
	function create(account, target, callback) {
		var url = "https://api.twitch.tv/helix/clips?broadcaster_id=" + account.id;
		var xhr = new XMLHttpRequest();
		xhr.responseType = 'json';
		xhr.open("POST", url, true);
		xhr.setRequestHeader('Client-ID', clientID);
		xhr.setRequestHeader('Authorization', 'Bearer ' + account.token);
		xhr.timeout = 2500;
		xhr.onload = function () {
			if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 202) {
				var result = xhr.response;
				if (result != undefined && result != null) {
					if ('data' in result) {
						callback(true, result.data[0]);
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
