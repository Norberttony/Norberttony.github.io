let madeMoves = [];
let testMove;
let legalBlocks = [];

let curBoardDisplay;
let lastMoveDisplay;
let isDisplayFlipped = false;
let isPlaying = -1; // color that player is playing. but yup, it's in graphics.js. not in peer.js. why would it be? why would my code make sense?!

// make pieces draggable
let currentMoves;
let selected;
let dragging;
let isTouchEvent = false;

let blocking_undoElem = document.getElementById("blocking_undo");

function setDraggingElemPos(pageX, pageY){
    if (!dragging) return;
    draggingElem.style.left = `calc(${pageX}px - var(--piece-width)/2)`;
    draggingElem.style.top = `calc(${pageY}px - var(--piece-height)/2)`;
}

document.addEventListener("mousemove", function(event){
    if (dragging) event.preventDefault();
    setDraggingElemPos(event.pageX, event.pageY);
});

document.addEventListener("touchmove", function(event){
    if (dragging) event.preventDefault();
    setDraggingElemPos(event.touches[0].pageX, event.touches[0].pageY);
    isTouchEvent = true;
}, {passive: false});

function hideBlocks(){
    blocking_undoElem.style.visibility = "hidden";

    // hide all legal block elements to then show the actual legal ones
    let legalBlockElems = document.getElementsByClassName("legalblock");
    while (legalBlockElems.length > 0){
        legalBlockElems[0].classList.remove("legalblock");
    }

    // remove information from previous player's turn
    let blockingElems = document.getElementsByClassName("blocking");
    while (blockingElems.length > 0){
        blockingElems[0].classList.remove("blocking");
    }
}

function showBlocks(){
    let legalBlocks = gameState.generateBlocks(testMove);
    hideBlocks();

    blocking_undoElem.style.visibility = "visible";

    blocking.classList.remove(gameState.turn == Piece.white ? "white": "black");
    blocking.classList.add(gameState.turn == Piece.white ? "black": "white");

    // show actual legal block elements
    blocking.style.visibility = "visible";
    for (let i = 0; i < legalBlocks.length; i++){
        document.getElementById(`block${legalBlocks[i]}`).classList.add("legalblock");
    }
}

function draggingMouseUp(event){
    if (dragging){
        dragging.classList.remove("dragged");
        draggingElem.style.display = "none";
    }
    
    let highlight = event.target;
    if (isTouchEvent) highlight = document.elementsFromPoint(event.pageX, event.pageY)[0];
    console.log("hey highlight", highlight);
    isTouchEvent = false;

    // player let go at a highlight, indicating they're moving the piece there.
    if (highlight.classList.contains("highlight")){
        testMove = currentMoves[parseInt(highlight.id.replace("highlight_", ""))];

        // wait, this piece is promoting. let's ask for more user input
        if (testMove.promotion){
            // let's graphically move the piece and show promotion
            let pieceElem = document.getElementById(`${testMove.from % 8}_${Math.floor(testMove.from/8)}`);
            setElemLocation(pieceElem, testMove.to % 8, Math.floor(testMove.to/8));
            pieceElem.classList.add("isPromoting", "grMove");
            showPromotion(testMove.to % 8);
        }else{
            // create new graphical state to make the test move on it.
            let graphicalState = new Board();
            graphicalState.loadFENB(gameState.getFENB());
            graphicalState.makeMove(testMove);
            displayBoard(graphicalState);

            // not promoting? just show blocks to confirm the move
            showBlocks();
        }
        // clear all moves from board
        setAllHighlightsToPool();
    }

    if (!dragging){
        // clear all moves from board
        setAllHighlightsToPool();
    }else{
        dragging = undefined;
    }
}

document.addEventListener("mouseup", draggingMouseUp);
//document.addEventListener("touchend", draggingMouseUp);

