export {}

let playGame = false
let reactionTime:any = []
let i = 0
let scoreRound = 0

let joinGameEl = document.querySelector("#joinGame")

joinGameEl?.addEventListener("click", () => {
    playGame = true
    console.log(playGame)
})

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

// Loop for 10 rounds
while (playGame) {

    // adds reaction time (score) to array
    document!.addEventListener("click", (e:any) => {
        console.log(e)
        if (e.target.classList.contains('.cell-virus') && e.target.classList.contains('.cell')){
            reactionTime.push(scoreRound)
            setTimeout(() => {
               i++
            }, 1000)
            console.log(i)
        }
    })
    if (i <= 10) {
        playGame = true
        console.log(playGame, i)

    } else {
        playGame = false
        console.log(playGame, i)
        
        averageReactionTime()
    }
}