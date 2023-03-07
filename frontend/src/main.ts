import './assets/scss/style.scss'
import './assets/ts/rounds'
import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents, VirusData } from '@backend/types/shared/socket_types'

const SOCKET_HOST = import.meta.env.VITE_APP_SOCKET_HOST
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST)

// Forms
const usernameBtnEl = document.querySelector('#enter') as HTMLFormElement
const usernameFormEl = document.querySelector('#username-form') as HTMLFormElement

// button
const toLobbyEl = document.querySelector('#toLobby') as HTMLButtonElement

// Div
const gameEl = document.querySelector('#game') as HTMLDivElement
const gameScreenEl = document.querySelector("#gameScreen") as HTMLDivElement
const lobbyEl = document.querySelector('#lobby') as HTMLDivElement
const endGameBoardEl = document.querySelector('#endGameBoard') as HTMLDivElement
const spinnerEl = document.querySelector('#spinner') as HTMLFormElement

// User details
let username: string | null = null

// array for all 10 reaction times
let reactionTime: any = []
let timer: number

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

// Displays the virus do the DOM
const displayVirus = (virusData: VirusData) => {
	const { row, column, delay } = virusData

	setTimeout(() => {
		(document.querySelector('#gameScreen') as HTMLDivElement).innerHTML = `
			<div class="virus" id="virus" style="grid-row: ${row}; grid-column: ${column};">🦠</div>
		`
		// Start the timer
		timer = Date.now() / 1000
	}, delay)
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

toLobbyEl.addEventListener('submit', (e) => {
	e.preventDefault

	socket.on('reset', () => {
		console.log('restarting game')
	})
})

socket.on('endGame', () => {
	lobbyEl.style.display = 'none'
	gameEl.style.display = 'none'
	endGameBoardEl.style.display = 'block'
	console.log('Game ended, goodbye.')
})

socket.on('reactionTime', (reactionTime) => {
	console.log('Opponent:', reactionTime);
	(document.querySelector('#opponentTime') as HTMLDivElement).innerText = ` ${reactionTime}`
})

socket.on('firstRound', (firstRoundData, round) => {
	console.log('Round:', round)
	// Hide lobby and show game
	lobbyEl.style.display = 'none';
	gameEl.style.display = 'block'
	spinnerEl.classList.remove('hide')
	displayVirus(firstRoundData)
})

socket.on('newRound', (newRoundData) => {
	const { row, column, delay, round } = newRoundData
	console.log('Round:', round)

	displayVirus({ row, column, delay })
})

socket.on('updateScore', (player1Score: number, player2Score: number, player1Id: string, player2Id: string) => {
	const myId = socket.id
	const scoreEl = document.querySelector('#score') as HTMLDivElement;
	console.log('Score %d - %d', player1Score, player2Score);

	if (player1Id === myId) {
		scoreEl.innerText = `${player1Score} - ${player2Score}`
	} else {
		scoreEl.innerText = `${player2Score} - ${player1Score}`
	}
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

	// Eventlistener when clicking the virus
	gameScreenEl.addEventListener("click", e => {
		const target = e.target as HTMLElement

		if (!target.classList.contains('virus')) return

		(document.querySelector('#virus') as HTMLDivElement).remove()

		const timeTakenToClick = Number((Date.now() / 1000 - timer).toFixed(3))
		console.log('My time:', timeTakenToClick);
		(document.querySelector('#myTime') as HTMLDivElement).innerText = ` ${timeTakenToClick}`

		socket.emit('clickVirus', timeTakenToClick)
	})
})


export default socket
