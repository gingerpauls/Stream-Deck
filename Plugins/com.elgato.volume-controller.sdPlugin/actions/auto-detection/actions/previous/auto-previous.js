/// <reference path="../../../../app.js" />

const autoPreviousAction = new Action(ACTION.autoPrev);

autoPreviousAction.onWillAppear(({ context, device }) => {
	const deckDevice = deckDevices.get(device);

	if (!deckDevice) return;

	deckDevice.setPreviousKeyImage(context);

	// store the key context to use when a new app is added or removed
	deckDevice.previousKey = context;
});
autoPreviousAction.onKeyUp(({ context, device }) => {
	if (!audioRouter.isConnected) {
		$SD.showAlert(context);
		$SD.logMessage('Audio Router is not running!');
		return;
	}

	const hideInactiveApps = globalSettings && globalSettings[device]?.showApps == 'active';
	const apps = audioRouter.getAppsArray(hideInactiveApps);

	deckDevices.get(device).previousPage(apps);
});
autoPreviousAction.onPropertyInspectorDidAppear(({ context }) => {
	piContext = context;
	piAction = ACTION.autoPrev;

	$SD.sendToPropertyInspector(context, autoAction.UUID, {
		globalSettings,
		connected: audioRouter.isConnected,
	});
});
