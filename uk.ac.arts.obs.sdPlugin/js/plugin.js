const obs = new OBSWebSocket()
const sceneAction = 'uk.ac.arts.obs.scene-btn'
const transitionAction = 'uk.ac.arts.obs.transition-btn'
const debug = false

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

var settings = {
	host: 'localhost',
	port: '4444',
	password: ''
}
var pluginUUID
var buttons = {}
var obsScenes = []
var obsTransitions = []
var obsStudioMode
var connectionState = ConnectionState.DISCONNECTED
var preview
var program
var currentPI

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
	obsScenes = []
	obsTransitions = []
	clearPreviewButtons()
	clearProgramButtons()
})
obs.on('AuthenticationSuccess', () => {
	connectionState = ConnectionState.AUTHENTICATED
	printConnectionState()
	obsUpdateStudioStatus()
	obsUpdateScenes()
	obsUpdateTransitions()
	updateButtons()
})
obs.on('AuthenticationFailure', () => {
	connectionState = ConnectionState.FAILED
	printConnectionState()
})

obs.on('ScenesChanged', obsUpdateScenes)
obs.on('TransitionListChanged', obsUpdateTransitions)
obs.on('PreviewSceneChanged', handlePreviewSceneChanged)
obs.on('SwitchScenes', handleProgramSceneChanged)
obs.on('StudioModeSwitched', handleStudioModeSwitched)

obs.on('Exiting', () => {
	obs.disconnect()
	console.log('OBS Disconnecting')
})

function obsUpdateScenes() {
	obs.send('GetSceneList').then((data) => {
		obsScenes = data.scenes.map((s) => {
			return s.name
		})
		if (currentPI) sendUpdatedScenesToPI()
		handleProgramSceneChanged({name: data['current-scene']})
	})
	if (obsStudioMode) obs.send('GetPreviewScene').then(handlePreviewSceneChanged)
}


function obsUpdateStudioStatus() {
	obs.send('GetStudioModeStatus').then((data) => {
		obsStudioMode = data['studio-mode']
	})
}

function obsUpdateTransitions() {
	obs.send('GetTransitionList').then((data) => {
		obsTransitions = data.transitions.map((s) => {
			return s.name
		})
		if (currentPI && currentPI.action == transitionAction) sendUpdatedTransitionsToPI()
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
		scenes: obsScenes
	})
}

function sendUpdatedTransitionsToPI() {
	StreamDeck.sendToPI(currentPI.context, transitionAction, {
		transitions: obsTransitions
	})
}

function handleStreamDeckMessages(e) {
	const data = JSON.parse(e.data)
	// if (debug) console.log(`${data.event}: `, data)
	switch(data.event) {
		case 'deviceDidConnect':
			StreamDeck.getGlobalSettings(pluginUUID)
			break
		case 'keyDown':
			printConnectionState()
			if (connectionState == ConnectionState.AUTHENTICATED) {
				console.log('keydown')
				buttons[data.context].keyDown()
			} else {
				if (debug) console.log('keyDown: initating reconnect')
				connectionState = ConnectionState.DISCONNECTED
				connect()
				setTimeout(() => {
					if (debug) console.log('keyDown: retrying button press')
					if (connectionState == ConnectionState.AUTHENTICATED) {
						if (debug) console.log('keyDown: failed - pressed')
						buttons[data.context].keyDown()
					} else {
						if (debug) console.log('keyDown: failed - alerting')
						StreamDeck.sendAlert(data.context)
					}
				}, 10)
			}
			break
		case 'willAppear':
		case 'titleParametersDidChange':
		case 'didReceiveSettings':
			if (buttons[data.context]) {
				buttons[data.context].processStreamDeckData(data)
			} else {
				var type = ''
				if (data.action == sceneAction) type = 'scene'
				if (data.action == transitionAction) type = 'transition'
				buttons[data.context] = new Button(type, data)
				if (type == 'scene') updateButton(data.context)
			}
			break
		case 'willDisappear':
			delete buttons[data.context]
			break
		case 'propertyInspectorDidAppear':
			updatePI(data)
			sendUpdatedScenesToPI()
			sendUpdatedTransitionsToPI()
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
	var _program = ''
	if (e['scene-name']) _program = e['scene-name']
	if (e['name']) _program = e['name']

	if (_program != program) {
		program = _program
		updateButtons()
	}
}

function handlePreviewSceneChanged(e) {
	var _preview = ''
	if (e['scene-name']) _preview = e['scene-name']
	if (e['name']) _preview = e['name']

	if (_preview != preview) {
		preview = _preview
		updateButtons()
	}
}

function handleStudioModeSwitched(e) {
	obsStudioMode = e['new-state']
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
	findButtonsByScene(program).forEach((b) => {
		buttons[b].setProgram()
	})
}

function updatePreviewButtons() {
	findButtonsByScene(preview).forEach((b) => {
		buttons[b].setPreview()
	})
}

function updateButtons(mode) {
	clearPreviewButtons()
	if (preview != program) updatePreviewButtons()
	clearProgramButtons()
	updateProgramButtons()
}

function updateButton(context) {
	if (buttons[context].scene == program) {
		buttons[context].setProgram()
	} else if (buttons[context].scene == preview) {
		buttons[context].setPreview()
	} else {
		buttons[context].setOffAir()
	}
}

function findButtonsByScene(scene) {
	var output = []
	Object.keys(buttons).forEach((b) => {
		if (buttons[b].scene && buttons[b].scene == scene) {
			output.push(b)
		}
	})
	return output
}

function findPreviewButtons() {
	var output = []
	Object.keys(buttons).forEach((b) => {
		if (buttons[b].preview && buttons[b].preview == true) {
			output.push(b)
		}
	})
	return output
}

function findProgramButtons() {
	var output = []
	Object.keys(buttons).forEach((b) => {
		if (buttons[b].program && buttons[b].program == true) {
			output.push(b)
		}
	})
	return output
}
