import { GameRoom } from "@prisma/client"

/**
 * Socket Controller
 */
export {}

// Events emitted by the server to the client
export interface ServerToClientEvents {
	hello: () => void
	showVirus: (row: number, column: number, delay: number, round: number) => void
	userJoinedGame: (username: string) => void
	roomAvailable: (room: GameRoom) => void
	endGame: () => void
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
	// userJoinedLobby: (username: string) => void
	userJoin: (username: string) => void
	clickVirus: () => void
}
