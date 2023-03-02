import './assets/scss/style.scss'
import './assets/ts/rounds'

import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents} from '@backend/types/shared/socket_types'

const SOCKET_HOST = import.meta.env.VITE_APP_SOCKET_HOST
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST)

// Forms
const usernameFormEl = document.querySelector('#username-form') as HTMLFormElement
const usernameBtnEl = document.querySelector('#enter') as HTMLFormElement

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
	
	// Get username
	username = (usernameFormEl.querySelector('#username-input') as HTMLInputElement).value.trim()
	if (!username) return

	// socket.emit('userJoinedLobby', username)
	socket.emit('userJoin', username)

	socket.on('showVirus', (row, column, delay) => {
		// Hide lobby and show game
		(document.querySelector('#lobby') as HTMLDivElement).style.display = 'none';
		(document.querySelector('#game') as HTMLDivElement).style.display = 'block'

		// gridCol and gridRow will be calculated in backend and sent here
		const gridRow = row
		const gridCol = column;

		setTimeout(() => {
			(document.querySelector('#gameScreen') as HTMLDivElement).innerHTML = `
				<div class="cell" style="grid-row: ${gridRow}; grid-column: ${gridCol};">🦠</div>
			`
		}, delay);
	})
})

// const displayVirus = () => {
	
// }

// // Equasion that counts the time it takes to click on a virus.
// // Needs to reveie the virus from backend before it can be used
// setTimeout(() => {
// 	// Display the new virus emoji
// 	randomCell.textContent = '🦠';
// 	randomCell.classList.add('cell-virus');
// 	timer = Date.now() / 1000

// }, Math.ceil(Math.random() * 5) * 1000);

// const timeTakenToClick = Number((Date.now() / 1000 - timer).toFixed(3))
// console.log("It took", timeTakenToClick, "seconds")


export default socket
