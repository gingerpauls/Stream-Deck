//==============================================================================
/**
@file       volumeAction.js
@brief      Streamlabs Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a volume up action
function VolumeAction(inContext, inSettings) {
	// Inherit from Action
	Action.call(this, inContext, inSettings);

	VolumeAction.updateIcon(inContext, inSettings);

	// Before overwriting parrent method, save a copy of it
	var actionOnKeyUp = this.onKeyUp;

	// Public function called on key up event
	this.onKeyUp = function(inData, inCallback) {
		// Call actions onKeyUp method
		actionOnKeyUp.call(this, inData, change);
		inCallback();
	};

	// Private function called for the volume change request
	function change(account, target, callback) {
		if (target.volumeDown) {
			var url = "https://streamlabs.com/api/v1.0/media-share/volume-down";
		}
		else {
			var url = "https://streamlabs.com/api/v1.0/media-share/volume-up";
		}
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
		obj.volume = 10;
		var data = JSON.stringify(obj);
		xhr.send(data);
	}
};

// Static fonction called to update the key icon
VolumeAction.updateIcon = function(context, settings) {
	if (settings['volumeDown']) {
		// Set the icon to lower
		loadAndSetImage(context, "images/icons/media_volumedown.png");
	}
	else {
		// Set the icon to higher
		loadAndSetImage(context, "images/icons/media_volumeup.png");
	}
}
