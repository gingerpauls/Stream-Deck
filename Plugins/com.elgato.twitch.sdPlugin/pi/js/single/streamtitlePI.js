//==============================================================================
/**
@file       streamtitlePI.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function StreamTitlePI(inContext, inLanguage) {
    // Inherit from PI
    PI.call(this, inContext, inLanguage);

    // Save a copy of a method
    var piSaveSettings = this.saveSettings;

    // Add stream & game fields
    var stream = (settings.ChannelStatus != undefined ? settings.ChannelStatus.replace("'", "&apos;") : "");
    var game = (settings.ChannelGameTitle != undefined ? settings.ChannelGameTitle.replace("'", "&apos;") : "");
    var textFields = " \
        <div class='sdpi-item'> \
            <div class='sdpi-item-label' id='stream-label'></div> \
            <input class='sdpi-item-value' id='stream' value='" + stream + "'> \
        </div> \
        <div class='sdpi-item'> \
            <div class='sdpi-item-label' id='game-label'></div> \
            <input class='sdpi-item-value' id='game' value='" + game + "'> \
        </div>";
    document.getElementById('placeholder').innerHTML = textFields;
    if (settings.ChannelGameID) {
        document.getElementById('game').style.fontStyle  = "italic";
    }

    // Add event listeners
    document.getElementById('stream').addEventListener("input", streamChanged); 
    document.getElementById('game').addEventListener("input", gameChanged); 

    // Before overwriting parrent method, save a copy of it
    var piLocalize = this.localize;

    // Localize the UI
    this.localize = function (tr) {
        // Call PIs localize method
        piLocalize.call(this, tr);

        document.getElementById('stream-label').innerHTML = tr("Stream");
        document.getElementById('game-label').innerHTML = tr("Game");
        document.getElementById('stream').placeholder = tr("StreamPlaceholder");
        document.getElementById('game').placeholder = tr("GamePlaceholder");
    };

    // Stream title changed
    function streamChanged(inEvent) {
        settings.ChannelStatus = inEvent.target.value;
        piSaveSettings();
    }

    // Game title changed
    function gameChanged(inEvent) {
        document.getElementById('game').style.fontStyle  = "normal";
        settings.ChannelGameTitle = inEvent.target.value;
        settings.ChannelGameID = undefined;
        piSaveSettings();
    }

    // Show game title
    this.loadGame = function () {
        if (settings.ChannelGameID) {
            document.getElementById('game').value = settings.ChannelGameTitle;
            document.getElementById('game').style.fontStyle  = "italic";
        }
    }
}
