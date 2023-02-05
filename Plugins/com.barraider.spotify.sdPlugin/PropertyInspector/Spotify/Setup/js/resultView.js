function loadFailedView() {
    console.log("loadFailedView called!");
    if (timerPairingTimeout) {
        clearTimeout(timerPairingTimeout);
        timerPairingTimeout = null;
    }

    setStatusBar('result');

    // Fill the title
    document.getElementById('title').innerHTML = localization['Result']['FailTitle'];

    document.getElementById('app-over').className = "ellipseFail ellipseTopLeft";
    document.getElementById('br-over').className = "ellipseFail ellipseBottomRight";

    // Fill the content area
    var content = "<p>" + localization['Result']['FailDescription'] + "<span class='button discord marginLeft0' id='discord'><img src='./images/discord.png'>DISCORD</span></p> \
                  <br/><br/> \
                   <div class='button' id='failRetry'>" + localization['Result']['FailRetry'] + "</div>"; 
//                   <div class='button-transparent' id='close'>" + localization['Result']['Close'] + "</div>";
    document.getElementById('content').innerHTML = content;

    document.getElementById("close").addEventListener("click", close);
    document.getElementById("failRetry").addEventListener("click", failRetry);
    document.getElementById("discord").addEventListener("click", discord);

    // Close this window
    function close() {
        window.close();
    }

    function failRetry() {
        console.log("failRetry called!");
        // Remove event listener
        document.removeEventListener("close", close);
        document.removeEventListener("failRetry", failRetry);

        // Todo: Need to check why updateAPIKeys doesn't work in second round
        //loadIntroView();
        window.close();
    }

    function discord() {
        window.opener.openDiscord();
    }
}

// Load the results view
function loadSuccessView() {
    console.log("loadSuccessView called!");
    if (timerPairingTimeout) {
        clearTimeout(timerPairingTimeout);
        timerPairingTimeout = null;
    }

    // Set the status bar
    setStatusBar('result');

    // Fill the title
    document.getElementById('title').innerHTML = localization['Result']['SuccessTitle'];

    document.getElementById('title').className = "success";

    document.getElementById('app-over').className = "borderLink";
    document.getElementById('br-over').className = "";
    document.getElementById('app-logo').className = "app-logo borderDone";
    document.getElementById('br-logo').className = "br-logo borderDone";

    // Fill the content area
    // Fill the content area
    var content = "<p>" + localization['Result']['SuccessDescription'] + "</p>";
    document.getElementById('content').innerHTML = content;

    // Show the bar-box
    document.getElementById('bar-box').style.display = "";

    // Add event listener
    document.addEventListener("enterPressed", close);
    document.getElementById("discord").addEventListener("click", discord);
    document.getElementById("twitter").addEventListener("click", twitter);
    
    // Close this window
    function close() {
        window.close();
    }

    function discord() {
        window.opener.openDiscord();
    }

    function twitter() {
        window.opener.openTwitter();
    }
}
