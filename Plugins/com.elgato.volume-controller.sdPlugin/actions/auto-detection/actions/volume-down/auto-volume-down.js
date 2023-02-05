/// <reference path="../../../../app.js" />

const autoVolumeDownAction = new Action(ACTION.autoVolDown);
autoVolumeDownAction.isDown = false;

autoVolumeDownAction.onWillAppear(({ context, payload, device }) => {
	const { coordinates } = payload;
	const { column } = coordinates;
	const deckDevice = deckDevices.get(device);

	if (!deckDevice) return;

	const deckColumn = deckDevice.autoColumns[column - deckDevice.startColumnOffset];
	const index = deckDevices.get(device).getAppIndexFromColumn(column);
	const hideInactiveApps = globalSettings && globalSettings[device]?.showApps == 'active';
	const apps = audioRouter.getAppsArray(hideInactiveApps);
	const app = apps[index];
	const upContext = deckDevice.autoColumns[column - deckDevice.startColumnOffset].volumeUpKey;

	DeckDevice.setVolumeSliderImages(upContext, context, app);

	// store the key context and app to use when an app is added, removed, or updated
	deckColumn.volumeDownKey = context;
	deckColumn.processID = app?.processID;
});

autoVolumeDownAction.onKeyDown((jsn) => {
	autoVolumeDownAction.isDown = true;
	decrementVolume(jsn);
});

autoVolumeDownAction.onKeyUp(() => {
	autoVolumeDownAction.isDown = false;
});

autoVolumeDownAction.onPropertyInspectorDidAppear(({ context }) => {
	piContext = context;
	piAction = ACTION.autoVolDown;

	$SD.sendToPropertyInspector(context, autoAction.UUID, {
		globalSettings,
		connected: audioRouter.isConnected,
	});
});

function decrementVolume({ context, device, payload }) {
	if (!autoVolumeDownAction.isDown) return;
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
	const upContext = deckDevice.autoColumns[column - deckDevice.startColumnOffset].volumeUpKey;

	if (AppUtils.canActivelyAdjustVolume(app)) {
		const { volume, processID } = app;
		const newVolume = DeckDevice.getNewVolume(volume, -1, volumeStep);

		audioRouter.requestAppSetVolume(processID, newVolume);
	} else {
		$SD.showAlert(context);
	}

	if (autoVolumeDownAction.isDown) {
		setTimeout(() => decrementVolume({ context, device, payload }), 200);
	}
}
