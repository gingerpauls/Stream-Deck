/// <reference path="../../app.js" />

const autoAction = new Action(ACTION.auto);

autoAction.onKeyUp(({ context, device, payload }) => {
	if (!audioRouter.isConnected) {
		$SD.showAlert(context);
		$SD.logMessage('Audio Router is not running!');
		return;
	}

	const deckDevice = deckDevices.get(device);

	if (deckDevice) {
		const volumeStep = payload?.settings?.volumeStep;
		if (volumeStep) {
			deckDevice.volumeStep = volumeStep;
		}

		deckDevice.enableBackToProfile = true;
		deckDevice.openAutoProfile(context);
	} else {
		const message = 'Deck device not found!';
		$SD.showAlert(context);
		console.error(message);
		$SD.logMessage(message);
	}
});

autoAction.onDidReceiveSettings(({ device, payload: { settings } }) => {
	const deckDevice = deckDevices.get(device);

	if (!deckDevice) return;

	if (deckDevice) {
		deckDevice.settings = settings;
	}
});

autoAction.onPropertyInspectorDidAppear(({ context }) => {
	piContext = context;
	piAction = ACTION.auto;

	$SD.sendToPropertyInspector(context, autoAction.UUID, {
		globalSettings,
		connected: audioRouter.isConnected,
	});
});