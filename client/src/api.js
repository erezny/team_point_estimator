
/* eslint-disable no-console */
import camelCase from 'camelcase';
// import * as actions from '../actions';


const randomRegistrationId = function(){
  const storageString = sessionStorage.getItem('sessionInfo');
  let storageData = null;
  try {
    storageData = JSON.parse(storageString);
  }
  catch (e) {
    console.log(`error parsing local sessionInfo`, { storageString });
    storageData = null
  }
  if (storageData == null) {
    storageData = `${Math.random()}`
    sessionStorage.setItem('sessionInfo', JSON.stringify(storageData));
  }
  return storageData;
}()

const loc = window.location;
const prot = loc.protocol === 'https:' ? 'wss:' : 'ws:';

let url = prot + '//' + loc.hostname + ':8080/api/ws';
// url = `ws://localhost:8080/api/ws/${randomRegistrationId}`
url = `wss://team-point-estimator-api.ngrok.io/api/ws/${randomRegistrationId}`;
const socket = () => {
	let socket = null;
	try {
		socket = new WebSocket(url);
	}
	catch (error) {
		console.log('websocket creation error', { error });
	}
	return socket;
};

export default class Api {

	socket = socket()
	queue = []

	constructor() {
		console.log("created");
		this.registerSocketEvents();
	}

	registerSocketEvents() {
		this.socket.addEventListener('open', this.handleSocketOpen);
		this.socket.addEventListener('close', this.handleSocketClose);
		this.socket.addEventListener('message', this.handleSocketMessage);
		this.socket.addEventListener('error', this.handleSocketError);
	}

	handleSocketClose = (event) => {
		console.log('connection closed.');
		this.startReconnecting();
	}

	reconnecting = false
	reconnectingInterval = null
	startReconnecting = () => {
		console.log('startReconnecting');
		this.reconnecting = true;
		this.reconnectingInterval = setTimeout(this.attemptReconnect, 1000);
	}

	attemptReconnect = () => {
		console.log('attemptReconnect');
		if (this.reconnecting &&
			this.socket.readyState === WebSocket.CLOSED) {
			this.socket = socket();
			this.registerSocketEvents();
		}
	}

	clearAttemptReconnect = () => {
		console.log('clearAttemptReconnect');
		if (this.reconnectingInterval !== null) {
			clearInterval(this.reconnectingInterval);
			this.reconnectingInterval = null;
		}
	}

	handleSocketError = (event) => {
		console.log('error', { event });
	}

	handleSocketOpen = (event) => {
		this.clearAttemptReconnect();
		for (let msg of this.queue) {
			this.socket.send(msg);
		}
		this.queue = [];
	}

	handleSocketMessage = (msg) => {
		let eventData = null;
		try {
			eventData = JSON.parse(msg.data);
		}
		catch (e) {
			console.log(`error parsing server event ${msg.data}`);
		}
		if (eventData !== null) {
			this.dispatchReceivedMessage(eventData);
		}
	}

	handle = {}
	dispatchReceivedMessage = (event) => {
		if (this.handle.hasOwnProperty(event.msg.action)) {
			this.handle[event.msg.action](event)
		} else {
			console.log(`unexpected action found: ${event.msg.action}`, event);
		}
	}

	send = (msg) => {
		switch (this.socket.readyState) {
			case WebSocket.CONNECTING: this.queue.push(msg);
				break;
			case WebSocket.OPEN: this.socket.send(msg);
				break;
		}
	}

	ping = () => {
		this.sendApiPacket('ping');
	}

	package(action, msg = {}) {
		if (typeof(action) !== 'string') {
			throw new Error('attempted to send non-string action');
		}
		return JSON.stringify({
			action,
			msg
		});
	}

	sendApiPacket = (action, msg = {}) => {
		this.send(this.package(action, msg));
	}

	storeQueue = [];
	storeAction = (action, msg) => {
		const actionMsg = {
			action: camelCase(action),
			msg
		};
		switch (this.storeQueue.length === 0) {
			case false: this.storeQueue.push(actionMsg);
				break;
			case true: this.sendApiPacket(actionMsg.action, actionMsg.msg);
				break;
		}
	}

	sendStoreQueue = () => {
		for (let actionMsg of this.storeQueue) {
			this.sendApiPacket(actionMsg.action, actionMsg.msg);
		}
		this.storeQueue = [];
	}

	handlePlayerMessage = (event) => {
		switch (event.action) {
			// case 'listTables': this.dispatchToStore(actions.receiveTableList(event.msg));
			// 	break;
			default: console.log(`unexpected player action found: ${event.action}`, event);
		}
	}

	store = null;
	dispatchToStore(action, params) {
		if (this.store === null) {
			console.err('received event for store before store was initialized');
		}
		else {
			this.store.dispatch(action, params);
		}

	}

	queries = {
		listTables: () => {
			console.log('listTables');
			this.storeAction('listTables', {});
		}
	}

	sessionInfo = null;
	isRegistered = false;
	registerSession = () => {
		const sessionInfo = this.sessionInfo || this.retrieveSessionStorage();
		if (!sessionInfo || !sessionInfo.sessionKey) {
			this.sendApiPacket('register');
		}
		else {
			this.sendApiPacket('resume', { sessionKey: sessionInfo.sessionKey });
		}
	}

	retrieveSessionStorage = () => {
		const storageString = sessionStorage.getItem('sessionInfo');
		let storageData = null;
		try {
			storageData = JSON.parse(storageString);
		}
		catch (e) {
			console.log(`error parsing local sessionInfo`, { storageString });
			return null;
		}
		return storageData;
	}

	handleRegisterSession = (event) => {
		const sessionInfo = event.msg;
		if (sessionInfo) {
			this.sessionInfo = sessionInfo;
			sessionStorage.setItem('sessionInfo', JSON.stringify(this.sessionInfo));
			this.isRegistered = true;
			console.log(`registered as`, sessionInfo);
			this.sendStoreQueue();
		}
	}
}
/* eslint-enable no-mixed-spaces-and-tabs */
