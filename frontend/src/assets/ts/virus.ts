export {}

const usernameForm = document.querySelector<HTMLFormElement>('#usernameForm')
const inputEl = document.querySelector<HTMLInputElement>('#input')
const lobbyEl = document.querySelector<HTMLDivElement>('#lobby')

if (usernameForm && inputEl && lobbyEl) {
	usernameForm.addEventListener('submit', (e) => {
		e.preventDefault()

		const username = inputEl.value.trim()

		if (username) {
			// Hide the username input
			usernameForm.style.display = 'none'

			// Show the lobby
			lobbyEl.style.display = 'block'
		}
	})
}

const joinGameBtn = document.querySelector<HTMLButtonElement>('#joinGame')
const gameEl = document.querySelector<HTMLDivElement>('#game')

if (joinGameBtn && lobbyEl && gameEl) {
	joinGameBtn.addEventListener('click', (e) => {
		e.preventDefault()

		// Hide the lobby element
		lobbyEl.style.display = 'none'

		// Show the game element
		gameEl.style.display = 'block'

		displayVirus()
	})
}

let virusTimeout: number;
let round = 0

const nextVirus = (randomCell: HTMLDivElement) => {
	round++
	console.log('Round:', round)

	randomCell.addEventListener('click', () => {
		// Remove any existing virus emoji
		const existingVirus = document.querySelector('.cell-virus');
		if (existingVirus) {
			existingVirus.textContent = '';
			existingVirus.classList.remove('cell-virus');
		}

		if (round >= 10) return
		
		displayVirus()
	})
}

function displayVirus() {
	const cells = document.querySelectorAll('.cell');
	const randomIndex = Math.floor(Math.random() * cells.length);
	const randomCell = cells[randomIndex] as HTMLDivElement

	const randomTime = Math.ceil(Math.random() * 5)
	console.log(randomTime)

	setTimeout(() => {
		console.log('VIRUS!')
		// Display the new virus emoji
		randomCell.textContent = '🦠';
		randomCell.classList.add('cell-virus');
	}, randomTime * 1000);

	nextVirus(randomCell)
}
