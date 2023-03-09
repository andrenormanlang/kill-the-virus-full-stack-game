/**
 * reactionTime Sercive
 */
import prisma from '../prisma'
import { ReactionTimeData } from '../types/shared/socket_types'

export const findReactionTimesByUserId = (userId: string) => {
	return prisma.reactionTime.findMany({ where: { userId } })
}

export const findRecentReactionTimes = (gameRoomId: string) => {
	return prisma.reactionTime.findMany({
		where: { user: { gameRoomId } },
		take: 2,
		orderBy: { id: 'desc' },
		include: { user: true }
	})
}

export const getBestEverReactionTime = () => {
	return prisma.reactionTime.findFirst({
		where: { time: { not: null } },
		orderBy: { time: 'asc' },
		include: { user: true },
	})
}

export const createReactionTime = (timeTakenToClick: number, userId: string) => {
	return prisma.reactionTime.create({
		data: {
			time: timeTakenToClick,
			userId,
		}
	})
}
