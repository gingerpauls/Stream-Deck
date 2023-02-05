//==============================================================================
/**
@file       followerschatAction.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a followers chat action
function FollowersChatAction(inContext, inSettings) {
	// Init FollowersChatAction
	var instance = this;

	// Inherit from Action
	Action.call(this, inContext, inSettings);

	// Before overwriting parrent method, save a copy of it
	var actionOnKeyUp = this.onKeyUp;

	// Public function called on key up event
	this.onKeyUp = function(inData, inCallback) {
		// Define the state key
		inData.key = 'followers-only';

		// Call actions onKeyUp method
		actionOnKeyUp.call(this, inData, send);
		inCallback();
	};

	// Private function called for sending a message
	function send(account, target) {
		var data = {};
		data.message = (target.state ? "/followers " + target.duration : "/followersoff");
		ircSockets[account.id].sendMsg(data);
	}

	// Add event listeners
	document.addEventListener('/followers', function (evt) {
		instance.showSuccess.call(instance, evt.detail.account, evt.detail.value);
	});
	document.addEventListener('followers-only', function (evt) {
		instance.updateState.call(instance, evt.detail.account, evt.detail.value, 'followers-only');
	});
};
