/**
 * User Sercive
 */
import prisma from '../prisma'
import { UserData } from '../types/shared/socket_types'

export const findUser = (userId: string) => {
	return prisma.user.findUnique({ where: { id: userId } })
}

export const createUser = (userData: UserData) => {
	return prisma.user.create({ data: userData })
}

export const updateUsersVirusClicked = (userId: string, virusClickedData: { virusClicked: boolean }) => {
	return prisma.user.update({
		where: { id: userId },
		data: virusClickedData,
	})
}

export const updateScore = (userId: string | null, score: { score: number }) => {

	if (!userId) {
		throw new Error('User ID is null')
	}

	return prisma.user.update({
		where: { id: userId },
		data: score,
	})
}

export const deleteUser = (userId: string) => {
	return prisma.user.delete({ where: { id: userId } })
}
