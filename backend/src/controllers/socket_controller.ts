/**
 * Socket Controller
 */
import Debug from 'debug'
import { io } from '../../server'
import { Socket } from 'socket.io'
import { deleteUser, findUser } from '../services/user_service'
import { ClientToServerEvents, ServerToClientEvents } from '../types/shared/socket_types'
import { deleteReactionTimes, findReactionTimesByUserId } from '../services/reactionTime_service'
import { deleteGameRoom, findGameRoomById } from '../services/gameRoom_service'
import { getBestAverageReactionTime, getBestEverReactionTime, getLatestGames } from './function_controller'
import { listenForVirusClick } from './clickVirus_controller'
import { listenForUserJoin } from './userJoin_controller'
import prisma from '../prisma'

// Create a new debug instance
const debug = Debug('ktv:socket_controller')

// Handle the user connecting
export const handleConnection = async (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
	debug('🙋🏼 A user connected -', socket.id)

	await getLatestGames()

	await getBestEverReactionTime()

	await getBestAverageReactionTime()

	// Handle user disconnecting
	socket.on('disconnect', async () => {
		debug('✌🏻 A user disconnected', socket.id)

		try {
			const user = await findUser(socket.id)
			if (!user) return

			io.emit('removeLiveGame', user.gameRoomId)

			const reactionTimes = await findReactionTimesByUserId(user.id)
			if (!reactionTimes) return
			const deletedReactionTimes = await deleteReactionTimes(user.id)
			debug('Reaction times deleted:', deletedReactionTimes)

			const deletedUser = await deleteUser(user.id)
			debug('User deleted:', deletedUser.name)

			const gameRoom = await findGameRoomById(user.gameRoomId)
			if (!gameRoom) return
			const deletedRoom = await deleteGameRoom(user.gameRoomId)
			debug('Room deleted:', deletedRoom)

		}
		catch (err) {
			debug('ERROR finding or deleting one of following: reactionTimes, user, gameRoom')
		}
	})

	// socket.on('userJoin')
	listenForUserJoin(socket)

	// socket.on('virusClick')
	listenForVirusClick(socket)
}


