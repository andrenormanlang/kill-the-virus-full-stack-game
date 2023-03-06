import { GameRoom } from "@prisma/client"

/**
 * Socket Controller
 */
export { }

// Events emitted by the server to the client
export interface ServerToClientEvents {
	hello: () => void
	firstRound: (firstRoundData: VirusData, round: number) => void
	newRound: (newRoundData: NewRoundData) => void
	userJoinedGame: (username: string) => void
	roomAvailable: (room: GameRoom) => void
	endGame: () => void
	reactionTime: (reactionTime: number) => void
	reset: () => void
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
	// userJoinedLobby: (username: string) => void
	userJoin: (username: string) => void
	clickVirus: (timeTakenToClick: number) => void
}

export interface ReactionTimeData {
	time: number
	userId: string
}

export interface GameRoomData {
	userCount: number
}

export interface UserData {
	id: string
	name: string
	gameRoomId: string
	virusClicked?: boolean
	score: number
}

export interface VirusData {
	row: number
	column: number
	delay: number
}

export interface NewRoundData {
	row: number
	column: number
	delay: number
	round: number
}
