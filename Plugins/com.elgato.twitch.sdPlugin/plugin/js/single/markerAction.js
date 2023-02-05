//==============================================================================
/**
@file       markerAction.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a create marker action
function MarkerAction(inContext, inSettings) {
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

	// Private function called for the create marker request
	function create(account, target, callback) {
		var url = "https://api.twitch.tv/helix/streams/markers";
		var xhr = new XMLHttpRequest();
		xhr.responseType = 'json';
		xhr.open("POST", url, true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.setRequestHeader('Client-ID', clientID);
		xhr.setRequestHeader('Authorization', 'Bearer ' + account.token);
		xhr.timeout = 2500;
		xhr.onload = function () {
			if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
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
		var obj = {};
		obj.user_id = account.id;
		var data = JSON.stringify(obj);
		xhr.send(data);
	}
};
