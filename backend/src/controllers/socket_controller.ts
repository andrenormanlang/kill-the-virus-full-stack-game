/**
 * Socket Controller
 */
import Debug from 'debug'
import { Socket } from 'socket.io'
import prisma from '../prisma'
import { ClientToServerEvents, ServerToClientEvents } from '../types/shared/socket_types'

// Create a new debug instance
const debug = Debug('ktv:socket_controller')

// Handle the user connecting
export const handleConnection = (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
	debug('🙋🏼 A user connected', socket.id)
	

	// Say hello to the user
	debug('👋🏻 Said hello to the user')

	// Handle user disconnecting
	socket.on('disconnect', () => {
		debug('✌🏻 A user disconnected', socket.id)
	})
}
