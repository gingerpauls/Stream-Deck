//==============================================================================
/**
@file       openlastclipAction.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents an open last clip action
function OpenLastClipAction(inContext, inSettings) {
	// Inherit from Action
	Action.call(this, inContext, inSettings);

	// Before overwriting parrent method, save a copy of it
	var actionOnKeyUp = this.onKeyUp;

	// Public function called on key up event
	this.onKeyUp = function(inData, inCallback) {
		// Call actions onKeyUp method
		actionOnKeyUp.call(this, inData, open);
		inCallback();
	};

	// Private function called for the last clip opening
	function open(account, target, callback) {
		if (account.lastclip == undefined) {
			callback(false, "Invalid key press: Could not open last clip");
		}
		else {
			openUrl(account.lastclip); 
			callback(true, account.lastclip);
		}
	}
};
