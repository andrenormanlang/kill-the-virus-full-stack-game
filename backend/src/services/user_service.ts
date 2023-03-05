/**
 * User Sercive
 */
import prisma from '../prisma'
import { User } from '@prisma/client'

export const findUser = (userId: string) => {
	return prisma.user.findUnique({
		where: { id: userId },
		include: { reactionTime: true }
	})
}

export const createUser = (data: User) => {
	return prisma.user.create({ data })
}

export const updateUsersVirusClicked = (userId: string, virusClicked: boolean) => {
	return prisma.user.update({
		where: { id: userId },
		data: { virusClicked }
	})
}

export const deleteUser = (userId: string) => {
	return prisma.user.delete({ where: { id: userId } })
}
