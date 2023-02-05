//==============================================================================
/**
@file       slowchatAction.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a slow chat action
function SlowChatAction(inContext, inSettings) {
	// Init SlowChatAction
	var instance = this;

	// Inherit from Action
	Action.call(this, inContext, inSettings);

	// Before overwriting parrent method, save a copy of it
	var actionOnKeyUp = this.onKeyUp;

	// Public function called on key up event
	this.onKeyUp = function(inData, inCallback) {
		// Define the state key
		inData.key = 'slow';

		// Call actions onKeyUp method
		actionOnKeyUp.call(this, inData, send);
		inCallback();
	};

	// Private function called for sending a message
	function send(account, target) {
		var data = {};
		data.message = (target.state ? "/slow " + target.duration : "/slowoff");
		ircSockets[account.id].sendMsg(data);
	}

	// Add event listeners
	document.addEventListener('/slow', function (evt) {
		instance.showSuccess.call(instance, evt.detail.account, evt.detail.value);
	});
	document.addEventListener('slow', function (evt) {
		instance.updateState.call(instance, evt.detail.account, evt.detail.value, 'slow');
	});
};
