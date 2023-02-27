import { io, Socket } from 'socket.io-client'

const SOCKET_HOST = import.meta.env.VITE_APP_SOCKET_HOST
const socket = io(SOCKET_HOST)

socket.on('connect', () => {
	console.log('hej')
})

export default socket
