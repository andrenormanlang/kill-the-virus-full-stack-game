import { GameRoom } from "@prisma/client"

/**
 * Socket Controller
 */
export { }

// Events emitted by the server to the client
export interface ServerToClientEvents {
	hello: () => void
	firstRound: (firstRoundData: VirusData, round: number, playerData1: PlayerData, playerData2: PlayerData) => void
	newRound: (newRoundData: NewRoundData) => void
	userJoinedGame: (username: string) => void
	roomAvailable: (room: GameRoom) => void
	endGame: (userDataArray: UserData[]) => void
	reactionTime: (reactionTime: number) => void
	updateScore: (player1Score: number, player2Score: number, player1Id: string) => void
	liveGame: (liveGameData: LiveGameData) => void
	removeLiveGame: (gameRoomId: string) => void
	tenLatestGames: (latestGame: {
		player1: string;
		player2: string;
		player1Score: number;
		player2Score: number;
	}[]) => void;
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
	// userJoinedLobby: (username: string) => void
	userJoin: (username: string) => void
	clickVirus: (timeTakenToClick: number) => void
	toLobby: () => void
}

export interface ReactionTimeData {
	time: number
	userId: string
}

export interface GameRoomData {
	userCount: number
	roundCount: number
}

export interface UserData {
	id: string
	name: string
	gameRoomId: string
	virusClicked?: boolean
	score: number
	averageReactionTime?: number
}

export interface PlayerData{
	id: string
	name: string
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

export interface LiveGameData {
	player1Username: string
	player1Score: number
	player2Username: string
	player2Score: number
	gameRoomId: string
}
