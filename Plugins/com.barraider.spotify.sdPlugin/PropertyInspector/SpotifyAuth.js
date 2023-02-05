window.opener.document.addEventListener('tokenExists', function () {
    console.log("Closing...");
    this.close();
});

function showPleaseWait() {
    var dvPleaseWait = document.getElementById('dvPleaseWait');
    dvPleaseWait.style.display = "";
}