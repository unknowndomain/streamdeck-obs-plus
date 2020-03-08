var _currentPlugin
var obsTransitions
var currentTransition
var currentDuration

function connectElgatoStreamDeckSocket(port, uuid, registerEvent, info, action) {
	data = JSON.parse(action)
	currentTransition = data.payload.settings.transition
	currentDuration = data.payload.settings.duration ? data.payload.settings.duration : 100
	_currentPlugin = {
		action: data.action,
		context: uuid
	}
	StreamDeck.debug = true
	StreamDeck._ws = new WebSocket("ws://localhost:" + port)
	StreamDeck._ws.onopen = () => {
		StreamDeck._openHandler(registerEvent, uuid)
	}
	StreamDeck._ws.onmessage = (e) => {
		var data = JSON.parse(e.data)
		switch(data.event) {
			case 'sendToPropertyInspector':
				obsTransitions = data.payload.transitions
				updateTransitionUI()
				break
			default:
				console.log(data)
				break
		}
	}
}

function updateTransitionUI() {
	document.getElementById('transitions').innerText = ''
	document.getElementById('transitions').onchange = updateSettings
	document.getElementById('duration').onchange = updateSettings
	createTransition('')
	obsTransitions.forEach((transition) => {
		createTransition(transition)
	})
	document.getElementById('transitions').value = currentTransition
	document.getElementById('duration').value = currentDuration
}

function createTransition(transition) {
	var option = document.createElement('option')
	option.innerText = transition
	document.getElementById('transitions').appendChild(option)
}

function updateSettings() {
	StreamDeck.setSettings(_currentPlugin.context, {
		transition: document.getElementById('transitions').value,
		duration: document.getElementById('duration').value
	})
}
