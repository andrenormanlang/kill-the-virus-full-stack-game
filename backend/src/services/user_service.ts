/**
 * User Sercive
 */
import { User } from '@prisma/client'
import prisma from '../prisma'

export const createUser = (data: User) => {
	return prisma.user.create({ data })
}
