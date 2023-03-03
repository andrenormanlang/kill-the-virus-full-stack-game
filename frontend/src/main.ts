import './assets/scss/style.scss'
import './assets/ts/rounds'

import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents } from '@backend/types/shared/socket_types'

const SOCKET_HOST = import.meta.env.VITE_APP_SOCKET_HOST
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST)

// Forms
const usernameFormEl = document.querySelector('#username-form') as HTMLFormElement
const usernameBtnEl = document.querySelector('#enter') as HTMLFormElement

// Div
const spinnerEl = document.querySelector('#spinner') as HTMLFormElement
const lobbyEl = document.querySelector('#lobby') as HTMLDivElement
const gameEl = document.querySelector('#game') as HTMLDivElement
const gameScreenEl = document.querySelector("#gameScreen") as HTMLDivElement

// User details
let username: string | null = null

socket.on('connect', () => {
	console.log('Connected to server')
})

socket.on('hello', () => {
	console.log('Server saying hello')
})

socket.on('userJoinedGame', (username) => {
	console.log(username, 'has joined the game')
})

usernameFormEl.addEventListener('submit', e => {
	e.preventDefault();

	usernameBtnEl.setAttribute('disabled', 'disabled')
	spinnerEl.classList.remove('hide')

	// Get username
	username = (usernameFormEl.querySelector('#username-input') as HTMLInputElement).value.trim()
	if (!username) return

	let timer: number
	// variable to start the loop
	let playGame = false
	// array for all 10 reaction times
	let reactionTime: any = []
	// variable for reaction time (1 round)
	let scoreRound = 0

	let round = 0

	// socket.emit('userJoinedLobby', username)
	socket.emit('userJoin', username)

	socket.on('showVirus', (row, column, delay) => {
		round++;

		if (round === 11) {
			playGame = false;
			averageReactionTime()
			gameEl.style.display = 'none'
			lobbyEl.style.display = 'block'
			return
		}

		console.log('Round:', round)

		// Hide lobby and show game
		lobbyEl.style.display = 'none';
		gameEl.style.display = 'block'
		spinnerEl.classList.remove('hide')

		// gridCol and gridRow will be calculated in backend and sent here
		const gridRow = row
		const gridCol = column;

		setTimeout(() => {
			(document.querySelector('#gameScreen') as HTMLDivElement).innerHTML = `
				<div class="virus" id="virus" style="grid-row: ${gridRow}; grid-column: ${gridCol};">🦠</div>
			`
			timer = Date.now() / 1000
		}, delay);
	})

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


	// Eventlistener when clicking the virus
	gameScreenEl!.addEventListener("click", e => {
		const target = e.target as HTMLElement

		if (!target.classList.contains('virus')) return

		(document.querySelector('#virus') as HTMLDivElement).remove()

		const timeTakenToClick = Number((Date.now() / 1000 - timer).toFixed(3))
		console.log("It took", timeTakenToClick, "seconds")

		socket.emit('clickVirus', timeTakenToClick);

		scoreRound = 1 //hårdkodat atm, add reaction time and then push to reactionTime array
	})
})








// // Equasion that counts the time it takes to click on a virus.
// // Needs to reveie the virus from backend before it can be used
// setTimeout(() => {
// 	// Display the new virus emoji
// 	randomCell.textContent = '🦠';
// 	randomCell.classList.add('cell-virus');

// }, Math.ceil(Math.random() * 5) * 1000);

export default socket
