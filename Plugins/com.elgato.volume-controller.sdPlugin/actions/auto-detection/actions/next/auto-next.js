/// <reference path="../../../../app.js" />

const autoNextAction = new Action(ACTION.autoNext);

autoNextAction.onWillAppear(({ context, device }) => {
	const hideInactiveApps = globalSettings && globalSettings[device]?.showApps == 'active';
	const appCount = audioRouter.getAppsArray(hideInactiveApps).length;
	const deckDevice = deckDevices.get(device);

	if (!deckDevice) return;

	deckDevice.setNextKeyImage(context, appCount);

	// store the key context to use when a new app is added or removed
	deckDevice.nextKey = context;
});

autoNextAction.onKeyUp(({ context, device }) => {
	if (!audioRouter.isConnected) {
		$SD.showAlert(context);
		$SD.logMessage('Audio Router is not running!');
		return;
	}

	const hideInactiveApps = globalSettings && globalSettings[device]?.showApps == 'active';
	const apps = audioRouter.getAppsArray(hideInactiveApps);

	deckDevices.get(device).nextPage(apps);
});

autoNextAction.onPropertyInspectorDidAppear(({ context }) => {
	piContext = context;
	piAction = ACTION.autoNext;

	$SD.sendToPropertyInspector(context, autoAction.UUID, {
		globalSettings,
		connected: audioRouter.isConnected,
	});
});
