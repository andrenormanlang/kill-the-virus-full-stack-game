import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, ServerToClientEvents} from '../../../../backend/src/types/shared/socket_types'

const SOCKET_HOST = import.meta.env.VITE_APP_SOCKET_HOST
const socket = io(SOCKET_HOST)

socket.on('connect', () => {
	console.log('hej')
})

socket.on('hello', () => {
	console.log('Server saying hello')
})

export default socket
