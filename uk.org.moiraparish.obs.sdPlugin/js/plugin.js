const debug = true
// 
const obs = new OBSWebSocket()
const sceneAction = 'uk.org.moiraparish.obs.scene-btn'

const ConnectionState = {
	FAILED: -2,
	DISCONNECTED: -1,
	CONNECTING: 0,
	CONNECTED: 1,
	AUTHENTICATED: 2
}

function printConnectionState() {
	if (debug) console.log(`connectionState = ${connectionState} (${Object.keys(ConnectionState)[Object.values(ConnectionState).indexOf(connectionState)]})`)
}

let settings = {
	host: 'localhost',
	port: '4444',
	password: ''
}

let pluginUUID
let connectionState = ConnectionState.DISCONNECTED
let currentPI
let buttons = {}

let OBS = {
	scenes: [],
	sources: [],
	preset: '1',
	ipaddress: '0.0.0.0',
	studioMode: null,
	preview: '',
	program: '',
	program_sources: [],
	preview_sources: []
}

connect()
function connect() {
	switch (connectionState) {
		case ConnectionState.FAILED:
			if (debug) console.log('FAILED: will not connect')
			break
		case ConnectionState.DISCONNECTED:
			if (debug) console.log('DISCONNECTED: will try to connect')
			obs.connect({
				address: `${settings.host}:${settings.port}`,
				password: settings.password
			})
			break
		case ConnectionState.CONNECTING:
			if (debug) console.log('CONNECTING: nothing to do')
			break
		case ConnectionState.CONNECTED:
			if (debug) console.log('CONNECTED: nothing to do')
			break
		case ConnectionState.AUTHENTICATED:
			if (debug) console.log('AUTHENTICATED: nothing to do')
			break
		default:
			obs.disconnect()
			ConnectionState.DISCONNECTED
	}
}

obs.on('ConnectionOpened', () => {
	connectionState = ConnectionState.CONNECTED
	printConnectionState()
})
obs.on('ConnectionClosed', () => {
	if (connectionState == ConnectionState.FAILED) return
	connectionState = ConnectionState.DISCONNECTED
	printConnectionState()
	OBS.scenes = []
	OBS.sources = []
	clearPreviewButtons()
	clearProgramButtons()
	setButtonsOffline()
})
obs.on('AuthenticationSuccess', () => {
	connectionState = ConnectionState.AUTHENTICATED
	printConnectionState()
	obsUpdateStudioStatus()
	obsUpdateScenes()
	obsUpdateSources()
	updateCameraSettings()
	updateButtons()
	setButtonsOnline()
})
obs.on('AuthenticationFailure', () => {
	connectionState = ConnectionState.FAILED
	printConnectionState()
})

obs.on('ScenesChanged', obsUpdateScenes)
obs.on('PreviewSceneChanged', handlePreviewSceneChanged)
obs.on('SwitchScenes', handleProgramSceneChanged)
obs.on('StudioModeSwitched', handleStudioModeSwitched)
obs.on('SourceCreated', obsUpdateSources)
obs.on('SourceDestroyed', obsUpdateSources)
obs.on('SourceRenamed', obsUpdateSources)

obs.on('Exiting', () => {
	obs.disconnect()
	console.log('OBS Disconnecting')
})

function obsUpdateScenes() {
	obs.send('GetSceneList').then((data) => {
		OBS.scenes = data.scenes.map((s) => {
			return s.name
		})
		if (currentPI) sendUpdatedScenesToPI()
		obs.send('GetCurrentScene').then(handleProgramSceneChanged)
	})
	if (OBS.studioMode) obs.send('GetPreviewScene').then(handlePreviewSceneChanged)
}


function obsUpdateSources() {
	obs.send('GetSourcesList').then((data) => {
		OBS.sources = data.sources.map((s) => {
			return s.name
		})
		if (currentPI) sendUpdatedSourcesToPI()
	})
}

function updateCameraSettings() {
	if (currentPI) sendUpdatedCamSettingsToPI()
}

