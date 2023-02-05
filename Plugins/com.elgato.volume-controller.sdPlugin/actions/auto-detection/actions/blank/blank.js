const blankAction = new Action(ACTION.blank);

blankAction.onPropertyInspectorDidAppear(({ context }) => {
	piContext = context;
	piAction = ACTION.blank;

	$SD.sendToPropertyInspector(context, blankAction.UUID, {
		globalSettings,
		connected: audioRouter.isConnected,
	});
});