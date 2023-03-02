export {}

// variable to start the loop
let playGame = false
// array for all 10 reaction times
let reactionTime: number[]
// variable for reaction time (1 round)
let scoreRound = 0

let round = 0

const joinGameEl = document.querySelector("#joinGame")
const gameScreenEl = document.querySelector(".gameScreen")
const lobbyEl = document.querySelector<HTMLDivElement>('#lobby')
const gameEl = document.querySelector<HTMLDivElement>('#game')



// calculates the average reactionTime for all rounds
const averageReactionTime = () => {
let sum = 0;
for (let i = 0; i < reactionTime.length; i++) {
    sum += reactionTime[i];
}
let average = sum / reactionTime.length;
console.log(average)
return average
}

joinGameEl?.addEventListener("click", (e) => {
    e.stopImmediatePropagation;
    playGame = true;

    // Eventlistener when clicking the virus
    gameScreenEl!.addEventListener("click", (e:any) => {

        while (playGame) {
            if (e.target.classList.contains('cell-virus')) {
                round++
				console.log('Round:', round)

                scoreRound = 1//hårdkodat atm, add reaction time and then push to reactionTime array
                

                if (round === 10) {
                    playGame = false;
                    averageReactionTime()
		            gameEl!.style.display = 'none'
		            lobbyEl!.style.display = 'block'

                } else if (round < 10){
                    
                    setTimeout(() => {
                        round++;

                    }, 300);

                    playGame = false;
                
                }

            }
        }
    })
})

// Thinking we can connect the round-variable to the reaction time so the timer will restart for each round.
