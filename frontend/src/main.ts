import './assets/scss/style.scss'
import './assets/ts/rounds'
import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from '@backend/types/shared/socket_types'

const SOCKET_HOST = import.meta.env.VITE_APP_SOCKET_HOST
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST)

// Forms
const usernameBtnEl = document.querySelector('#enter') as HTMLFormElement
const usernameFormEl = document.querySelector('#username-form') as HTMLFormElement

// Div
const gameEl = document.querySelector('#game') as HTMLDivElement
const gameScreenEl = document.querySelector("#gameScreen") as HTMLDivElement
const lobbyEl = document.querySelector('#lobby') as HTMLDivElement
const spinnerEl = document.querySelector('#spinner') as HTMLFormElement

// User details
let username: string | null = null

// array for all 10 reaction times
let reactionTime:any = []

// calculates the average reactionTime for all rounds
const averageReactionTime = () => {
	let sum = 0;
	for (let i = 0; i < reactionTime.length; i++) {
		sum += reactionTime[i];
	}
	let average = sum / reactionTime.length;
	console.log(average)
	return average
}

socket.on('connect', () => {
	console.log('Connected to server')
})

socket.on('hello', () => {
	console.log('Server saying hello')
})

socket.on('userJoinedGame', (username) => {
	console.log(username, 'has joined the game')
})

socket.on('endGame', () => {
	console.log('Game ended, goodbye.')
})

usernameFormEl.addEventListener('submit', e => {
	e.preventDefault();

	usernameBtnEl.setAttribute('disabled', 'disabled')
	spinnerEl.classList.remove('hide')

	// Get username
	username = (usernameFormEl.querySelector('#username-input') as HTMLInputElement).value.trim()
	if (!username) return
	
	// socket.emit('userJoinedLobby', username)
	socket.emit('userJoin', username)

	let timer: number

	socket.on('showVirus', (row, column, delay, round) => {
		// Hide lobby and show game
		lobbyEl.style.display = 'none';
		gameEl.style.display = 'block'
		spinnerEl.classList.remove('hide')
		console.log('Round:', round)

		setTimeout(() => {
			(document.querySelector('#gameScreen') as HTMLDivElement).innerHTML = `
				<div class="virus" id="virus" style="grid-row: ${row}; grid-column: ${column};">🦠</div>
			`
			timer = Date.now() / 1000
		}, delay)
	})



	// Eventlistener when clicking the virus
	gameScreenEl.addEventListener("click", e => {
		const target = e.target as HTMLElement

		if (!target.classList.contains('virus')) return

		(document.querySelector('#virus') as HTMLDivElement).remove()

		const timeTakenToClick = Number((Date.now() / 1000 - timer).toFixed(3))
		console.log("It took", timeTakenToClick, "seconds")

		socket.emit('clickVirus', timeTakenToClick);
	})
})

export default socket
