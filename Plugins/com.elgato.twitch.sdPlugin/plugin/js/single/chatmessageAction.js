//==============================================================================
/**
@file       chatmessageAction.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a chat message action
function ChatMessageAction(inContext, inSettings) {
	// Init ChatMessageAction
	var instance = this;

	// Inherit from Action
	Action.call(this, inContext, inSettings);

	// Before overwriting parrent method, save a copy of it
	var actionOnKeyUp = this.onKeyUp;

	// Public function called on key up event
	this.onKeyUp = function(inData, inCallback) {
		// Call actions onKeyUp method
		actionOnKeyUp.call(this, inData, send);
		inCallback();
	};

	// Private function called for sending a message
	function send(account, target) {
		ircSockets[account.id].sendMsg(target);
	}

	// Add event listeners
	document.addEventListener('message', function (evt) {
		instance.showSuccess.call(instance, evt.detail.account, evt.detail.value);
	});
};
