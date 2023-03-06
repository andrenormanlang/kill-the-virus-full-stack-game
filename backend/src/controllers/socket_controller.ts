/**
 * Socket Controller
 */
import Debug from 'debug'
import { Socket } from 'socket.io'
import { createUser, deleteUser, findUser, updateUsersVirusClicked } from '../services/user_service'
import { ClientToServerEvents, NewRoundData, ServerToClientEvents } from '../types/shared/socket_types'
import { io } from '../../server'
import { createReactionTime, deleteReactionTimes, findReactionTimesByUserId, findReactionTimesByRoomId } from '../services/reactionTime_service'
import { createGameRoom, deleteGameRoom, findGameRoomById, findGameRoomByUserCount, updateGameRoomsUserCount } from '../services/gameRoom_service'
import prisma from '../prisma'

// Create a new debug instance
const debug = Debug('ktv:socket_controller')

// Calculate where and when the virus will appear
const calcVirusData = () => {
	return {
		row: Math.ceil(Math.random() * 10),
		column: Math.ceil(Math.random() * 10),
		delay: Math.ceil(Math.random() * 5) * 1000,
	}
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

	let round = 1

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

				const virusData = calcVirusData()
				const firstRoundPayload = {
					row: virusData.row,
					column: virusData.column,
					delay: virusData.delay,
				}

				io.to(existingRoom.id).emit('firstRound', firstRoundPayload, round)
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

			// Save each players reaction time in the database
			await createReactionTime({
				time: timeTakenToClick,
				userId: user.id
			})



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

			const latestReactionTimes = await prisma.reactionTime.findMany({
				where: {
					user: {
						gameRoomId: gameRoom.id
					}
				},
				take: 2,
				orderBy: [
					{
						id: 'desc'
					}
				]
			})
			debug('latestReactionTimes:', latestReactionTimes)

			// Reset virusClicked for each player
			gameRoom.users.forEach(async (user) => {
				await updateUsersVirusClicked(user.id, { virusClicked: false })
			})

			// Get the virus information
			const virusData = calcVirusData()
			const newRoundPayload: NewRoundData = {
				row: virusData.row,
				column: virusData.column,
				delay: virusData.delay,
				round: round,
			}

			// Give the next virus to both players
			io.to(gameRoom.id).emit('newRound', newRoundPayload)
		}
		catch (err) {
			debug('ERROR clicking the virus!', err)
		}
	})
}

export const restart = (socket: Socket<ServerToClientEvents>) => {

	try {
		socket.on('reset', async () => {
			debug('✌🏻 A user disconnected', socket.id)
			const user = await prisma.user.findUnique({
				where: {
					id: socket.id
				}
			})

			if (!user) return

			const deleteRoom = await prisma.gameRoom.delete({
				where: {
					id: user?.gameRoomId
				}
			})
			console.log(deleteRoom)
		})
	} catch (err) {
		debug('ERROR resetting', err)
	}

}
