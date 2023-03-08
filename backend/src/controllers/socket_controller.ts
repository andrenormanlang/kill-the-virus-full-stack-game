/**
 * Socket Controller
 */
import Debug from 'debug'
import { Socket } from 'socket.io'
import { createUser, deleteUser, findUser, updateScore, updateUsersVirusClicked } from '../services/user_service'
import { ClientToServerEvents, LiveGameData, NewRoundData, ServerToClientEvents, PlayerData } from '../types/shared/socket_types'
import { io } from '../../server'
import { createReactionTime, deleteReactionTimes, findReactionTimesByUserId } from '../services/reactionTime_service'
import { createGameRoom, deleteGameRoom, findGameRoomById, findGameRoomByUserCount, updateGameRoomsUserCount } from '../services/gameRoom_service'
import { ReactionTime } from "@prisma/client"
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

const updateScoresForGameRoom = async (gameRoomId: string) => {
	try {
		const latestReactionTimes = await prisma.reactionTime.findMany({
			where: { user: { gameRoomId: gameRoomId } },
			take: 2,
			orderBy: { id: 'desc' },
			include: { user: true }
		})
		debug('latestReactionTimes:', latestReactionTimes)

		if (latestReactionTimes[0].time && latestReactionTimes[1].time) {
			// Should be always the winner because sort by time
			const winner = latestReactionTimes.sort((reactionTime1, reactionTime2) => reactionTime1.time! - reactionTime2.time!)[0].user!
			debug('winner:', winner)

			await prisma.user.update({
				where: { id: winner.id },
				data: { score: { increment: 1 } }
			})

			const players = await prisma.user.findMany({
				where: { gameRoom: { id: gameRoomId } },
				select: {
					id: true,
					name: true,
					score: true
				}
			})

			const player1Score = players[0].score ?? 0
			const player2Score = players[1].score ?? 0

			const player1Username = players[0].name
			const player2Username = players[1].name

			const player1Id = players[0].id

			debug('players score:', players)

			io.to(gameRoomId).emit('updateScore', player1Score, player2Score, player1Id)

			const liveGamePayload: LiveGameData = {
				player1Username,
				player1Score,
				player2Username,
				player2Score,
				gameRoomId,
			}

			io.emit('liveGame', liveGamePayload)

		}
	} catch (err) {
		debug('Error updating scores:', err)
	}

}

const averageReactionTime = (reactionTimes: ReactionTime[]) => {
	return reactionTimes
		.map((reactionTime) => reactionTime.time!)
		.reduce((sum, value) => sum + value, 0) / reactionTimes.length
}

// Handle the user connecting
export const handleConnection = (socket: Socket<ClientToServerEvents, ServerToClientEvents>) => {
	debug('🙋🏼 A user connected -', socket.id)

	const getLatestGames = async () => {
		const latestGames = await prisma.previousGame.findMany({ orderBy: { date: 'desc' } })

		io.emit('tenLatestGames', latestGames)
	}

	getLatestGames()


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

	socket.on('userJoin', async (username) => {
		try {
			// Find an existing gameRoom with only 1 user
			const existingRoom = await findGameRoomByUserCount(1)

			if (!existingRoom || existingRoom.userCount !== 1) {
				// Create a new gameRoom
				const gameRoom = await createGameRoom({ userCount: 1, roundCount: 1 })

				// Create a user and connect with newly created gameRoom
				const user = await createUser({
					id: socket.id,
					name: username,
					gameRoomId: gameRoom.id,
					score: 0
				})

				socket.join(gameRoom.id)
				debug(user.name, 'created and joined a game:', gameRoom.id)
			}

			else if (existingRoom.userCount === 1) {
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

				let userInformation = await prisma.user.findMany({
					where: {
						gameRoomId: user.gameRoomId
					}
				})

				let playerData1: PlayerData = {
					id: userInformation[0].id,
					name: userInformation[0].name
				}

				let playerData2: PlayerData = {
					id: userInformation[1].id,
					name: userInformation[1].name
				}

				io.to(existingRoom.id).emit('firstRound', firstRoundPayload, existingRoom.roundCount, playerData1, playerData2)
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

			updateScoresForGameRoom(gameRoom.id)

			gameRoom = await prisma.gameRoom.update({
				where: {
					id: gameRoom.id
				},
				include: { users: true },
				data: { roundCount: { increment: 1 } }
			})

			// When the game ends
			if (gameRoom.roundCount > 10) {
				// Returns an array of UserData objects
				const userDataArray = await Promise.all(gameRoom.users.map(async (user) => {
					const reactionTimes = await prisma.reactionTime.findMany({
						where: { userId: user.id }
					})

					const playerAverageReactionTime = averageReactionTime(reactionTimes)

					return {
						id: user.id,
						name: user.name,
						gameRoomId: gameRoom!.id,
						score: user.score!,
						averageReactionTime: playerAverageReactionTime
					}
				}))

				io.to(gameRoom.id).emit('endGame', userDataArray)

				io.emit('removeLiveGame', user.gameRoomId)
			} else {
				// Get the virus information
				const virusData = calcVirusData()
				const newRoundPayload: NewRoundData = {
					row: virusData.row,
					column: virusData.column,
					delay: virusData.delay,
					round: gameRoom.roundCount,
				}
				// Give the next virus to both players
				io.to(gameRoom.id).emit('newRound', newRoundPayload)
			}
		}
		catch (err) {
			debug('ERROR clicking the virus!', err)
		}

	})

	socket.on('toLobby', async () => {

		debug('✌🏻 A user went to Lobby', socket.id)

		try {
			const user = await findUser(socket.id)
			if (!user) return


			const theGameRoom = await findGameRoomById(user.gameRoomId)
			if (!theGameRoom) return

			const [ player1, player2 ] = theGameRoom.users

			// Before removing the room and user add the game to the ten latest game in database
			await prisma.previousGame.create({
				data: {
					player1: player1.name,
					player2: player2.name,
					player1Score: player1.score || 0,
					player2Score: player2.score || 0,
				},
			})

			// Count how many games there are in tenLatestGames
			const latestGamesCount = await prisma.previousGame.count()

			if (latestGamesCount > 10) {

				// Find oldest game
				const oldestGame = await prisma.previousGame.findFirst({ orderBy: { date: 'asc' } })
				if (!oldestGame) return

				// Delete oldest game
				await prisma.previousGame.delete({ where: { id: oldestGame.id } })
			}

			await getLatestGames()

			const gameRoom = await findGameRoomById(user.gameRoomId)
			if (!gameRoom) return
			const deletedRoom = await deleteGameRoom(user.gameRoomId)
			debug('Room deleted:', deletedRoom)

		}
		catch (err) {
			debug('ERROR finding or deleting one of following: user, gameRoom', err)
		}
	})

}


