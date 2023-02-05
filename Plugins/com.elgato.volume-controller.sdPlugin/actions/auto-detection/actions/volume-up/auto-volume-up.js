/// <reference path="../../../../app.js" />

const autoVolumeUpAction = new Action(ACTION.autoVolUp);
autoVolumeUpAction.isDown = false;

autoVolumeUpAction.onWillAppear(({ context, payload, device }) => {
	const { coordinates } = payload;
	const { column } = coordinates;
	const deckDevice = deckDevices.get(device);

	if (!deckDevice) return;

	const deckColumn = deckDevice.autoColumns[column - deckDevice.startColumnOffset];
	const index = deckDevices.get(device).getAppIndexFromColumn(column);
	const hideInactiveApps = globalSettings && globalSettings[device]?.showApps == 'active';
	const apps = audioRouter.getAppsArray(hideInactiveApps);
	const app = apps[index];
	const downContext = deckDevice.autoColumns[column - deckDevice.startColumnOffset].volumeDownKey;

	DeckDevice.setVolumeSliderImages(context, downContext, app);

	// store the key context and app to use when an app is added, removed, or updated
	deckColumn.volumeUpKey = context;
	deckColumn.processID = app?.processID;
});

autoVolumeUpAction.onKeyDown((jsn) => {
	autoVolumeUpAction.isDown = true;
	incrementVolume(jsn);
});

autoVolumeUpAction.onKeyUp(() => {
	autoVolumeUpAction.isDown = false;
});


autoVolumeUpAction.onPropertyInspectorDidAppear(({ context }) => {
	piContext = context;
	piAction = ACTION.autoVolUp;

	$SD.sendToPropertyInspector(context, autoAction.UUID, {
		globalSettings,
		connected: audioRouter.isConnected,
	});
});


function incrementVolume({ context, device, payload }) {
	if (!autoVolumeUpAction.isDown) return;
	if (!audioRouter.isConnected) {
		$SD.showAlert(context);
		$SD.logMessage('Audio Router is not running!');
		return;
	}

	const { coordinates } = payload;
	const { column } = coordinates;
	const deckDevice = deckDevices.get(device);
	if (!deckDevice) return;
	const volumeStep = deckDevice.volumeStep;
	const index = deckDevice.getAppIndexFromColumn(column);
	const hideInactiveApps = globalSettings && globalSettings[device]?.showApps == 'active';
	const apps = audioRouter.getAppsArray(hideInactiveApps);
	const app = apps[index];
	const downContext = deckDevice.autoColumns[column - deckDevice.startColumnOffset].volumeDownKey;

	if (AppUtils.canActivelyAdjustVolume(app)) {
		const { volume, processID } = app;
		const newVolume = DeckDevice.getNewVolume(volume, 1, volumeStep);

		audioRouter.requestAppSetVolume(processID, newVolume);
	} else {
		$SD.showAlert(context);
	}

	if (autoVolumeUpAction.isDown) {
		setTimeout(() => incrementVolume({ context, device, payload }), 200);
	}
}
