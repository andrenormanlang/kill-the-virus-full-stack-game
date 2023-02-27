import './assets/scss/style.scss'

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
	})
}
