const obs = new OBSWebSocket()
const sceneAction = 'uk.ac.arts.obs.scene-btn'
const transitionAction = 'uk.ac.arts.obs.transition-btn'

var buttons = {}
var obsScenes = []
var obsTransitions = []
var connected = false
var connecting = false
var preview
var program
var currentPI

setInterval(connect, 1000)

function connect() {
	if (!connected && !connecting) {
		connecting = true
		obs.connect({
			address: 'localhost:4444',
			password: ''
		}).catch((e) => {
			// console.log('Unable to connect')
			connecting = false
		})
	}
}

obs.on('ConnectionOpened', () => {
})

obs.on('ConnectionClosed', () => {
	connected = false
	connecting = false
	obsScenes = []
	obsTransitions = []
})
obs.on('AuthenticationSuccess', (e) => {
	connected = true
	connecting = false
	obsUpdateScenes()
	obsUpdateTransitions()
})
obs.on('AuthenticationFailure', (e) => {
	console.log('AuthenticationFailure', e);
})
obs.on('ScenesChanged', obsUpdateScenes)
obs.on('TransitionListChanged', obsUpdateTransitions)
obs.on('PreviewSceneChanged', handlePreviewSceneChanged)
obs.on('SwitchScenes', handleProgramSceneChanged)

function obsUpdateScenes() {
	obs.send('GetSceneList').then((data) => {
		obsScenes = data.scenes.map((s) => {
			return s.name
		})
		if (currentPI) sendUpdatedScenesToPI()
		handleProgramSceneChanged({name: data['current-scene']})
	})
	obs.send('GetPreviewScene').then(handlePreviewSceneChanged)
}

function obsUpdateTransitions() {
	obs.send('GetTransitionList').then((data) => {
		console.log(data)
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
	console.log('sendScenes', obsScenes)
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
				var type = '';
				if (data.action == sceneAction) type = 'scene';
				if (data.action == transitionAction) type = 'transition';
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
		default:
			console.log(data)
			break
		case 'keyUp':
			break
	}
}

function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info) {
	StreamDeck.debug = true
	StreamDeck._ws = new WebSocket("ws://localhost:" + port)
	StreamDeck._ws.onopen = () => {
		StreamDeck._openHandler(registerEvent, uuid)
	}
	StreamDeck._ws.onmessage = handleStreamDeckMessages
}

function handleProgramSceneChanged(e) {
	var _program = ''
	if (e['scene-name']) _program = e['scene-name']
	if (e['name']) _program = e['name']

	if (_program != program) {
		program = _program
		updateButtons('program')
	}
}

function handlePreviewSceneChanged(e) {
	var _preview = ''
	if (e['scene-name']) _preview = e['scene-name']
	if (e['name']) _preview = e['name']

	if (_preview != preview) {
		preview = _preview
		updateButtons('preview')
	}
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
	var output = [];
	Object.keys(buttons).forEach((b) => {
		if (buttons[b].scene && buttons[b].scene == scene) {
			output.push(b)
		}
	})
	return output
}

function findPreviewButtons() {
	var output = [];
	Object.keys(buttons).forEach((b) => {
		if (buttons[b].preview && buttons[b].preview == true) {
			output.push(b)
		}
	})
	return output
}

function findProgramButtons() {
	var output = [];
	Object.keys(buttons).forEach((b) => {
		if (buttons[b].program && buttons[b].program == true) {
			output.push(b)
		}
	})
	return output
}
