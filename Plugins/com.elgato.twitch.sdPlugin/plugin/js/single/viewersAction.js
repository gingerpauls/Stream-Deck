//==============================================================================
/**
@file       viewersAction.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a get viewers count action
function ViewersAction(inContext, inSettings) {
	// Init ViewersAction
	var instance = this;

	// Inherit from Action
	Action.call(this, inContext, inSettings);

	// Remaining refresh attempts
	var canRefresh;

	// Refresh time of the cache
	var refreshTime = 120;

	// Private timer instance
	var timer = null;

	// Public function to start the timer
	this.startTimer = function () {
		// Log to the global log file
		log("Start the timer for viewers count");

		// Start a timer
		instance.restartTimer();
	}

	// Public function to restart the timer
	this.restartTimer = function () {
		// First refresh
		instance.refresh();

		// Restart the timer
		clearInterval(timer);
		timer = setInterval(instance.refresh, refreshTime * 100);
	}

	// Public function to stop the timer
	this.stopTimer = function () {
		// Log to the global log file
		log("Stop the timer for viewers count");

		// Invalidate the timer
		clearInterval(timer);
		timer = null;
	}

	// Public function called on refresh
	this.refresh = function () {
		// Call the update count method
		loadCount(instance.getContext(), instance.getSettings(), false);
	};

	// Public function called on key up event
	this.onKeyUp = function(inData, inCallback) {
		// Call the update count method
		loadCount(inData.context, inData.settings, true);
		inCallback();
	};

	// Private function called to update viewers count
	function loadCount(context, settings, onKeyUp) {
		// Check if any account is configured
		if (!('accountId' in settings)) {
			// Display errors only for manual updates
			if (onKeyUp) {
				log('No account configured');
				showAlert(context);
			}
			return;
		}
		
		// Check if the configured account is in the cache
		if (!(settings.accountId in cache.data)) {
			// Display errors only for manual updates
			if (onKeyUp) {
				log('Account ' + settings.accountId + ' not found in cache');
				showAlert(context);
			}
			return;
		}

		// Find the configured account
		var account = cache.data[settings.accountId];

		// Call the function which send the request
		getCount(account, function (success, result) {
			if (!success) {
				// Display errors only for manual updates
				if (onKeyUp) {
					log(result);
					showAlert(context);
					return;
				}
				// If no refresh attempts left
				if (!canRefresh) {
					instance.stopTimer();
					return;
				}
				canRefresh--;
				return;
			}

			// Reset number of refresh attempts
			canRefresh = 5;

			// Define new refresh time
			time = (result > 0 ? 60 : 120);

			// If invalid timer & manual refresh
			if (!timer && onKeyUp) {
				// Start a new timer
				instance.startTimer();
			}
			// If refresh time changed
			else if (time != refreshTime) {
				// Restart the timer with new refresh time
				refreshTime = time;
				instance.restartTimer();
			}

			// Display viewers count
			setTitle(context, result.toString(), 1, 0);
		});
	}

	// Private function called for the get viewers count request
	function getCount(account, callback) {
		var url = "https://api.twitch.tv/helix/streams?user_id=" + account.id;
		var xhr = new XMLHttpRequest();
		xhr.responseType = 'json';
		xhr.open("GET", url, true);
		xhr.setRequestHeader('Client-ID', clientID);
		xhr.setRequestHeader('Authorization', 'Bearer ' + account.token);
		xhr.timeout = 2500;
		xhr.onload = function () {
			if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 200) {
				var result = xhr.response;
				if (result != undefined && result != null) {
					if ('data' in result) {
						if (result.data.length > 0) {
							var stream = result.data[0];
							if ('viewer_count' in stream) {
								callback(true, stream.viewer_count);
							}
							else {
								callback(false, "Account request failed.");
							}
						}
						else {
							callback(true, "");
						}
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