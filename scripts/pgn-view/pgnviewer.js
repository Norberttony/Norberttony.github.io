// handles controlling PGN viewer logic

let pgnElem = document.getElementById("pgn");
window.PGNState = new Board();

let pgnText = document.getElementById("pgnText");
let fenText = document.getElementById("fenText");

function selectPGNElem(elem){
    (document.getElementsByClassName("pgn_selected")[0] || elem || document.body).classList.remove("pgn_selected");
    if (elem){
        elem.classList.add("pgn_selected");
        
        // scrolls to selected pgn
        let b1 = pgnElem.getBoundingClientRect();
        let b2 = elem.getBoundingClientRect();

        pgnElem.scrollBy(0, b2.top - b1.top);
    }
}

class PGNViewer extends Observer {
    constructor(){
        super();
        this.initPGNDetails();
    }
    // (re)initializes the PGN details
    initPGNDetails(){
        // sets proper FEN
        this.loadFENB(StartingFENB, false);

        // variable initialization
        this.madeMoves = [];
        this.elems = [];
        pgnElem.innerHTML = "";

        this.moveIndex = -1;

        this.san = "";

        // additional PGN details
        this.event = "Bess Analysis";
        this.site = window.location.href;
        this.round = "-";
        this.timeControl = "-";
        this.result = "*";

        // for "From Position" loading
        this.variant = "Standard";
        delete this.FENB;
    }
    // resets to standard variant
    clear(){
        this.setMove(-1);
        this.initPGNDetails();
        this.updateGraphicalText();
    }
    loadFENB(fenb, clear = true){
        if (clear) this.clear();

        PGNState.loadFENB(fenb);
        this.variant = "From Position";
        this.FENB = fenb;
        this.san = "";

        this.updateGraphicalText();
    }
    loadPGN(pgn){
        this.clear();
        madeMoves = [];
    }
    // activates a given PGN
    setActivePGN(index){
        this.setMove(index);
    }
    onFullMoveInc(fullMove){
        if (isNaN(fullMove))
            this.san += " - ";
        else
            this.san += `${fullMove}. `;

        // update element version too
        let counter = document.createElement("div");
        counter.innerText = `${fullMove}.`;
        counter.classList.add("pgn_counter");
        pgnElem.appendChild(counter);
    }
    onMove(move, fullMove, turn){
        let l = this.madeMoves.length;
        this.madeMoves.push(move);
        let movePGN = move.pgn;

        if (isNaN(fullMove)) fullMove = 2;

        if (this.san.length == 0 && turn == Piece.black){
            this.san += `${fullMove -1}. `;
            let counter = document.createElement("div");
            counter.innerText = `${fullMove -1}.`;
            counter.classList.add("pgn_counter");
            pgnElem.appendChild(counter);

            let pgn = document.createElement("div");
            pgn.innerText = "...";
            pgn.classList.add("pgn_san");
            pgnElem.appendChild(pgn);
        }

        this.san += movePGN +" ";
        this.updateGraphicalText();
        
        let pgn = document.createElement("div");
        pgn.innerText = movePGN;
        pgn.classList.add("pgn_san");
        pgnElem.appendChild(pgn);

        this.elems.push(pgn);

        let that = this;
        pgn.addEventListener("click", function(){
            that.setActivePGN(l);
        });

        // if we are up-to-date on the moves, keep it that way
        if (l == this.moveIndex +1){
            this.setActivePGN(l, pgn);
        }
    }
    updateGraphicalText(){
        pgnText.value = this.PGN;
        fenText.value = PGNState.getFENB();
    }
    // sets state to move index
    setMove(index){
        undoTestMove();

        // clamp index
        if (index > this.madeMoves.length -1){
            index = this.madeMoves.length -1;
        }else if (index < -1){
            index = -1;
        }

        let diff = index - this.moveIndex; // end - start
        if (diff > 0){
            for (let i = this.moveIndex +1; i <= index; i++){
                PGNState.makeMove(this.madeMoves[i]);
            }
        }else if (diff < 0){
            for (let i = this.moveIndex; i > index; i--){
                PGNState.unmakeMove(this.madeMoves[i]);
            }
        }
        this.moveIndex = index;
        selectPGNElem(this.elems[index]);
        if (index < this.madeMoves.length -1) displayBoard(PGNState, index == -1? false: this.madeMoves[index], isDisplayFlipped);
        else displayBoard(gameState);

        this.updateGraphicalText();
    }
    onResult(result, turn){
        console.log("got result", result, turn);
        if (result == "#"){
            if (turn == Piece.white){
                this.result = "1-0";
            }else{
                this.result = "0-1";
            }
        }else if (result == "/"){
            this.result = "1/2-1/2";
        }else{
            return;
        }
        this.san += this.result;
        this.updateGraphicalText();
    }
    get PGNHeaders(){
        let headers = 
`[Event "${this.event}"]
[Site "${this.site}"]
[Round "${this.round}"]
[TimeControl "${this.timeControl}"]
[Result "${this.result}"]
[Variant "${this.variant}"]
`;
        if (this.FENB) headers += `[FENB "${this.FENB}"]\n`;
        return headers;
    }
    get PGN(){
        let pgn =  
`${this.PGNHeaders}
${this.san}`;
        return pgn;
    }
}

window.PGNViewerObj = new PGNViewer();
PGNViewerObj.updateGraphicalText();
gameState.addObserver(PGNViewerObj);

function PGNMoveBack(){
    PGNViewerObj.setMove(PGNViewerObj.moveIndex -1);
}

function PGNMoveForward(){
    PGNViewerObj.setMove(PGNViewerObj.moveIndex +1);
}

function PGNMoveFirst(){
    PGNViewerObj.setMove(-1);
}

function PGNMoveLast(){
    PGNViewerObj.setMove(PGNViewerObj.madeMoves.length -1);
}

// key binds for scrolling through moves
document.body.addEventListener("keydown", function(event){
    if (event.target == document.body){
        switch(event.key.toLowerCase()){
            case "arrowleft":
                PGNMoveBack();
                break;
            case "arrowright":
                PGNMoveForward();
                break;
            case "arrowup":
                PGNMoveFirst();
                break;
            case "arrowdown":
                PGNMoveLast();
                break;

            case "f":
                flipBoard();
                break;

            // if no bound key was hit, do not prevent event default.
            default:
                return;
        }
        event.preventDefault();
    }
});
