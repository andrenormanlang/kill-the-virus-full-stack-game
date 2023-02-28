export { }
const lobbyEl = document.querySelector<HTMLDivElement>('#lobby')

const joinGameBtn = document.querySelector<HTMLButtonElement>('#enter')
const gameEl = document.querySelector<HTMLDivElement>('#game')

if (joinGameBtn && lobbyEl && gameEl) {
	joinGameBtn.addEventListener('click', (e) => {
		e.preventDefault()

		// Hide the lobby element
		lobbyEl.style.display = 'none'

		// Show the game element
		gameEl.style.display = 'block'

		renderGameScreen()
		
		displayVirus()
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

let virusTimeout: number;
let round = 0
let timer: number

function displayVirus() {
	const cells = document.querySelectorAll('.cell');
	const randomIndex = Math.floor(Math.random() * cells.length);
	const randomCell = cells[randomIndex] as HTMLDivElement

	const randomTime = Math.ceil(Math.random() * 5)
	// console.log(randomTime)

	setTimeout(() => {
		// console.log('VIRUS!')
		// Display the new virus emoji
		randomCell.textContent = '🦠';
		randomCell.classList.add('cell-virus');
		timer = Date.now() / 1000

	}, randomTime * 1000);

	const timeTakenToClick = Number((Date.now() / 1000 - timer).toFixed(3))
	console.log("It took", timeTakenToClick, "seconds")

	nextVirus(randomCell)
}

const nextVirus = (randomCell: HTMLDivElement) => {
	randomCell.addEventListener('click', () => {
		round++
		// Remove any existing virus emoji
		const existingVirus = document.querySelector('.cell-virus');
		if (existingVirus) {
			existingVirus.textContent = '';
			existingVirus.classList.remove('cell-virus');
		}

		if (round >= 10) return console.log("Good game, well played!")
		
		displayVirus()
	})
}
