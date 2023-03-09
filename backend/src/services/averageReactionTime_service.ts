/**
 * averageReactionTime Servive
 */
import prisma from '../prisma'

export const getBestAverageReactionTime = () => {
	return prisma.averageReactionTime.findFirst({
		orderBy: { averageReactionTime: 'asc' },
	})
}

export const createAverageReactionTime = (name: string, averageReactionTime: number) => {
	return prisma.averageReactionTime.create({
		data: {
			name,
			averageReactionTime,
		}
	})
}
