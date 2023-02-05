class AudioRequest {
	type;
	deckDeviceId;

	constructor(type, deckDeviceId) {
		this.type = type;
		this.deckDeviceId = deckDeviceId ?? null;
	}
}
