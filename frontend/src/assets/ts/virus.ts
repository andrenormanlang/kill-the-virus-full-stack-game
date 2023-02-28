export { }

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

const numRows = 4;
const numCols = 4;

function renderGameScreen() {
	let cells = '';
	for (let i = 0; i < numRows; i++) {
		for (let j = 0; j < numCols; j++) {
			cells += '<div class="cell"></div>';
		}
	}
	const gameScreen = document.querySelector('.gameScreen');
	gameScreen!.innerHTML = cells;
}

renderGameScreen()

let virusTimeout: number;

function displayVirus() {
	const cells = document.querySelectorAll('.cell');
	const randomIndex = Math.floor(Math.random() * cells.length);
	const randomCell = cells[randomIndex];

	// Remove any existing virus emoji
	const existingVirus = document.querySelector('.cell-virus');
	if (existingVirus) {
		existingVirus.textContent = '';
		existingVirus.classList.remove('cell-virus');
	}

	// Display the new virus emoji
	randomCell.textContent = '🦠';
	randomCell.classList.add('cell-virus');

	// Schedule the next virus display
	const randomTime = Math.floor(Math.random() * 10) + 1;
	virusTimeout = setTimeout(displayVirus, randomTime * 1000);
}

// Schedule the first virus display
const randomTime = Math.floor(Math.random() * 10) + 1;
virusTimeout = setTimeout(displayVirus, randomTime * 1000);


