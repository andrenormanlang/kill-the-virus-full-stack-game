/**
 * Socket Controller
 */
import prisma from '../prisma'
import Debug from 'debug'
import { Socket } from 'socket.io'
import { createUser } from '../services/user_service'
import { ClientToServerEvents, ServerToClientEvents } from '../types/shared/socket_types'
import { GameRoom } from '@prisma/client'

// Create a new debug instance
const debug = Debug('ktv:socket_controller')

// Handle the user connecting
export const handleConnection = (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
	// debug('🙋🏼 A user connected -', socket.id)

	// // Handle user disconnecting
	// socket.on('disconnect', () => {
	// 	debug('✌🏻 A user disconnected', socket.id)
	// })

	socket.emit('hello')

	// socket.on('userJoinedLobby', (username) => {
	// 	debug('Welcome to the lobby', username)
	// })

	let availableRoom: GameRoom | null

	socket.on('userJoin', async (username) => {
		debug(username, 'joined a game', socket.id)

		try {

			

			// Find a waitingRoom with 1 user
			const waitingRoom = await  prisma.gameRoom.findFirst({
				include: {
					_count: {
						select: {
							users: true
						}
					}
				}
			})
			debug(waitingRoom?._count.users)

			if (!waitingRoom || waitingRoom._count.users !== 1) {
				// Create a new gameRoom
				const gameRoom = await prisma.gameRoom.create({ data: {} })

				// Create the user with that gameRoomId
				const user = await createUser(username, gameRoom.id)

				// // Get all users with that gameRoomId
				// const users = await prisma.user.findMany({ where: { gameRoomId: gameRoom.id } })
				// // debug(users)
			}
			else if (waitingRoom._count.users = 1) {
				// Create the user with that gameRoomId
				const user = await createUser(username, waitingRoom.id)
			}
			

			// availableRoom = gameRoom
			// socket.broadcast.emit('roomAvailable', availableRoom)

			socket.broadcast.emit('userJoinedGame', username)
			// socket.join(availableRoom.id)
			// socket.broadcast.to(availableRoom.id).emit('userJoinedGame', username)
		}
		catch (err) {
			debug('ERROR!')
		}

		const row = Math.ceil(Math.random() * 10)
		const column = Math.ceil(Math.random() * 10)
		const delay = Math.ceil(Math.random() * 5) * 1000
		
		socket.emit('showVirus', row, column, delay)
	})
	





	// let timer: number

	// const cells = document.querySelectorAll('.cell');
	// const randomIndex = Math.floor(Math.random() * cells.length);
	// const randomCell = cells[randomIndex] as HTMLDivElement

	// nextVirus(randomCell)

	// let round = 0
	// const nextVirus = (randomCell: HTMLDivElement) => {
	// 	randomCell.addEventListener('click', () => {
	// 		round++
	// 		// Remove any existing virus emoji
	// 		const existingVirus = document.querySelector('.cell-virus');
	// 		if (existingVirus) {
	// 			existingVirus.textContent = '';
	// 			existingVirus.classList.remove('cell-virus');
	// 		}

	// 		if (round >= 10) return console.log("Good game, well played!")
			
	// 		displayVirus()
	// 	})
	// }
}
