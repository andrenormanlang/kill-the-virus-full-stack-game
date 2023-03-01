/**
 * Socket Controller
 */
export {}

// Events emitted by the server to the client
export interface ServerToClientEvents {
	hello: () => void
	showVirus: (row: number, column: number, delay: number) => void
}

// Events emitted by the client to the server
export interface ClientToServerEvents {
	// userJoinedLobby: (username: string) => void
	userJoinedGame: (username: string) => void
}

export interface InterServerEvents { }
