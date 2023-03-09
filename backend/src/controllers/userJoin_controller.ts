/**
 * 
 */

import Debug from "debug"
import prisma from "../prisma"
import { io } from "../../server"
import { Socket } from "socket.io"
import { createGameRoom, findGameRoomByUserCount, updateGameRoomsUserCount } from "../services/gameRoom_service"
import { createUser } from "../services/user_service"
import { ClientToServerEvents, PlayerData, ServerToClientEvents } from "../types/shared/socket_types"
import { calcVirusData } from "./function_controller"
import { GameRoom } from "@prisma/client"

// Create a new debug instance
const debug = Debug('ktv:socket_controller')

let availableGameRooms: GameRoom[] = []

export const listenForUserJoin = (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
	socket.on('userJoin', async (username) => {
		try {
			if (availableGameRooms.length === 0) {
				// Create a new gameRoom
				const gameRoom = await createGameRoom({ userCount: 1, roundCount: 1 })

				// Create a user and connect with newly created gameRoom
				await createUser({
					id: socket.id,
					name: username,
					gameRoomId: gameRoom.id,
					score: 0
				})

				socket.join(gameRoom.id)

				availableGameRooms.push(gameRoom)
				return
			}

			const existingRoom = availableGameRooms.pop()!

			// Continue if there is no existing lobby
			const user = await createUser({
				id: socket.id,
				name: username,
				gameRoomId: existingRoom.id,
				score: 0
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

			const userInformation = await prisma.user.findMany({ where: { gameRoomId: existingRoom.id } })

			const playerData1: PlayerData = {
				id: userInformation[0].id,
				name: userInformation[0].name
			}

			const playerData2: PlayerData = {
				id: userInformation[1].id,
				name: userInformation[1].name
			}

			io.to(existingRoom.id).emit('firstRound', firstRoundPayload, existingRoom.roundCount, playerData1, playerData2)



			const playerIds: string[] = []

			socket.on('startGame', async (userId) => {
				const gameRoom = await prisma.gameRoom.findUnique({
					where: { id: user.gameRoomId },
					include: { users: true }
				})
				if (!gameRoom) return

				gameRoom.users.forEach((user) => {
					playerIds.push(user.id)
				})
				debug(playerIds)
			})
		}
		catch (err) {
			debug('ERROR creating or joining a game!')
		}
	})
}
