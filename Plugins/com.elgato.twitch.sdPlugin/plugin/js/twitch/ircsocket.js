//==============================================================================
/**
@file       ircsocket.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

// Prototype which represents a Twitch IRC socket
function IrcSocket(accountID = null) {
    // Init IrcSocket
    var instance = this;
    var socket;

    // Exit case variables
    var closedByUser; // True if user close the socket
    var canReconnect; // Remaining connection attempts

    // Define the account data
    var accountChannel;
    var accountToken;

    // Function called to connect the socket
    this.connect = function(callback) {
        // Update account data
        updateData(accountID);

        // Initialize the websocket
        socket = new WebSocket("wss://irc-ws.chat.twitch.tv:443");

        // Web socket is initialized
        socket.onopen = function () {
            // Set the exit case variables
            closedByUser = false;
            canReconnect = 5;

            // Join the channel
            joinChannel(accountChannel, accountToken, callback);
        }

        // Web socked received a message
        socket.onmessage = function (event) {
            // Handle socket messages
            handleMessage(event);
        }

        // Web socket is closed
        socket.onclose = function () {
            // If socket was closed on purpose
            if (closedByUser) {
                return;
            }
            // If no reconnection attempts left
            if (!canReconnect) {
                return;
            }
            // Connect the socket in 5s
            setTimeout(instance.connect, 5000);
            canReconnect--;
        }

        // Web socket error detected
        socket.onerror = function () {
            // Log error message
            log("IRC Websocket error");
            
            if (callback) {
                // Send the failure event
                callback(false);
            }
        }
    }

    // Function called to reconnect the socket
    this.reconnect = function() {
        // Update account data
        updateData(accountID);

        // Join the channel
        joinChannel(accountChannel, accountToken); 
    }

    // Function called to send a message or command
    this.sendMsg = function(data) {
        // Send to the channel
        sendToChannel(accountChannel, data.message, data.context);
    }

    // Function called to disconnect the socket
    this.disconnect = function() {
        // Leave the channel
        leaveChannel(accountChannel);

        // Close the socket
        closedByUser = true;
        closeSocket(); 
    }

    // Private function called to update the account data
    function updateData(id) {
        // Check if the account is in the cache
        if (!(id in cache.data)) {
            return;
        }
        // Find the configured account
        var account = cache.data[id];
        
        // Check if the account has a name
        if (!('name' in account)) {
            return;
        }
        // Check if the account name is valid
        if (account.name == null) {
            return;
        }
        // Retrieve the channel name
        accountChannel = account.name.toString().toLowerCase();
        accountToken = account.token;
    }

    // Private function called to join a channel
    function joinChannel(channel, token, callback) {
        if (!socket) {
            if (callback) {
                // Send the failure event
                callback(false);
            }
            return;
        }
        // Set password and nickname
        socket.send("PASS oauth:" + token);
        socket.send("NICK " + channel);
        
        // Request the commands and tags in order to get notified when the ROOMSTATE changes:
        // when a user joins a channel or a room setting is changed.
        socket.send("CAP REQ :twitch.tv/commands twitch.tv/tags");
        
        // Join the channel
        socket.send("JOIN #" + channel); 

        if (callback) {
            // Send the message
            callback(true);
        }
    }

    // Function called to send a message to a channel
    function sendToChannel(channel, message, context) {
        var send = function(success) {
            if (success) {
                // Split multiple line messages
                message.split('\n').forEach((line) => {
                    // Send the line
                    socket.send("PRIVMSG #" + channel + " :" + line);
                });
            }

            // Get the first word
            var cmd = message.split(' ')[0];

            // If simple message
            if (cmd[0] != '/') {
                // Send the success or failure event
                sendEvent('message', success && context);
            }
            // If IRC command
            else {
                // Send the success or failure event
                sendEvent(cmd.split('off')[0], success);                
            }
        };

        if (!socket) {
            // Reconnect socket first
            instance.connect(send);
        }
        else if (socket.readyState != 1) {
            // Reconnect socket first
            instance.connect(send);
        }
        else {
            // Send the message
            send(true);
        }
    }

    // Private function called to leave a channel
    function leaveChannel(channel) {
        if (!socket) {
            return;
        }
        // Leave the channel
        socket.send("PART #" + channel);
        
    } 

    // Private function called to close the socket
    function closeSocket() {
        if (!socket) {
            return;
        }
        // Close the socket
        socket.close();
    } 

    // Private function called to handle messages
    function handleMessage(inEvent) {
        if ('data' in inEvent) {
            var strings = inEvent.data.split('\n');
            var lastIndex = strings.length - 1;
            if (lastIndex > 0) {
                strings.pop(lastIndex);
            }
            // Handle one line at a time
            strings.forEach(handleTagMessage);
        }
    }

    // Private function called to handle tag messages
    function handleTagMessage(inString) {
        var message = parseTagString(inString);
        
        if (message.command == "ROOMSTATE") {
            var keys = ["emote-only", "followers-only", "subs-only", "slow"];
            if (Object.keys(message.tags).length > 0) {
                Object.keys(message.tags).forEach(key => {
                    if (keys.includes(key)) {
                        if (key == "followers-only") {
                            // Send the state change event
                            sendEvent(key, message.tags[key] >= 0 ? true : false)
                        }
                        else {
                            // Send the state change event
                            sendEvent(key, message.tags[key] != 0 ? true : false)
                        }
                    }
                }); 
            }
        }
        else if (message.command == "NOTICE") {    
            log(message.text);
        }
    }

    // Private function called to parse the tag data
    function parseTagString(inString) {
        var message = {};
        if (inString != null) {
            if (inString[0] == '@') {
                if (inString.includes(' ')) {
                    var data = inString.split(' ');
                    if (data.length > 3) {
                        message.tags = parseIRCTags(data[0].substring(1));
                        message.url = data[1].substring(1);
                        message.command = data[2];
                        message.channel = data[3].substring(1);
                    }
                    if (data.length > 4) {
                        message.text = data.slice(4).join(' ').substring(1);
                    }
                }
            }        
        }
        return message;
    }

    // Private function called to parse the tags data
    function parseIRCTags(inData) {
        var tagsMap = {};
        var tags = inData.split(';');
        tags.forEach(tag => {
            var pair = tag.split('=');
            if (pair.length == 2) {
                // real key=value pair
                tagsMap[pair[0]] = pair[1].replace("\\:", ";").replace("\\s", " ").replace("\\\\", "\\").replace("\\r", "\r").replace("\\n", "\n");
            }
        });
        return tagsMap;
    }

    // Private function called to send events for the actions
    function sendEvent(name, value) {
        var event = new CustomEvent(name, {
            detail: {
                account: accountID,
                value: value
            }
        });
        document.dispatchEvent(event);
    }
};