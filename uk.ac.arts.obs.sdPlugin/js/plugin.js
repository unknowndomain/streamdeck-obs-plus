const obs = new OBSWebSocket()
const sceneAction = 'uk.ac.arts.obs.scene-btn'
const transitionAction = 'uk.ac.arts.obs.transition-btn'
const debug = false

const CLOSED = -4
const FAILED = -3
const GETTING_SETTINGS = -2
const DISCONNECTED = -1
const CONNECTING = 0
const CONNECTED = 1
const AUTHENTICATED = 2

var pluginUUID
var settings
var buttons = {}
var obsScenes = []
var obsTransitions = []
var connectionState = DISCONNECTED
var preview
var program
var currentPI
var reconnectTimer
var studioMode

setInterval(connect, 1000)

function connect() {
	switch (connectionState) {
		case CLOSED:
			if (debug) console.log('CLOSED: check again')
			if (!reconnectTimer) reconnectTimer = setTimeout(() => {
				if (connectionState == CLOSED) {
					connectionState = DISCONNECTED
					reconnectTimer = null
				}
			}, 5000)
		break
		case FAILED:
			if (debug) console.log('FAILED: will not connect')
			break
		case GETTING_SETTINGS:
			if (debug) console.log('GETTING SETTINGS: waiting')
			if (settings && Object.keys(settings).length == 0) {
				settings = {
					host: 'localhost',
					port: 4444,
					password: ''
				}
				StreamDeck.setGlobalSettings(pluginUUID, settings)
				if (currentPI) StreamDeck.sendToPI(currentPI.context, transitionAction, {settings: settings})
			}
			connectionState = DISCONNECTED
		case DISCONNECTED:
			if (debug) console.log('DISCONNECTED: will try to connect')
			if (settings && Object.keys(settings).length > 0) {
				obs.connect({
					address: `${settings.host}:${settings.port}`,
					password: settings.password
				})
			} else {
				connectionState = GETTING_SETTINGS
				StreamDeck.getGlobalSettings(pluginUUID)
			}
			break
		case CONNECTING:
			if (debug) console.log('CONNECTING: nothing to do')
			break
		case CONNECTED:
			if (debug) console.log('CONNECTED: nothing to do')
			break
		case AUTHENTICATED:
			if (debug) console.log('AUTHENTICATED: nothing to do')
			break
	}
}

obs.on('ConnectionOpened', () => {
	if (debug) console.log('connectionState = CONNECTED')
	connectionState = CONNECTED
})

obs.on('ConnectionClosed', () => {
	if (connectionState == FAILED) return
	if (debug) console.log('connectionState = CLOSED')
	connectionState = CLOSED
	obsScenes = []
	obsTransitions = []
	clearPreviewButtons()
	clearProgramButtons()
})
obs.on('AuthenticationSuccess', (e) => {
	if (debug) console.log('connectionState = AUTHENTICATED')
	connectionState = AUTHENTICATED
	obsUpdateScenes()
	obsUpdateTransitions()
	updateButtons()
})
obs.on('AuthenticationFailure', (e) => {
	if (debug) console.log('connectionState = FAILED')
	connectionState = FAILED
})

obs.on('ScenesChanged', obsUpdateScenes)
obs.on('TransitionListChanged', obsUpdateTransitions)
obs.on('PreviewSceneChanged', handlePreviewSceneChanged)
obs.on('SwitchScenes', handleProgramSceneChanged)
obs.on('StudioModeSwitched', handleStudioModeSwitched)

function obsUpdateScenes() {
	obs.send('GetSceneList').then((data) => {
		obsScenes = data.scenes.map((s) => {
			return s.name
		})
		if (currentPI) sendUpdatedScenesToPI()
		handleProgramSceneChanged({name: data['current-scene']})
	})
	if (studioMode) obs.send('GetPreviewScene').then(handlePreviewSceneChanged)
}


function obsUpdateStudioStatus() {
	obs.send('GetStudioModeStatus').then((data) => {
		studioMode = data['studio-mode']
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
	var data = JSON.parse(e.data)
	switch(data.event) {
		case 'keyDown':
			buttons[data.context].keyDown()
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
				connectionState = DISCONNECTED
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
	settings = e.payload.settings
	if (connectionState > CONNECTING) {
		obs.disconnect()
		connectionState = DISCONNECTED
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
	studioMode = e['new-state']
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
