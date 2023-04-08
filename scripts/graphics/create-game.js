// handles create-game logic
let createGameFormElem = document.forms["create-game-form"];
let createGameFormPopup = document.getElementById("create-game-popup");
let createGameFormBoardElem = createGameFormElem.getElementsByClassName("game")[0];
let createGameFormState = new Board();

createGameFormElem.fen.addEventListener("input", (event) => {
    console.log("changed", event);
    createGameFormState.loadFENB(createGameFormElem.fen.value);
    displayBoard(createGameFormState, false, false, createGameFormBoardElem);
});
createGameFormElem.fen.value = StartingFENB;
createGameFormState.loadFENB(StartingFENB);
displayBoard(createGameFormState, false, false, createGameFormBoardElem);

function showCreateGamePopup(){
    document.getElementById("invite-popup-container").style.display = "flex";
    document.getElementById("invite-popup").style.display = "none";
    createGameFormPopup.style.display = "block";
}

createGameFormElem.addEventListener("submit", (event) => {
    event.preventDefault();

    let gameConfig = {
        color: this.color.value,
        fen: this.fen.value
    };

    hideCreateGamePopup();
    generateInvite(gameConfig);
});

function hideCreateGamePopup(){
    createGameFormPopup.style.display = "none";
}
