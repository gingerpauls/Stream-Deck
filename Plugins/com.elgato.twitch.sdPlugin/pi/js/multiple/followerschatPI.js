//==============================================================================
/**
@file       followersPI.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function FollowersChatPI(inContext, inLanguage) {
    // Inherit from PI
    PI.call(this, inContext, inLanguage);

    // Save a copy of a method
    var piSaveSettings = this.saveSettings;   

    // Add duration select
    var duration = (settings.followersMin != undefined ? settings.followersMin : "10minutes");
    var durationList = "<div class='sdpi-item'> \
            <div class='sdpi-item-label' id='duration-label'></div> \
            <select class='sdpi-item-value select' id='duration-select'> \
                    <option id='duration-0m' value=''></option> \
                    <option id='duration-10m' value='10minutes'></option> \
                    <option id='duration-30m' value='30minutes'></option> \
                    <option id='duration-1h' value='1hour'></option> \
                    <option id='duration-1d' value='1day'></option> \
                    <option id='duration-1w' value='1week'></option> \
                    <option id='duration-1M' value='1month'></option> \
                    <option id='duration-3M' value='3months'></option> \
            </select> \
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
        document.getElementById('duration-0m').innerHTML = tr("Duration_0m");
        document.getElementById('duration-10m').innerHTML = tr("Duration_10m");
        document.getElementById('duration-30m').innerHTML = tr("Duration_30m");
        document.getElementById('duration-1h').innerHTML = tr("Duration_1h");
        document.getElementById('duration-1d').innerHTML = tr("Duration_1d");
        document.getElementById('duration-1w').innerHTML = tr("Duration_1w");
        document.getElementById('duration-1M').innerHTML = tr("Duration_1M");
        document.getElementById('duration-3M').innerHTML = tr("Duration_3M");
    };

    // Duration select changed
    function durationChanged(inEvent) {
        settings.followersMin = inEvent.target.value;
        piSaveSettings();
    }
}
