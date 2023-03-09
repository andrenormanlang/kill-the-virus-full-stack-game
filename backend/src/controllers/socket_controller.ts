/**
 * Socket Controller
 */
import Debug from 'debug'
import { io } from '../../server'
import { Socket } from 'socket.io'
import { deleteUser, getUserById } from '../services/user_service'
import { ClientToServerEvents, ServerToClientEvents } from '../types/shared/socket_types'
import { deleteReactionTimes, findReactionTimesByUserId } from '../services/reactionTime_service'
import { deleteGameRoom, findGameRoomById } from '../services/gameRoom_service'
import { getBestEverReactionTime } from './function_controller'
import { listenForVirusClick } from './clickVirus_controller'
import { availableGameRooms, listenForUserJoin } from './userJoin_controller'
import { getPreviousGames } from '../services/previousGame_service'
import { getBestAverageReactionTime } from '../services/averageReactionTime_service'

// Create a new debug instance
const debug = Debug('ktv:socket_controller')

// Handle the user connecting
export const handleConnection = async (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
	debug('🙋🏼 A user connected -', socket.id)

	// Get and emit the latetsGames
	try {
		const latestGames = await getPreviousGames()
		socket.emit('tenLatestGames', latestGames)

	}
	catch (err) {
		debug('Could not get the 10 latest games')
	}

	// Get and emit the bestEverReactionTime
	try {
		const bestEverReactionTime = await getBestEverReactionTime()

		const userName = bestEverReactionTime?.user?.name ?? null
		const time = bestEverReactionTime?.time ?? null

		socket.emit('bestEverReactionTime', userName, time)
	}
	catch (err) {
		debug('Could not get the bestEverReactionTime')
	}

	// Get and emit the bestAverageReactionTime
	try {
		const bestAverageReactionTime = await getBestAverageReactionTime()
		
		const userName = bestAverageReactionTime?.name ?? null
		const averageReactionTime = bestAverageReactionTime?.averageReactionTime ?? 0

		socket.emit('bestAverageReactionTime', userName, averageReactionTime)
	}
	catch (err) {
		debug('Could not get the bestAverageReactionTime')
	}

	// Handle user disconnecting
	socket.on('disconnect', async () => {
		debug('✌🏻 A user disconnected', socket.id)

		try {
			const user = await getUserById(socket.id)
			if (!user) return

			io.emit('removeLiveGame', user.gameRoomId)

			const deletedUser = await deleteUser(user.id)
			debug('User deleted:', deletedUser.name)

			const gameRoom = await findGameRoomById(user.gameRoomId)
			if (!gameRoom) return

			socket.broadcast.to(gameRoom.id).emit('opponentLeft')

			availableGameRooms.pop()

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


