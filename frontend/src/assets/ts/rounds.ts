export {}

// variable to start the loop
let playGame = false
// array for all 10 reaction times
let reactionTime:any = []
// variable for reaction time (1 round)
let scoreRound = 0

let i = 0

let joinGameEl = document.querySelector("#joinGame")
let gameScreenEl = document.querySelector(".gameScreen")


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


// To start the game
joinGameEl?.addEventListener("click", () => {
    playGame = true
    console.log(playGame)
    
    // Loop for 10 rounds
    while (playGame) {
        
        // adds reaction time (score) to array
        gameScreenEl!.addEventListener("click", (e:any) => {
            console.log(e)
            if (e.target.classList.contains('cell-virus')){
                reactionTime.push(scoreRound)
                
                // to not make it too hasty changing after clicking on a virus
                setTimeout(() => {
                    i++
                }, 2000)
                console.log(i)
            }
        })

        if (i <= 10) {

                playGame = true
                console.log("play status", playGame, "round", i)
                return
                
        } else if(i > 10){

                playGame = false
                console.log("play status", playGame, "round", i)
                
                averageReactionTime()
                return playGame


         }
    }
})