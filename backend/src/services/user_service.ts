/**
 * User Sercive
 */
import prisma from '../prisma'

export const createUser = async (username: string, gameRoomId: string) => {
	return await prisma.user.create({
		data: {
			// id: socketId,
			name: username,
			gameRoomId,
		}
	})
}
