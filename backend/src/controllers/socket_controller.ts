/**
 * Socket Controller
 */
import prisma from '../prisma'
import Debug from 'debug'
import { Socket } from 'socket.io'
import { createUser } from '../services/user_service'
import { ClientToServerEvents, ServerToClientEvents } from '../types/shared/socket_types'
import { io } from '../../server'
import { createReactionTime, deleteReactionTimes, findReactionTimes, findReactionTimesByRoomId } from '../services/reactionTime_service'

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
		
		const user = await prisma.user.findUnique({ where: { id: socket.id }, include: { reactionTime: true } })
		if (!user) return

		const reactionTimes = await findReactionTimes(user.id)
		if (!reactionTimes) return
		const deletedReactionTimes = await deleteReactionTimes(user.id)
		debug('Reaction times deleted:', deletedReactionTimes)

		const deleteUser = await prisma.user.delete({ where: { id: user.id }, include: { reactionTime: true } })
		debug('User deleted:', deleteUser.name)

		const gameRoom = await prisma.gameRoom.findUnique({ where: { id: user.gameRoomId} })
		if (!gameRoom) return
		const deleteRoom = await prisma.gameRoom.delete({ where: { id: user.gameRoomId } })
		debug('Room deleted:', deleteRoom)
	})

	let round = 0

	socket.on('userJoin', async (username) => {
		try {
			// Find an existing gameRoom with only 1 user
			const existingRoom = await prisma.gameRoom.findFirst({ where: { userCount: 1 } })

			if (!existingRoom || existingRoom.userCount !== 1) {
				// Create a new gameRoom
				const gameRoom = await prisma.gameRoom.create({ data: { userCount: 1 } })

				// Create a user and connect with newly created gameRoom
				const user = await createUser({
					id: socket.id,
					name: username,
					gameRoomId: gameRoom.id,
					virusClicked: false,
				})

				socket.join(gameRoom.id)
				debug(user.name, 'created and joined a game:', gameRoom.id)
			}

			else if (existingRoom.userCount === 1) {
				const user = await createUser({
					id: socket.id,
					name: username,
					gameRoomId: existingRoom.id,
					virusClicked: false,
				})

				await prisma.gameRoom.update({
					where: { id: existingRoom.id },
					data: { userCount: 2 }
				})

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
			const user = await prisma.user.findUnique({ where: { id: socket.id } })
			if (!user) return

			// Update the users virusClicked to 'true'
			await prisma.user.update({
				where: { id: user.id },
				data: { virusClicked: true }
			})

			const gameRoom = await prisma.gameRoom.findUnique({ where: { id: user.gameRoomId }, include: { users: true } })
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

			// Reset virusClicked for each player
			gameRoom.users.forEach(async (user) => {
				await prisma.user.update({
					where: { id: user.id },
					data: { virusClicked: false }
				})
			})

			// Call the next virus
			showVirus(user.gameRoomId, round)
		}
		catch (err) {
			debug('ERROR clicking the virus!', err)
		}
	})
}
