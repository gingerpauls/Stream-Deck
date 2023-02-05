/// <reference path="../../../../app.js" />

// TODO: Investigate flicker when goingt to auto profile without full app list

const autoVolumeAction = new Action(ACTION.autoVol);

autoVolumeAction.onDialPress(({ device, payload, context }) => {
	if (payload?.pressed) return;

	if (!audioRouter.isConnected) {
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

autoVolumeAction.onTouchTap(({ device, payload, context }) => {
	if (!audioRouter.isConnected) {
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

autoVolumeAction.onWillAppear(({ context, device, payload }) => {
	const { coordinates } = payload;
	const { column } = coordinates;
	const deckDevice = deckDevices.get(device);
	if (!deckDevice) return;
	const deckColumn = deckDevice.autoColumns[column - deckDevice.startColumnOffset];
	const index = deckDevice.getAppIndexFromColumn(column);
	const hideInactiveApps = globalSettings && globalSettings[device]?.showApps == 'active';
	const apps = audioRouter.getAppsArray(hideInactiveApps);
	const app = apps[index];

	DeckDevice.setFeedbackImage(context, app);

	// store the context and app to use when an app is added, removed, or updated
	deckColumn.volumeDial = context;
	deckColumn.processID = app?.processID;
});

autoVolumeAction.onDialRotate(({ device, payload, context }) => {
	if (!audioRouter.isConnected) {
		$SD.logMessage('Audio Router is not running!');
		return;
	}

	const { coordinates, ticks } = payload;
	const { column } = coordinates;
	const deckDevice = deckDevices.get(device);
	if (!deckDevice) return;
	const volumeStep = deckDevice.volumeStep;
	const index = deckDevice.getAppIndexFromColumn(column);
	const hideInactiveApps = globalSettings && globalSettings[device]?.showApps == 'active';
	const apps = audioRouter.getAppsArray(hideInactiveApps);
	const app = apps[index];

	if (AppUtils.canActivelyAdjustVolume(app)) {
		const { volume, processID } = app;
		const newVolume = DeckDevice.getNewVolume(volume, ticks, volumeStep);

		audioRouter.requestAppSetVolume(processID, newVolume);
	} else {
		$SD.showAlert(context);
	}
});

autoVolumeAction.onPropertyInspectorDidAppear(({ context }) => {
	piContext = context;
	piAction = ACTION.autoVol;

	$SD.sendToPropertyInspector(context, autoAction.UUID, {
		globalSettings,
		connected: audioRouter.isConnected,
	});
});