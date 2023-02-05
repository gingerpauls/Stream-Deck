//==============================================================================
/**
@file       autoshowAction.js
@brief      Streamlabs Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a disable auto show action
function AutoShowAction(inContext, inSettings) {
	// Init AutoShowAction
	var instance = this;

	// Inherit from Action
	Action.call(this, inContext, inSettings);

	// Before overwriting parrent method, save a copy of it
	var actionOnKeyUp = this.onKeyUp;

	// Public function called on key up event
	this.onKeyUp = function(inData, inCallback) {
		// Define the state key
		inData.key = 'mediaAutoShow';

		// Call actions onKeyUp method
		actionOnKeyUp.call(this, inData, disable);
		inCallback();
	};

	// Private function called for the disable auto show request
	function disable(account, target, callback) {
		if (target.state) {
			var url = "https://streamlabs.com/api/v1.0/media-share/enable-autoshow";
		}
		else {
			var url = "https://streamlabs.com/api/v1.0/media-share/disable-autoshow";
		}

		var xhr = new XMLHttpRequest();
		xhr.responseType = 'json';
		xhr.open("PATCH", url, true);
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

	// Add event listeners
	document.addEventListener('mediaAutoShow', function (evt) {
		instance.updateState.call(instance, evt.detail.account, evt.detail.value, 'mediaAutoShow');
	});
};
