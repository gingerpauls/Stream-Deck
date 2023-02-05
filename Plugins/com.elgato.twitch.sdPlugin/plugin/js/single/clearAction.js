//==============================================================================
/**
@file       clearAction.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a clear chat action
function ClearAction(inContext, inSettings) {
	// Init ClearAction
	var instance = this;

	// Inherit from Action
	Action.call(this, inContext, inSettings);

	// Before overwriting parrent method, save a copy of it
	var actionOnKeyUp = this.onKeyUp;

	// Public function called on key up event
	this.onKeyUp = function(inData, inCallback) {
		// Call actions onKeyUp method
		actionOnKeyUp.call(this, inData, clear);
		inCallback();
	};

	// Private function called for clearing the chat
	function clear(account) {
		var data = {};
		data.message = "/clear";
		ircSockets[account.id].sendMsg(data);
	}

	// Add event listeners
	document.addEventListener('/clear', function (evt) {
		instance.showSuccess.call(instance, evt.detail.account, evt.detail.value);
	});
};
