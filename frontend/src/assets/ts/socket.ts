import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents} from '../../../../backend/src/types/shared/socket_types'

const SOCKET_HOST = import.meta.env.VITE_APP_SOCKET_HOST
const socket = io(SOCKET_HOST)

// Forms
const usernameFormEl = document.querySelector('#username-form') as HTMLFormElement

// User details
let username: string | null = null

socket.on('connect', () => {
	console.log('Connected to server')
})

socket.on('hello', () => {
	console.log('Server saying hello')
})

usernameFormEl.addEventListener('submit', e => {
	e.preventDefault();

	// Hide lobby and show game
	(document.querySelector('#lobby') as HTMLDivElement).style.display = 'none';
	(document.querySelector('#game') as HTMLDivElement).style.display = 'block'

	// Get username
	username = (usernameFormEl.querySelector('#username-input') as HTMLInputElement).value.trim()
	if (!username) return


	socket.emit('userJoinedLobby', username)
})

export default socket
