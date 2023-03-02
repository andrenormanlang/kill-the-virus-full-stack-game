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

				debug(user.name, 'created and joined a game:', gameRoom.id)
			}

			else if (existingRoom.userCount = 1) {
				const user = await createUser({
					id: socket.id,
					name: username,
					gameRoomId: existingRoom.id,
				})
				
				await prisma.gameRoom.update({
					where: { id: existingRoom.id },
					data: { userCount: 2 }
				})

				debug(user.name, 'joined a game:', existingRoom.id)

				// Calculate where and when the virus will appear
				const row = Math.ceil(Math.random() * 10)
				const column = Math.ceil(Math.random() * 10)
				const delay = Math.ceil(Math.random() * 5) * 1000
				
				socket.emit('showVirus', row, column, delay)
			}
		}
		catch (err) {
			debug('ERROR!')
		}
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
