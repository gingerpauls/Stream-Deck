/// <reference path="../../app.js" />

const backToProfileAction = new Action(ACTION.back);

backToProfileAction.onKeyUp(({ context, device }) => {
	const deckDevice = deckDevices.get(device);
	if (deckDevice.enableBackToProfile) {
		$SD.setImage(context, Images.blank);
		deckDevice.clearAllImages();
		$SD.switchToProfile(device);
	}
});

backToProfileAction.onWillAppear(({ context, device }) => {
	if (deckDevices.get(device)?.enableBackToProfile) {
		$SD.setImage(context, Images.back);
	} else {
		$SD.setImage(context, Images.blank);
	}
});

backToProfileAction.onWillDisappear(({ context, device }) => {
	if(deckDevices.get(device)){
		deckDevices.get(device).enableBackToProfile = false;
	}
	$SD.setImage(context, Images.blank);
});

backToProfileAction.onPropertyInspectorDidAppear(({ context }) => {
	piContext = context;
	piAction = ACTION.back;

	$SD.sendToPropertyInspector(context, autoAction.UUID, {
		globalSettings,
		connected: audioRouter.isConnected,
	});
});