function obsUpdateStudioStatus() {
	obs.send('GetStudioModeStatus').then((data) => {
		OBS.studioMode = data['studio-mode']
	})
}

function updatePI(e) {
	if (connectionState != ConnectionState.AUTHENTICATED) connect()
	currentPI = {
		context: e.context,
		action: e.action
	}
}

function sendUpdatedScenesToPI() {
	StreamDeck.sendToPI(currentPI.context, sceneAction, {
		scenes: OBS.scenes
	})
}

function sendUpdatedSourcesToPI() {
	StreamDeck.sendToPI(currentPI.context, sceneAction, {
		sources: OBS.sources
	})
}

function sendUpdatedCamSettingsToPI() {
	StreamDeck.sendToPI(currentPI.context, sceneAction, {
		ipaddress: OBS.ipaddress,
		preset: OBS.preset
	})
}


function handleStreamDeckMessages(e) {
	const data = JSON.parse(e.data)
	if (debug) console.log(`${data.event}: `, data)
	switch(data.event) {
		case 'deviceDidConnect':
			StreamDeck.getGlobalSettings(pluginUUID)
			break
		case 'keyDown':
			printConnectionState()
			console.log("Received Key Down", data)
			if (connectionState == ConnectionState.AUTHENTICATED) {
				buttons[data.context].keyDown()
			} else {
				connectionState = ConnectionState.DISCONNECTED
				connect()
				setTimeout(() => {
					if (connectionState == ConnectionState.AUTHENTICATED) {
						buttons[data.context].keyDown()
					} else {
						StreamDeck.sendAlert(data.context)
					}
				}, 10)
			}
			break
		case 'keyUp':
			printConnectionState()
			console.log("Received Key Up", data)
			// Need button repaint to pick up prime changes.
			if (buttons[data.context].primed == true) updateButtons()
			break;
		case 'willAppear':
		case 'titleParametersDidChange':
		case 'didReceiveSettings':
			if (buttons[data.context]) {
				buttons[data.context].processStreamDeckData(data)
			} else {
				let type = ''
				if (data.action == sceneAction) type = 'scene'
				buttons[data.context] = new Button(type, data)
				console.log("didReceiveSettings", data)
				if (type == 'scene') updateButton(data.context)
			}
			break
		case 'willDisappear':
			delete buttons[data.context]
			break
		case 'propertyInspectorDidAppear':
			updatePI(data)
			sendUpdatedScenesToPI()
			sendUpdatedSourcesToPI()
			sendUpdatedCamSettingsToPI()
			break
		case 'didReceiveGlobalSettings':
			handleGlobalSettingsUpdate(data)
			break
		case 'sendToPlugin':
			if (data.payload.updateGlobalSettings) {
				StreamDeck.getGlobalSettings(pluginUUID)
			}
		default:
			if (debug) console.log('Unhandled event:', data)
			break
		case 'keyUp':
			break
	}
}

function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info) {
	if (debug) StreamDeck.debug = true
	pluginUUID = uuid
	StreamDeck._ws = new WebSocket("ws://localhost:" + port)
	StreamDeck._ws.onopen = () => {
		StreamDeck._openHandler(registerEvent, uuid)
	}
	StreamDeck._ws.onmessage = handleStreamDeckMessages
}

function handleGlobalSettingsUpdate(e) {
	if (Object.keys(e.payload.settings).length != 0) settings = e.payload.settings
	if (connectionState > ConnectionState.CONNECTING) {
		obs.disconnect()
		connectionState = ConnectionState.DISCONNECTED
		connect()
	}
}


function handleProgramSceneChanged(e) {
	console.log("Just before Program Scene Change - OBS is", e)
	let _program = ''
	if (e['scene-name']) _program = e['scene-name']
	if (e['name']) _program = e['name']

	if (_program != OBS.program) {
		OBS.program = _program
		// Save the program sources
		if (e['sources'])  {
			src = e['sources']
			OBS.program_sources = src.map((s) => {
				return s.name
			})
		}
		console.log("Program Scene Change - Updated OBS to", OBS)
		updateButtons()
	}
}

