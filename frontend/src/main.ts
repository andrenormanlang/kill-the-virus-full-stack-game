import './assets/scss/style.scss'
import './assets/ts/rounds'
import { io, Socket } from 'socket.io-client'
import { ClientToServerEvents, PlayerData, ServerToClientEvents, VirusData } from '@backend/types/shared/socket_types'

const SOCKET_HOST = import.meta.env.VITE_APP_SOCKET_HOST
const socket: Socket<ServerToClientEvents, ClientToServerEvents> = io(SOCKET_HOST)

// Forms
const usernameBtnEl = document.querySelector('#enter') as HTMLFormElement
const usernameFormEl = document.querySelector('#username-form') as HTMLFormElement
const spinnerEl = document.querySelector('#spinner') as HTMLFormElement
const toLobbyEl = document.querySelector('#toLobby') as HTMLButtonElement

// Div
const gameEl = document.querySelector('#game') as HTMLDivElement
const gameScreenEl = document.querySelector("#gameScreen") as HTMLDivElement
const lobbyEl = document.querySelector('#lobby') as HTMLDivElement
const endGameBoardEl = document.querySelector('#endGameBoard') as HTMLDivElement

// Others
const winnerEl = document.querySelector('#winner') as HTMLHeadingElement
const yourReactionTimeEl = document.querySelector('#yourReactionTime') as HTMLParagraphElement
const opponentReactionTimeEl = document.querySelector('#opponentReactionTime') as HTMLParagraphElement
const yourScoreEl = document.querySelector('#yourScore') as HTMLParagraphElement
const opponentScoreEl = document.querySelector('#opponentScore') as HTMLParagraphElement

// User details
let username: string | null = null
let timer = 0.00
let counter = 0.00

const startTimer = (start: boolean) => {
	const startTime = Date.now()

	if (start) {
		timer = setInterval(() => {
			counter = Number(((Date.now() - startTime) / 1000).toFixed(3))
			const liveTimerEl = document.querySelector('#liveTimer')
			if (liveTimerEl) {
				liveTimerEl.textContent = counter.toString()
			}
		}, 10)
	} else {
		clearInterval(timer)
	}
}

// Displays the virus do the DOM
const displayVirus = (virusData: VirusData) => {
	const { row, column, delay } = virusData

	setTimeout(() => {
		(document.querySelector('#gameScreen') as HTMLDivElement).innerHTML = `
			<div class="virus" id="virus" style="grid-row: ${row}; grid-column: ${column};">🦠</div>
		`
		// Start the timer
		timer = Date.now() / 1000
		startTimer(true)
	}, delay)
}

toLobbyEl.addEventListener('click', () => {
	lobbyEl.style.display = 'block'
	gameEl.style.display = 'none'
	endGameBoardEl.style.display = 'none'
	location.reload()
})

socket.on('connect', () => {
	console.log('Connected to server')
})

// Handle the latestGames data here
socket.on('tenLatestGames', (latestGames) => {
	console.log('Latest games:', latestGames)

	const gamesAsListItems = latestGames
		.map(game => `<li>${game.player1} ${game.player1Score} - ${game.player2Score} ${game.player2}</li>`)
		.join('');

	(document.getElementById('reactionList') as HTMLUListElement).innerHTML = `${gamesAsListItems}`
})

socket.on('liveGame', (liveGameData) => {
	const { player1Username, player1Score, player2Username, player2Score, gameRoomId } = liveGameData
	const gameInfo = `${player1Username} ${player1Score} : ${player2Score} ${player2Username}`

	const existingGameListItem = document.getElementById(gameRoomId)
	existingGameListItem
		? existingGameListItem.innerHTML = `${gameInfo}`
		: (document.getElementById("gameList") as HTMLUListElement).innerHTML += `
			<li id="${gameRoomId}">${gameInfo}</li>
		`
})

