
// creates a new global game state object
window.gameState = new Board();

let gameElem = document.getElementById("game");
let game_containerElem = document.getElementById("game_container");

const pieceToBackground = ['', '80%', '60%', '40%', '20%', '0%', '100%'];

const colorToBackground = [
    "0%",
    "0%",
    "100%"
];

// displays certain board features (ranks, files, tiles, etc.)
let filesElem = document.getElementById("files");
for (const c of "abcdefgh"){
    let file = document.createElement("div");
    file.innerText = c;
    filesElem.appendChild(file);
}

let ranksElem = document.getElementById("ranks");
for (let r = 1; r <= 8; r++){
    let rank = document.createElement("div");
    rank.innerText = r;
    ranksElem.appendChild(rank);
}

// generate all pieces for blocking
let blocking = document.getElementById("blocking");
let blockedElems = [];
for (let i = 1; i < pieceToBackground.length; i++){
    let blocked = document.createElement("div");
    blocked.id = `block${i}`;
    blocked.value = i;
    blocked.classList.add("blocked");
    blocked.style.backgroundPositionX = pieceToBackground[i];
    blocking.appendChild(blocked);

    // fortunately, i coincides with piece type value...
    blocked.addEventListener("click", blockedClick);

    // add elem to array
    blockedElems.push(blocked);
}

// blocks the given piece and confirms the move
function blockedClick(event){
    if (!testMove) return;

    testMove.block = this.value;
    console.log("FINAL MOVE", testMove);
    gameState.graphicsMakeMove(testMove);
    testMove = undefined;

    hideBlocks();

    // updates information of blocked piece
    (document.getElementsByClassName("blocking")[0] || this).classList.remove("blocking");
    this.classList.add("blocking");
}

// graphical promotion ui
let promoting = document.getElementsByClassName("promoting")[0];
for (let i = 2; i <= 5; i++){
    let p = document.createElement("div");
    p.id = `promote${i}`;
    p.style.backgroundPositionX = pieceToBackground[i];
    promoting.appendChild(p);

    p.addEventListener("click", () => {
        console.log("Clicked on ", this.id, i);

        // promote piece
        testMove.promotion = i;
        showBlocks();

        // graphically promote piece
        let pieceElem = document.getElementsByClassName("isPromoting")[0];
        pieceElem.classList.remove("isPromoting", "grMove");
        pieceElem.style.backgroundPositionX = pieceToBackground[i];

        hidePromotion();
    });
}

// currently does not handle a flipped board, but still works. eh.
function showPromotion(file){
    gameElem.style.filter = "blur(2px)";

    // to-do: relying on gamestate allowing is not great.
    let flipPromoting = (isDisplayFlipped && curBoardDisplay.turn == Piece.white) || (!isDisplayFlipped && curBoardDisplay.turn == Piece.black);
    promoting.style.transform = `translate(${(isDisplayFlipped? 7 - file: file)*100}%, ${flipPromoting? "100%": "0%"})`;
    promoting.style.display = "flex";

    if (flipPromoting)
        promoting.classList.add("flipped");
    else
        promoting.classList.remove("flipped");

    if (curBoardDisplay.turn == Piece.white)
        promoting.classList.remove("black");
    else
        promoting.classList.add("black");
}

function hidePromotion(){
    gameElem.style.filter = "";
    promoting.style.display = "none";
}