// sets the background image of every tile to match that of the board.
function displayBoard(board = gameState, lastMove = madeMoves[madeMoves.length -1], flipped = isDisplayFlipped, container = gameElem){
    curBoardDisplay = board;
    isDisplayFlipped = flipped;
    lastMoveDisplay = lastMove; // terrible variable.

    setAllPiecesToPool(container);
    setAllHighlightsToPool(container);
    setAllSquareHighlightsToPool(container);

    // highlight move from and move to
    if (lastMove){
        getSquareHighlightFromPool(lastMove.to % 8, Math.floor(lastMove.to/8));
        getSquareHighlightFromPool(lastMove.from % 8, Math.floor(lastMove.from/8));
    }

    // display all pieces on the board
    for (let r = 0; r < 8; r++){
        for (let f = 0; f < 8; f++){
            let v = board.squares[r * 8 + f];
            if (v != 0){
                let piece = getPieceFromPool(f, r);
                piece.style.backgroundPosition = `${pieceToBackground[Piece.getType(v)]} ${colorToBackground[Piece.getColor(v)/8]}`;
                container.appendChild(piece);
            }
        }
    }

    // to-do: make this a function or something
    // show blocked piece
    hideBlocks();
    let block = Piece.getType(board.blocked);
    let turn = board.turn;
    if (block){
        let value = Piece.getType(block);
        document.getElementById(`block${value}`).classList.add("blocking");

        if (turn == Piece.white){
            blocking.classList.remove("black");
            blocking.classList.add("white");
        }else{
            blocking.classList.remove("white");
            blocking.classList.add("black");
        }
    }else{
        blocking.classList.remove("black");
        blocking.classList.add("white");
    }

    // hide promotion...
    hidePromotion();
}

displayBoard(gameState);

function setFENB(){
    let fenB = fenText.value;
    gameState.loadFENB(fenB);
    PGNViewerObj.loadFENB(fenB);
    displayBoard();
}

function setPGN(){
    let pgn = pgnText.value;
    PGNViewerObj.clear();
    madeMoves = [];
    gameState.loadPGN(pgn);
    displayBoard();
}

function undoTestMove(){
    if (testMove){
        testMove = undefined;
        hideBlocks();
        displayBoard(gameState);
    }
}

// flips the board
function flipBoard(){
    document.getElementById("container").classList.toggle("flipped");
    displayBoard(curBoardDisplay, lastMoveDisplay, !isDisplayFlipped);
}

function setFlip(flip){
    if (flip){
        document.getElementById("container").classList.add("flipped");
        displayBoard(curBoardDisplay, lastMoveDisplay, true);
    }else{
        document.getElementById("container").classList.remove("flipped");
        displayBoard(curBoardDisplay, lastMoveDisplay, false);
    }
}

function pieceMousedown(event){
    setAllHighlightsToPool();

    let coords = this.id.split("_");
    let square = parseInt(coords[0]) + parseInt(coords[1] * 8);

    // piece is promoting??
    if (this.classList.contains("isPromoting")){
        return;
    }

    // before generating moves for this piece, check these conditions...
    if (curBoardDisplay != gameState || testMove || !Piece.ofColor(gameState.squares[square], gameState.turn) || (isPlaying != -1 && !Piece.ofColor(isPlaying == 0 ? Piece.black: Piece.white, gameState.turn)) || gameState.result) return;

    dragging = this;
    selected = this;
    this.classList.add("dragged");
    // copy over graphics
    draggingElem.style.backgroundPosition = dragging.style.backgroundPosition;
    draggingElem.style.display = "block";

    let pageX = event.touches? event.touches[0].pageX: event.pageX;
    let pageY = event.touches? event.touches[0].pageY: event.pageY;

    draggingElem.style.left = `calc(${pageX}px - var(--piece-width)/2)`;
    draggingElem.style.top = `calc(${pageY}px - var(--piece-height)/2)`;

    // get moves
    currentMoves = gameState.generatePieceMoves(square, gameState.squares[square]);
    
    // display moves
    for (let i = 0; i < currentMoves.length; i++){
        let move = currentMoves[i];
        
        let highlight = getHighlightFromPool(move.to % 8, Math.floor(move.to/8));
        highlight.id = `highlight_${i}`;

        // if move is a capture, update highlight graphically to indicate that
        if (move.captured)
            highlight.classList.add("capture");

        gameElem.appendChild(highlight);
    }
}

// prevent focusing on buttons
let buttons = document.getElementsByTagName("button");
for (let i = 0; i < buttons.length; i++){
    buttons[i].onmousedown = (event) => {
        event.preventDefault();
    }
}
