//==============================================================================
/**
@file       action.js
@brief      Streamlabs Plugin
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
		if (!('account' in inData.settings)) {
			log('No account configured');
			showAlert(inData.context);
			return;
		}
	
		// Check if the configured account is in the cache
		if (!(inData.settings.account in cache.data)) {
			log('Account ' + inData.settings.account + ' not found in cache');
			showAlert(inData.context);
			return;
		}

		// Find the configured account
		var account = cache.data[inData.settings.account];

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

		// Define the target profile for change profile action
		if (instance instanceof ProfileAction) {
			target.profileID = inData.settings.profile;
		}

		// Define the direction for change media volume action
		if (instance instanceof VolumeAction) {
			target.volumeDown = inData.settings.volumeDown;
		}

		// Call the function which send the request
		inCallback(account, target, function (success, error) {
			if (!success) {
				log(error);
				showAlert(inData.context);
			}
			else if (target.state == undefined) {
				showOk(inData.context);
			}
		});
	}

	// Public function to update the states
	this.updateState = function(inAccountID, inState, inKey) {
		// Get the settings and the context
		var settings = this.getSettings();
		var context = this.getContext();

		// Check if any account is configured
		if (!('account' in settings)) {
			return;
		}

		// Check if the target and action accounts match
		if (inAccountID != settings.account) {
			return;
		}

		// Set the new action state
		setState(context, inState ? 1 : 0);
		
		// Check if the configured account is in the cache
		if (!(settings.account in cache.data)) {
			return;
		}

		// Find the configured account
		var account = cache.data[settings.account];

		// Update the cache state
		account.states[inKey] = inState;
	}

	// Private function to set the defaults
	function setDefaults(inCallback) {
		// If at least one account is paired
		if (Object.keys(cache.data).length > 0) {
			// Find out type of action
			if (instance instanceof AlertAction) {
				var action = "com.elgato.streamlabs.alert";
			}
			else if (instance instanceof SkipAction) {
				var action = "com.elgato.streamlabs.alert.skip";
			}
			else if (instance instanceof MuteAction) {
				var action = "com.elgato.streamlabs.alert.mute";
			}
			else if (instance instanceof PauseAction) {
				var action = "com.elgato.streamlabs.alert.pause";
			}
			else if (instance instanceof SpinWheelAction) {
				var action = "com.elgato.streamlabs.spinwheel";
			}
			else if (instance instanceof PlayCreditsAction) {
				var action = "com.elgato.streamlabs.playcredits";
			}
			else if (instance instanceof EmptyJarAction) {
				var action = "com.elgato.streamlabs.emptyjar";
			}
			else if (instance instanceof ProfileAction) {
				var action = "com.elgato.streamlabs.changeprofile";
			}
			else if (instance instanceof AutoplayAction) {
				var action = "com.elgato.streamlabs.media.autoplay";
			}
			else if (instance instanceof AutoShowAction) {
				var action = "com.elgato.streamlabs.media.autoshow";
			}
			else if (instance instanceof BackupListAction) {
				var action = "com.elgato.streamlabs.media.backuplist";
			}
			else if (instance instanceof ModerationAction) {
				var action = "com.elgato.streamlabs.media.moderation";
			}
			else if (instance instanceof PauseMediaAction) {
				var action = "com.elgato.streamlabs.media.pause";
			}
			else if (instance instanceof PlaybackAction) {
				var action = "com.elgato.streamlabs.media.playback";
			}
			else if (instance instanceof RequestAction) {
				var action = "com.elgato.streamlabs.media.request";
			}
			else if (instance instanceof SkipVideoAction) {
				var action = "com.elgato.streamlabs.media.skip";
			}
			else if (instance instanceof VolumeAction) {
				var action = "com.elgato.streamlabs.media.volume";
			}

			// If no account is set for this action
			if (!('account' in settings)) {
				// Sort the accounts alphabatically
				var accountIDsSorted = Object.keys(cache.data).sort(function(a, b) {
					return cache.data[a].name.localeCompare(cache.data[b].name);
				});

				// Set the account automatically to the first one
				settings.account = accountIDsSorted[0];

				// Save the settings
				saveSettings(action, inContext, settings);
			}
		}

		// If a callback function was given
		if (inCallback != undefined) {
			// Execute the callback function
			inCallback();
		}
	}
};
