//==============================================================================
/**
@file       action.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Protype which represents an action
function Action(inContext, inSettings) {
	// Init Action
	var instance = this;

	// Private variable containing the context of the action
	var context = inContext;

	// Private variable containing the settings of the action
	var settings = inSettings;

	// Private map used for string migration in settings
	const stringMap = {
		'0m': '',
		'10m': '10minutes',
		'30m': '30minutes',
		'1h': '1hour',
		'1d': '1day',
		'1w': '1week',
		'1mo': '1month',
		'3mo': '3months'
	};

	// Set the default values
	setDefaults();

	// Public function returning the context
	this.getContext = function () {
		return context;
	};

	// Public function returning the settings
	this.getSettings = function () {
		return settings;
	};

	// Public function for settings the settings
	this.setSettings = function (inSettings) {
		settings = inSettings;
	};

	// Public function called when new cache is available
	this.newCacheAvailable = function (inCallback) {
		// Set default settings
		setDefaults(inCallback);
	};

	// Public function called on key up event
	this.onKeyUp = function(inData, inCallback) {
		// Check if any account is configured
		if (!('accountId' in inData.settings)) {
			log('No account configured');
			showAlert(inData.context);
			return;
		}
	
		// Check if the configured account is in the cache
		if (!(inData.settings.accountId in cache.data)) {
			log('Account ' + inData.settings.accountId + ' not found in cache');
			showAlert(inData.context);
			return;
		}
		// Find the configured account
		var account = cache.data[inData.settings.accountId];

		// Target data required for the request
		var target = { };

		// Define the target state for actions with state
		if (inData.key != undefined) {
			// Handle multi actions
			if (inData.userDesiredState != undefined) {
				// Set target state to desired state
				target.state = !inData.userDesiredState;
			}
			// Handle simple actions
			else if (inData.state != undefined) {
				// If action state not cached
				if (!(inData.key in account.states)) {
					// Set cached state to action state
					account.states[inData.key] = inData.state;
				}
				// Set target state to other state
				target.state = !account.states[inData.key]
			}
		}

		// Define the target message & context for chat message action
		if (instance instanceof ChatMessageAction) {
			target.message = inData.settings.msg;
			target.context = inData.context;
		}

		// Define the target duration for play ad action
		if (instance instanceof PlayAdAction) {
			target.length = inData.settings.commercialLength;
		}

		// Define the target fields for set title action
		if (instance instanceof StreamTitleAction) {
			target.title = inData.settings.ChannelStatus;
			target.game = inData.settings.ChannelGameTitle;
			target.gameId = inData.settings.ChannelGameID;
		}

		// Define the target duration for followers chat action
		if (instance instanceof FollowersChatAction) {
			target.duration = inData.settings.followersMin;
		}

		// Define the target duration for slow chat action
		if (instance instanceof SlowChatAction) {
			target.duration = inData.settings.slowSec;
		}

		// Call the function which send the request
		inCallback(account, target, function (success, result) {
			if (!success) {
				log(result);
				showAlert(inData.context);
				return;
			}

			// Show success only for single state actions
			if (target.state == undefined) {
				showOk(inData.context);
			}

			// Save created clip as last clip
			if (instance instanceof CreateClipAction) {
				account.lastclip = result.edit_url;
			}
		});
	}

	// Public function to show success or failure
	this.showSuccess = function(inAccountID, inValue) {
		// Get the settings and the context
		var settings = this.getSettings();
		var context = this.getContext();

		// Check if any account is configured
		if (!('accountId' in settings)) {
			return;
		}
	
		// Check if the target and action accounts match
		if (inAccountID != settings.accountId) {
			return;
		}

		// Show failure for any action
		if (!inValue) {
			showAlert(context);
			return;
		}

		// Show success only for single state actions
		if (instance instanceof ChatMessageAction) {
			if (inValue == context) {
				showOk(context);
			}
		}
		if (instance instanceof ClearAction) {
			showOk(context);
		}
	}

	// Public function to update the states
	this.updateState = function(inAccountID, inState, inKey) {
		// Get the settings and the context
		var settings = this.getSettings();
		var context = this.getContext();

		// Check if any account is configured
		if (!('accountId' in settings)) {
			return;
		}

		// Check if the target and action accounts match
		if (inAccountID != settings.accountId) {
			return;
		}
	
		// Set the new action state
		setState(context, inState ? 1 : 0);
		
		// Check if the configured account is in the cache
		if (!(settings.accountId in cache.data)) {
			return;
		}

		// Find the configured account
		var account = cache.data[settings.accountId];

		// Update the cache state
		account.states[inKey] = inState;
	}

	// Private function to set the defaults
	function setDefaults(inCallback) {
		// If at least one account is paired
		if (Object.keys(cache.data).length > 0) {
			// Find out type of action
			if (instance instanceof ChatMessageAction) {
				var action = "com.elgato.twitch.chatmessage";

				// If no message is set for this action
				if (!('msg' in settings)) {
					// Create the message attribute
					settings.msg = "";
			
					// Save the settings
					saveSettings(inContext, settings);
				}
			}
			else if (instance instanceof ClearAction) {
				var action = "com.elgato.twitch.clear";
			}
			else if (instance instanceof CreateClipAction) {
				var action = "com.elgato.twitch.createclip";
			}
			else if (instance instanceof MarkerAction) {
				var action = "com.elgato.twitch.marker";
			}
			else if (instance instanceof OpenLastClipAction) {
				var action = "com.elgato.twitch.openlastclip";
			}
			else if (instance instanceof PlayAdAction) {
				var action = "com.elgato.twitch.playad";

				// If no duration is set for this action
				if (!('commercialLength' in settings)) {
					// Set the account automatically to 30
					settings.commercialLength = 30;

					// Save the settings
					saveSettings(inContext, settings);
				}
			}
			else if (instance instanceof StreamTitleAction) {
				var action = "com.elgato.twitch.streamtitle";

				// If no stream title is set for this action
				if (!('ChannelStatus' in settings)) {
					// Create the stream title attribute
					settings.ChannelStatus = "";

					// Save the settings
					saveSettings(inContext, settings);
				}

				// If no game title is set for this action
				if (!('ChannelGameTitle' in settings)) {
					// Create the game title attribute
					settings.ChannelGameTitle = "";
			
					// Save the settings
					saveSettings(inContext, settings);
				}
			}
			else if (instance instanceof ViewersAction) {
				var action = "com.elgato.twitch.viewers";
			}
			else if (instance instanceof EmoteChatAction) {
				var action = "com.elgato.twitch.emotechat";
			}
			else if (instance instanceof FollowersChatAction) {
				var action = "com.elgato.twitch.followerschat";

				// If no duration is set for this action
				if (!('followersMin' in settings)) {
					// Set the account automatically to 10 minutes
					settings.followersMin = '10minutes';
				
					// Save the settings
					saveSettings(inContext, settings);
				}
				// If duration string is obsolete
				else if (settings.followersMin in stringMap) {
					// Replace by the right string
					settings.followersMin = stringMap[settings.followersMin];
				
					// Save the settings
					saveSettings(inContext, settings);
				}
			}
			else if (instance instanceof SlowChatAction) {
				var action = "com.elgato.twitch.slowchat";

				// If no duration is set for this action
				if (!('slowSec' in settings)) {
					// Set the account automatically to 120
					settings.slowSec = 120;
			
					// Save the settings
					saveSettings(inContext, settings);
				}
			}
			else if (instance instanceof SubChatAction) {
				var action = "com.elgato.twitch.subchat";
			}		

			// If no account is set for this action
			if (!('accountId' in settings)) {
				// Sort the accounts alphabatically
				var accountIDsSorted = Object.keys(cache.data).sort(function(a, b) {
					return cache.data[a].name.localeCompare(cache.data[b].name);
				});

				// Set the account automatically to the first one
				settings.accountId = accountIDsSorted[0];

				// Save the settings
				saveSettings(inContext, settings);
			}
		}

		// If a callback function was given
		if (inCallback != undefined) {
			// Execute the callback function
			inCallback();
		}
	}
};
