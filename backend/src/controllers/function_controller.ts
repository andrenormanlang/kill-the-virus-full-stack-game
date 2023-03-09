/**
 * Function Controller
 */
import Debug from 'debug'
import { io } from '../../server'
import { LiveGameData } from '../types/shared/socket_types'
import { ReactionTime } from '@prisma/client'
import { getUsersInRoom, updateUsersScore } from '../services/user_service'
import { findRecentReactionTimes } from '../services/reactionTime_service'

// Create a new debug instance
const debug = Debug('ktv:socket_controller')

// Calculate where and when the virus will appear
export const calcVirusData = () => {
	return {
		row: Math.ceil(Math.random() * 10),
		column: Math.ceil(Math.random() * 10),
		delay: Math.ceil(Math.random() * 5) * 1000,
	}
}

// Calculate the average time of 10 rounds
export const calcAverageReactionTime = (reactionTimes: ReactionTime[]) => {
	return reactionTimes
		.map((reactionTime) => reactionTime.time!)
		.reduce((sum, value) => sum + value, 0) / reactionTimes.length
}

export const updateScores = async (gameRoomId: string) => {
	try {
		const latestReactionTimes = await findRecentReactionTimes(gameRoomId)

		if (!(latestReactionTimes[0].time && latestReactionTimes[1].time)) return

		// Should be always the winner because sort by time
		const winner = latestReactionTimes.sort((reactionTime1, reactionTime2) => reactionTime1.time! - reactionTime2.time!)[0].user!
		debug('winner:', winner)

		await updateUsersScore(winner.id)

		const players = await getUsersInRoom(gameRoomId)

		const player1Score = players[0].score ?? 0
		const player2Score = players[1].score ?? 0
		const player1Username = players[0].name
		const player2Username = players[1].name
		const player1Id = players[0].id

		const liveGamePayload: LiveGameData = {
			player1Username,
			player1Score,
			player2Username,
			player2Score,
			gameRoomId,
		}

		io.to(gameRoomId).emit('updateScore', player1Score, player2Score, player1Id)
		io.emit('liveGame', liveGamePayload)
	}
	catch (err) {
		debug('Error updating scores:', err)
	}
}
