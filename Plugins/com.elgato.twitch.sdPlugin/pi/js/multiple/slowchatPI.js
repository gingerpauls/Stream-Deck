//==============================================================================
/**
@file       slowchatPI.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function SlowChatPI(inContext, inLanguage) {
    // Inherit from PI
    PI.call(this, inContext, inLanguage);

    // Save a copy of a method
    var piSaveSettings = this.saveSettings;    

    // Add duration select
    var duration = (settings.slowSec != undefined ? settings.slowSec : 120);
    var durationList = "<div class='sdpi-item'> \
            <div class='sdpi-item-label' id='duration-label'></div> \
            <select class='sdpi-item-value select' id='duration-select'> \
                    <option>1</option> \
                    <option>3</option> \
                    <option>5</option> \
                    <option>10</option> \
                    <option>15</option> \
                    <option>30</option> \
                    <option>60</option> \
                    <option>120</option> \
            </select> \
            <span id='second-label'></span> \
        </div>";
    document.getElementById('placeholder').innerHTML = durationList;
    document.getElementById('duration-select').value = duration;

    // Add event listener
    document.getElementById('duration-select').addEventListener("change", durationChanged); 

    // Before overwriting parrent method, save a copy of it
    var piLocalize = this.localize;

    // Localize the UI
    this.localize = function (tr) {
        // Call PIs localize method
        piLocalize.call(this, tr);

        document.getElementById('duration-label').innerHTML = tr("Duration");
        document.getElementById('second-label').innerHTML = tr("Second");
   };

    // Duration select changed
    function durationChanged(inEvent) {
        settings.slowSec = inEvent.target.value;
        piSaveSettings();
    }
}
