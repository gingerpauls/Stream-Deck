/// <reference path="../../../../app.js" />

const autoMuteAction = new Action(ACTION.autoMute);

autoMuteAction.onWillAppear(({ context, device, payload }) => {
	const { coordinates } = payload;
	const { column } = coordinates;
	const deckDevice = deckDevices.get(device);

	if (!deckDevice) return;

	const deckColumn = deckDevice.autoColumns[column - deckDevice.startColumnOffset];
	const index = deckDevice.getAppIndexFromColumn(column);
	const hideInactiveApps = globalSettings && globalSettings[device]?.showApps == 'active';
	const apps = audioRouter.getAppsArray(hideInactiveApps);
	const app = apps[index];

	DeckDevice.setMuteKeyImage(context, app);

	// store the key context and app to use when an app is added, removed, or updated
	deckColumn.muteKey = context;
	deckColumn.processID = app?.processID;
});

autoMuteAction.onKeyUp(({ context, device, payload }) => {
	if (!audioRouter.isConnected) {
		$SD.showAlert(context);
		$SD.logMessage('Audio Router is not running!');
		return;
	}

	const { coordinates } = payload;
	const { column } = coordinates;
	const index = deckDevices.get(device).getAppIndexFromColumn(column);
	const hideInactiveApps = globalSettings && globalSettings[device]?.showApps == 'active';
	const apps = audioRouter.getAppsArray(hideInactiveApps);
	const app = apps[index];

	if (AppUtils.canActivelyAdjustVolume(app)) {
		const { processID, mute } = app;
		audioRouter.requestAppMuteToggle(processID, mute);
	} else {
		$SD.showAlert(context);
	}
});

autoMuteAction.onPropertyInspectorDidAppear(({ context }) => {
	piContext = context;
	piAction = ACTION.autoMute;

	$SD.sendToPropertyInspector(context, autoAction.UUID, {
		globalSettings,
		connected: audioRouter.isConnected,
	});
});
