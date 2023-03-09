/**
 * previousGame Servive
 */
import prisma from '../prisma'

export const getPreviousGames = () => {
	return prisma.previousGame.findMany({ orderBy: { date: 'desc' } })
}

export const getOldestGame = () => {
	return prisma.previousGame.findFirst({ orderBy: { date: 'asc' } })
}

export const countPreviousGames = () => {
	return prisma.previousGame.count()
}

export const deleteOldestGame = (oldestGameId: string) => {
	return prisma.previousGame.delete({ where: { id: oldestGameId } })

}

export const createPreviousGame = (player1Name: string, player2Name: string, player1Score: number, player2Score: number) => {
	return prisma.previousGame.create({
		data: {
			player1: player1Name,
			player2: player2Name,
			player1Score,
			player2Score,
		},
	})
}
