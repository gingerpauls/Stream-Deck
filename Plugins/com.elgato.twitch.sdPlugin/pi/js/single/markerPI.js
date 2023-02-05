//==============================================================================
/**
@file       markerPI.js
@brief      Twitch Plugin
@copyright  (c) 2020, Corsair Memory, Inc.
            This source code is licensed under the MIT-style license found in the LICENSE file.
**/
//==============================================================================

function MarkerPI(inContext, inLanguage) {
    // Inherit from PI
    PI.call(this, inContext, inLanguage);

    // Add warning message
    document.getElementById('placeholder').innerHTML = PI.getWarning('live-warning');
}
