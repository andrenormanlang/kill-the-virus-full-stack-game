/**
 * Socket Controller
 */
import Debug from 'debug'
import { Socket } from 'socket.io'
import { createUser, deleteUser, findUser, updateUsersVirusClicked } from '../services/user_service'
import { ClientToServerEvents, ServerToClientEvents } from '../types/shared/socket_types'
import { io } from '../../server'
import { createReactionTime, deleteReactionTimes, findReactionTimesByUserId, findReactionTimesByRoomId } from '../services/reactionTime_service'
import { createGameRoom, deleteGameRoom, findGameRoomById, findGameRoomByUserCount, updateGameRoomsUserCount } from '../services/gameRoom_service'

// Create a new debug instance
const debug = Debug('ktv:socket_controller')

const showVirus = (roomId: string, round: number) => {
	// Calculate where and when the virus will appear
	const row = Math.ceil(Math.random() * 10)
	const column = Math.ceil(Math.random() * 10)
	const delay = Math.ceil(Math.random() * 5) * 1000

	debug("Sending virus: row %s, col %s, delay %s, to %s", row, column, delay / 1000, roomId)

	io.to(roomId).emit('showVirus', row, column, delay, round)
}

// Handle the user connecting
export const handleConnection = (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
	debug('🙋🏼 A user connected -', socket.id)

	// Handle user disconnecting
	socket.on('disconnect', async () => {
		debug('✌🏻 A user disconnected', socket.id)

		try {
			const user = await findUser(socket.id)
			if (!user) return

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

	let round = 0

	socket.on('userJoin', async (username) => {
		try {
			// Find an existing gameRoom with only 1 user
			const existingRoom = await findGameRoomByUserCount(1)

			if (!existingRoom || existingRoom.userCount !== 1) {
				// Create a new gameRoom
				const gameRoom = await createGameRoom({ userCount: 1 })

				// Create a user and connect with newly created gameRoom
				const user = await createUser({
					id: socket.id,
					name: username,
					gameRoomId: gameRoom.id,
				})

				socket.join(gameRoom.id)
				debug(user.name, 'created and joined a game:', gameRoom.id)
			}

			else if (existingRoom.userCount === 1) {
				const user = await createUser({
					id: socket.id,
					name: username,
					gameRoomId: existingRoom.id,
				})

				await updateGameRoomsUserCount(existingRoom.id, { userCount: 2 })

				socket.join(existingRoom.id)
				debug(user.name, 'joined a game:', existingRoom.id)

				round++
				showVirus(existingRoom.id, round)
			}
		}
		catch (err) {
			debug('ERROR creating or joining a game!')
		}
	})

	socket.on('clickVirus', async (timeTakenToClick) => {
		try {
			const user = await findUser(socket.id)
			if (!user) return

			// Update the users virusClicked to 'true'
			await updateUsersVirusClicked(user.id, { virusClicked: true })

			const gameRoom = await findGameRoomById(user.gameRoomId)
			if (!gameRoom) return

			round++
			// When the game ends
			if (round > 10) {
				// const allReactionTimes = await findReactionTimesByRoomId(gameRoom.id)
				// debug('allReactionTimes:', allReactionTimes)
				
				return io.to(gameRoom.id).emit('endGame')
			}

			// // Save each players reaction time in the database
			// await createReactionTime({
			// 	time: timeTakenToClick,
			// 	userId: user.id
			// })

			socket.broadcast.to(gameRoom.id).emit('reactionTime', timeTakenToClick)

			// Counts how many viruses are clicked by users (from 0 to 2)
			let virusesGone = 0
			// Check every players 'virusClicked'. If it's 'true' increase 'virusesGone' by 1
			// After the first player clicks virusesGone = 1
			// After the second player clicks virusesGone = 2
			gameRoom.users.forEach(user => {
				if (user.virusClicked) virusesGone++
			})

			// Check if both players viruses are clicked
			if (virusesGone !== gameRoom.userCount) return

			// Reset virusClicked for each player
			gameRoom.users.forEach(async (user) => {
				await updateUsersVirusClicked(user.id, { virusClicked: false })
			})

			// Call the next virus
			showVirus(user.gameRoomId, round)
		}
		catch (err) {
			debug('ERROR clicking the virus!', err)
		}
	})
}
