/**
 * Socket Controller
 */
import prisma from '../prisma'
import Debug from 'debug'
import { Socket } from 'socket.io'
import { createUser } from '../services/user_service'
import { ClientToServerEvents, ServerToClientEvents } from '../types/shared/socket_types'
import { io } from '../../server'

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

	let round = 0

	socket.on('userJoin', async (username) => {
		try {
			// Find an existing room with only 1 user
			const existingRoom = await prisma.gameRoom.findFirst({ where: { userCount: 1 } })

			if (!existingRoom || existingRoom.userCount !== 1) {
				// Create a new gameRoom
				const gameRoom = await prisma.gameRoom.create({ data: { userCount: 1 } })

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

			const gameRoom = await prisma.gameRoom.findUnique({ where: { id: user.gameRoomId } })
			if (!gameRoom) return

			round++
			if (round > 10) {

				const times = await prisma.reactionTime.findMany({ where: { id: user.gameRoomId } })
				console.log(times)
				return io.to(gameRoom.id).emit('endGame')
			}

			const newReactionTime = await prisma.reactionTime.create({
				data: {
					time: timeTakenToClick,
					user: {
						connect: { id: user.id }
					}
				}
			})

			const updatedGameRoom = await prisma.gameRoom.update({
				where: { id: user.gameRoomId },
				data: { clickedUsers: [...gameRoom.clickedUsers, user.id] }
			})

			if (updatedGameRoom.clickedUsers.length >= updatedGameRoom.userCount) {
				// All users have clicked, start the next round
				// showVirus(user.gameRoomId, round)

				// Reset clickedUsers
				await prisma.gameRoom.update({
					where: { id: gameRoom.id },
					data: { clickedUsers: [] }
				})

				showVirus(user.gameRoomId, round)
			}
		}
		catch (err) {
			debug('ERROR clicking the virus!', err)
		}
	})
}
