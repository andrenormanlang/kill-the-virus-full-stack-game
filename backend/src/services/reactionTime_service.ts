/**
 * reactionTime Sercive
 */
import prisma from '../prisma'
import { ReactionTimeData } from '../types/shared/socket_types'

export const findReactionTimesByUserId = (userId: string) => {
	return prisma.reactionTime.findMany({ where: { userId } })
}

export const findReactionTimesByRoomId = (gameRoomId: string) => {
	return prisma.reactionTime.findMany({ where: { id: gameRoomId } })
}

export const createReactionTime = (data: ReactionTimeData) => {
	return prisma.reactionTime.create({ data })
}

export const deleteReactionTimes = (userId: string) => {
	return prisma.reactionTime.deleteMany({ where: { userId } })
}
