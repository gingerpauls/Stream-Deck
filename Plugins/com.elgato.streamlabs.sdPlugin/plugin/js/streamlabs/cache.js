//==============================================================================
/**
@file       cache.js
@brief      Streamlabs Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype for a data cache
function Cache() {
		// Init Cache
		var instance = this;

		// Public variable containing the cached data
		this.data = {};

		// Private function to build a cache
		this.update = function () {
				var newData = {};

				// If some accounts are paired
				if (globalSettings.accounts != undefined) {
				
						globalSettings.accounts.forEach(function (inAccount) {
								// Create account
								var newAccount = { };
								newAccount.id = inAccount.uniqueIdentifier;
								newAccount.name = inAccount.displayName;
								newAccount.token = inAccount.token;
								newAccount.states = { };

								// Store new account
								newData[newAccount.id] = newAccount;
						});
				}

				// Remove old accounts
				Object.keys(instance.data).forEach(function (accountID) {
						// If the cached account still exists
						if (accountID in newData) {
								return;
						}

						// Remove account from the cache
						delete instance.data[accountID];
				});

				// Add new accounts
				Object.keys(newData).forEach(function (newAccountID) {
						// If the account already cached
						if (newAccountID in instance.data) {
								return;
						}

						// Add account to the cache
						instance.data[newAccountID] = newData[newAccountID];

						// Initialize the account socket
						new Socket(newAccountID);
				});

				// Inform keys that updated cache is available
				var event = new CustomEvent('newCacheAvailable');
				document.dispatchEvent(event);
		};
};
