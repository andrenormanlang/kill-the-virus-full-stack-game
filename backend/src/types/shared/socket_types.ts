/**
 * Socket Controller
 */
export {}

// Events emitted by the server to the client
export interface ServerToClientEvents {
	createGameRoom: () => void
}

// Events emitted by the client to the server
export interface ClientToServerEvents {

}

export interface InterServerEvents { }