function handlePreviewSceneChanged(e) {
	console.log("Just before Preview Scene Change - OBS is", OBS)
	let _preview = ''
	if (e['scene-name']) _preview = e['scene-name']
	if (e['name']) _preview = e['name']

	if (_preview != OBS.preview) {
		OBS.preview = _preview
		// Save the preview sources
		if (e['sources'])  {
			src = e['sources']
			OBS.preview_sources = src.map((s) => {
				return s.name
			})
		}
		console.log("Preview Scene Change - Updated OBS to", OBS)
		updateButtons()
	}
}

function handleStudioModeSwitched(e) {
	OBS.studioMode = e['new-state']
}

function clearProgramButtons() {
	findProgramButtons().forEach((b) => {
		buttons[b].setOffAir()
	})
}
function clearPreviewButtons() {
	findPreviewButtons().forEach((b) => {
		buttons[b].setOffAir()
	})
}

function updateProgramButtons() {
	programButtons = findButtonsByScene(OBS.program)
	// console.log("Updating Program Buttons", OBS, programButtons)
	programButtons.forEach((b) => {
		buttons[b].setProgram()
	})
	findButtonsBySource(OBS.program_sources).forEach((b) => {
		if (!programButtons.includes(b, 0)) buttons[b].setSourceProgram()
	})
}

function updatePreviewButtons() {
	previewButtons = findButtonsByScene(OBS.preview)
	// console.log("Updating Preview Buttons", OBS, previewButtons)
	previewButtons.forEach(b => {
		buttons[b].setPreview()
	})
	findButtonsBySource(OBS.preview_sources).forEach(b => {
		if (!previewButtons.includes(b, 0))  buttons[b].setSourcePreview()
	})
}

function updateButtons() {
	clearPreviewButtons()
	if (OBS.preview != OBS.program) updatePreviewButtons()
	clearProgramButtons()
	updateProgramButtons()
}

function updateButton(context) {
	console.log("UpdateButton", context)
	if (buttons[context].scene == OBS.program) {
		buttons[context].setProgram()
	} else if (buttons[context].scene == OBS.preview) {
		buttons[context].setPreview()
	} else {
		buttons[context].setOffAir()
	}
}

function findButtonsByScene(scene) {
	let output = []
	Object.keys(buttons).forEach((b) => {
		if (buttons[b].scene && buttons[b].scene == scene) {
			output.push(b)
		}
	})
	return output
}


function findButtonsBySource(source_list) {
	let output = []
	Object.keys(buttons).forEach((b) => {
		if (buttons[b].source && source_list.includes(buttons[b].source)) {
			output.push(b)
		}
	})
	return output
}


function findPreviewButtons() {
	let output = []
	Object.keys(buttons).forEach((b) => {
		button_state = keyInactive
		if (buttons[b].state) button_state = buttons[b].state
		if (button_state == keyPreviewPrimed || button_state == keyPreviewNotPrimed || button_state == keySourcePreview) {
			output.push(b)
		}
	})
	return output
}

function findProgramButtons() {
	let output = []
	Object.keys(buttons).forEach((b) => {
		button_state = keyInactive
		if (buttons[b].state) button_state = buttons[b].state
		if (button_state == keyLiveOutput || button_state == keySourceLive) {
			output.push(b)
		}
	})
	return output
}

function clearPrimeButtons() {
	console.log("Clearing Primed Buttons")
	Object.keys(buttons).forEach((b) => {
		// Only work on this current preview scene to check.
		if (buttons[b].scene == OBS.preview) {
			buttons[b].primed = false
		}
	})
}

function setButtonsOffline() {
	console.log("Setting Buttons Online -------------------------------------------------------------")
	Object.values(buttons).forEach((b) => {
		b.setOffline()
	})
}

function setButtonsOnline() {
	console.log("Setting Buttons Online +++++++++++++++++++++++++++++++++++++++++++++++++++++++++++++")
	Object.values(buttons).forEach((b) => {
		b.setOnline()
	})
}

