//==============================================================================
/**
@file       streamtitleAction.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a set title action
function StreamTitleAction(inContext, inSettings) {
	// Init StreamTitleAction
	var instance = this;

	// Inherit from Action
	Action.call(this, inContext, inSettings);

	// Before overwriting parrent method, save a copy of it
	var actionOnKeyUp = this.onKeyUp;

	// Public function called on key up event
	this.onKeyUp = function(inData, inCallback) {
		// Call the update title method
		actionOnKeyUp.call(this, inData, update);
		inCallback();
	};

	// Private function called to update title & game
	function update(account, target, callback) {
		// If no game entered or game id already known
		if (!target.game || target.gameId) {
			// Call the function which send the set title request
			set(account, target, callback);
		}

		// If game id still has to be found
		else {
			// Call the function which send the search request
			search(account, target, function (success, result) {
				// Check if the game was found
				if (!success) {
					log(result);
					target.gameId = 0;
				}
				else {
					target.game = result.name;
					target.gameId = result.id;

					// Update settings and PI
					instance.updateSettings(target);
				}

				// Call the function which send the set title request
				set(account, target, callback);
			});
		}
	}

	// Private function called to update game title & id
	this.updateSettings = function(target) {
		// Get the settings and the context
		var settings = this.getSettings();
		var context = this.getContext();

		settings.ChannelGameTitle = target.game;
		settings.ChannelGameID = target.gameId;

		saveSettings(context, settings);
	}

	// Private function called to find the game id
	function search(account, target, callback) {
		var url = "https://api.twitch.tv/helix/search/categories?first=1&query=" + target.game;
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
							callback(true, result.data[0]);
						}
						else {
							callback(false, "Game title unknown.");
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

	// Private function called for the set title request
	function set(account, target, callback) {
		var url = "https://api.twitch.tv/helix/channels?broadcaster_id=" + account.id;
		var xhr = new XMLHttpRequest();
		xhr.responseType = 'json';
		xhr.open("PATCH", url, true);
		xhr.setRequestHeader('Content-Type', 'application/json');
		xhr.setRequestHeader('Client-ID', clientID);
		xhr.setRequestHeader('Authorization', 'Bearer ' + account.token);
		xhr.timeout = 2500;
		xhr.onload = function () {
			if (xhr.readyState == XMLHttpRequest.DONE && xhr.status == 204) {
				if (target.title || target.gameId != 0) {
					callback(true);
				}
				else {
					callback(false, 'Could not find the game.');
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
		if (target.title) {
			obj.title = target.title;
		}
		if (target.game) {
			obj.game_id = target.gameId;
		}
		var data = JSON.stringify(obj);
		xhr.send(data);
	}
};
