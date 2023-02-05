/// <reference path="../../../../../libs/js/property-inspector.js" />
/// <reference path="../../../../../libs/js/utils.js" />

const propertyInspector = document.getElementById('property-inspector');
const connectMessage = document.getElementById('unable-to-connect');
let listening = false;

$SD.onConnected(({ actionInfo }) => {
	const { action } = actionInfo;

	if (action && !listening) {
		$SD.onSendToPropertyInspector(action, ({ payload: { connected } }) => {
			if (!connected) {
				connectMessage.style.display = 'block';
				propertyInspector.style.display = 'none';
				return;
			} else {
				connectMessage.style.display = 'none';
				propertyInspector.style.display = 'block';
			}
		});
	}
});
