
/**
 * Socket Controller
 */
export { }

// Events emitted by the server to the client
export interface ServerToClientEvents {
	firstRound: (firstRoundData: VirusData, playerData1: PlayerData, playerData2: PlayerData) => void
	newRound: (newRoundData: NewRoundData) => void
	endGame: (userDataArray: UserData[]) => void
	reactionTime: (reactionTime: number) => void
	updateScore: (player1Score: number, player2Score: number, player1Id: string) => void
	liveGame: (liveGameData: LiveGameData) => void
	liveGames: (liveGames: LiveGameData[] | []) => void
	removeLiveGame: (gameRoomId: string) => void
	tenLatestGames: (latestGames: LatestGamesData[]) => void
	bestEverReactionTime: (userName: string | null, time: number | null) => void
	bestAverageReactionTime: (userName: string | null, averageReactionTime: number) => void
	opponentLeft: () => void
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

export interface PlayerData {
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
}

export interface LiveGameData {
	player1Username: string
	player1Score: number
	player2Username: string
	player2Score: number
	gameRoomId: string
}

export interface LatestGamesData {
	player1: string
	player2: string
	player1Score: number
	player2Score: number
}