socket.on('removeLiveGame', (gameRoomId) => {
	const listItemToRemove = document.getElementById(gameRoomId)
	if (listItemToRemove) {
		listItemToRemove.remove()
	}
})

socket.on('endGame', (userDataArray) => {
	const [ userData1, userData2 ] = userDataArray
	lobbyEl.style.display = 'none'
	gameEl.style.display = 'none'
	endGameBoardEl.style.display = 'flex'

	winnerEl.innerHTML = userData1.averageReactionTime! < userData2.averageReactionTime! ? userData1.name : userData2.name

	if (userData1.id === socket.id) {
		yourReactionTimeEl.innerText = `Your average reaction time: ${userData1.averageReactionTime!.toFixed(2)}`
		yourScoreEl.innerText = `Your score: ${userData1.score}`
		opponentReactionTimeEl.innerText = `Opponents average reaction time: ${userData2.averageReactionTime!.toFixed(2)}`
		opponentScoreEl.innerText = `Opponent score: ${userData2.score}`
	} else {
		yourReactionTimeEl.innerText = `Your average reaction time: ${userData2.averageReactionTime!.toFixed(2)}`
		yourScoreEl.innerText = `Your score: ${userData2.score}`
		opponentReactionTimeEl.innerText = `Opponents average reaction time: ${userData1.averageReactionTime!.toFixed(2)}`
		opponentScoreEl.innerText = `Opponent score: ${userData1.score}`
	}

	console.log('Game ended, goodbye.')
})

socket.on('reactionTime', (reactionTime) => {
	(document.querySelector('#opponentTime') as HTMLDivElement).innerText = ` ${reactionTime}`
	console.log('Opponent:', reactionTime)
})

socket.on('firstRound', (firstRoundData, round, playerData1: PlayerData, playerData2: PlayerData) => {
	const yourNameEl = document.querySelector('.yourName') as HTMLDivElement
	const opponentNameEl = document.querySelector('.opponentName') as HTMLDivElement
	
	if(socket.id === playerData1.id){
		yourNameEl.innerText = `${playerData1.name} : `
		opponentNameEl.innerText = `${playerData2.name} : `
	}
	else{
		yourNameEl.innerText = `${playerData2.name} : `
		opponentNameEl.innerText = `${playerData1.name} : `
	}

	console.log('Round:', round)
	// Hide lobby and show game
	lobbyEl.style.display = 'none'
	gameEl.style.display = 'block'
	spinnerEl.classList.remove('hide')
	displayVirus(firstRoundData)
})

socket.on('newRound', (newRoundData) => {
	const { row, column, delay, round } = newRoundData
	console.log('Round:', round)

	displayVirus({ row, column, delay })
})

socket.on('updateScore', (player1Score: number, player2Score: number, player1Id: string) => {
	const scoreEl = document.querySelector('#score') as HTMLDivElement

	if (player1Id === socket.id) {
		scoreEl.innerText = `${player1Score} - ${player2Score}`
	} else {
		scoreEl.innerText = `${player2Score} - ${player1Score}`
	}
})

usernameFormEl.addEventListener('submit', e => {
	e.preventDefault()

	usernameBtnEl.setAttribute('disabled', 'disabled')
	spinnerEl.classList.remove('hide')

	// Get username
	username = (usernameFormEl.querySelector('#username-input') as HTMLInputElement).value.trim()
	if (!username) return

	socket.emit('userJoin', username)
})

// Eventlistener when clicking the virus
gameScreenEl.addEventListener("click", e => {
	const target = e.target as HTMLElement
	if (!target.classList.contains('virus')) return

	(document.querySelector('#virus') as HTMLDivElement).remove()

	startTimer(false)

	const timeTakenToClick = counter
	console.log('My time:', timeTakenToClick);
	(document.querySelector('#myTime') as HTMLDivElement).innerText = ` ${timeTakenToClick}`

	socket.emit('clickVirus', timeTakenToClick)
})


export default socket
