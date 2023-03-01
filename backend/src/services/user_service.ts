/**
 * User Sercive
 */
import prisma from '../prisma'

export const createUser = async (socketId: string, username: string, roomId: string) => {
	return await prisma.user.create({
		data: {
			id: socketId,
			name: username,
			gameRoomId: roomId,
		}
	})
}
