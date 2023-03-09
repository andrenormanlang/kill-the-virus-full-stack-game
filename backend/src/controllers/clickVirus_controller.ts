import Debug from "debug"
import { Socket } from "socket.io"
import { deleteGameRoom, findGameRoomById, updateGameRoomsRoundCount } from "../services/gameRoom_service"
import { createReactionTime, findReactionTimesByUserId, getBestEverReactionTime } from "../services/reactionTime_service"
import { getUserById, updateUsersVirusClicked } from "../services/user_service"
import { ClientToServerEvents, NewRoundData, ServerToClientEvents } from "../types/shared/socket_types"
import { calcAverageReactionTime, calcVirusData, updateScores } from "./function_controller"
import { io } from "../../server"
import { countPreviousGames, getPreviousGames, getOldestGame, deleteOldestGame, createPreviousGame } from "../services/previousGame_service"
import { createAverageReactionTime, getBestAverageReactionTime } from "../services/averageReactionTime_service"

// Create a new debug instance
const debug = Debug('ktv:socket_controller')

/**
 * clickVirus Controller
 */
export const listenForVirusClick = (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
	socket.on('clickVirus', async (timeTakenToClick) => {
		try {
			const user = await getUserById(socket.id)
			if (!user) return

			// Update the users virusClicked to 'true'
			await updateUsersVirusClicked(user.id, { virusClicked: true })

			let gameRoom = await findGameRoomById(user.gameRoomId)
			if (!gameRoom) return

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
				await updateUsersVirusClicked(user.id, { virusClicked: false })
			})

			await updateScores(gameRoom.id)

			gameRoom = await updateGameRoomsRoundCount(gameRoom.id)

			// For every round
			if (gameRoom.roundCount <= 10) {
				// Get the virus information
				const virusData = calcVirusData()
				const newRoundPayload: NewRoundData = {
					row: virusData.row,
					column: virusData.column,
					delay: virusData.delay,
				}
				// Give the next virus to both players
				io.to(gameRoom.id).emit('newRound', newRoundPayload)
			}
			// When the game ends
			else {
				// Returns an array of UserData objects for every user
				const userDataArray = await Promise.all(gameRoom.users.map(async (user) => {
					const reactionTimes = await findReactionTimesByUserId(user.id)

					const averageReactionTime = Number(calcAverageReactionTime(reactionTimes).toFixed(3))

					// Save the average reaction time for each player in the database
					await createAverageReactionTime(user.name, averageReactionTime)

					return {
						id: user.id,
						name: user.name,
						gameRoomId: gameRoom!.id,
						score: user.score!,
						averageReactionTime,
					}
				}))

				io.to(gameRoom.id).emit('endGame', userDataArray)

				const [player1, player2] = gameRoom.users

				// Before removing the room and user add the game to the ten latest games in database
				await createPreviousGame(player1.name, player2.name, player1.score!, player2.score!)

				// Count how many games there are in tenLatestGames
				const latestGamesCount = await countPreviousGames()

				if (latestGamesCount > 10) {
					// Find oldest game
					const oldestGame = await getOldestGame()
					if (!oldestGame) return

					// Delete oldest game
					await deleteOldestGame(oldestGame.id)
				}

				// Get and emit the latetsGames
				const latestGames = await getPreviousGames()
				io.emit('tenLatestGames', latestGames)

				// Get and emit the best everReactionTime
				const bestEverReactionTime = await getBestEverReactionTime()
				const userName = bestEverReactionTime?.user?.name ?? null
				const time = bestEverReactionTime?.time ?? null
				io.emit('bestEverReactionTime', userName, time)

				// Get and emit the bestAverageReactionTime
				const bestAverageReactionTime = await getBestAverageReactionTime()
				const name = bestAverageReactionTime?.name ?? null
				const averageReactionTime = bestAverageReactionTime?.averageReactionTime ?? 0
				io.emit('bestAverageReactionTime', name, averageReactionTime)

				// Delete the gameRoom from the database and live games
				io.emit('removeLiveGame', gameRoom.id)
				deleteGameRoom(user.gameRoomId)
			}
		}
		catch (err) {
			debug('ERROR clicking the virus!', err)
		}
	})
}
