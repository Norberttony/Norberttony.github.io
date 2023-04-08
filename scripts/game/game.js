// contains all of the game logic

// this code REPEATEDLY violates the DRY principle. read at your own risk.

// removes all glyphs from SAN
function removeGlyphs(san){
    san = san.replace('#', '');
    return san;
}

const StartingFENB = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1 -";

class Move {
    constructor(to, from, block, capturedPiece = 0, castleSide = false, castleK = false, castleQ = false, isPromoting = false, isEnPassant = false){
        this.to = to;
        this.from = from;
        this.captured = capturedPiece;
        this.block = block;
        // only set by game state so that undo-ing moves works...
        this.wasBlocked = Piece.none;

        this.castleSide = castleSide;
        this.castleK = castleK;
        this.castleQ = castleQ;

        this.promotion = isPromoting;
        this.isEnPassant = isEnPassant;

        // set by Board when move is made
        this.pgn = "";
    }
    isEqual(other){
        return this.from == other.from && this.to == other.to;
    }
}

// The Board object contains a game state of the board. Certain moves can be done or undone, but
// they are not stored.
class Board {
    constructor(){
        this.squares = new Uint8Array(64);

        this.result;

        this.turn = Piece.white;

        // positions of kings
        this.whiteKing = -1;
        this.blackKing = -1;

        // castling availability
        this.wQ = false;
        this.wK = false;
        this.bQ = false;
        this.bK = false;

        this.enTarget = -1;

        this.halfmove = 0;
        this.fullmove = 1;

        this.blocked = Piece.none | Piece.none;

        // observers are capable of receiving notification of any events...
        this.eventObservers = [];

        this.testMove = 0;
        this.madeMove = false;

        this.loadFENB(StartingFENB);

        // keeps track of current positions to search for three fold repetition.
        this.positions = {};
    }
    getPosition(){
        let fenb = this.getFENB();
        return fenb.substring(0, fenb.indexOf(" "));
    }
    // ==== OBSERVER LOGIC ==== //
    addObserver(o){
        this.eventObservers.push(o);
    }
    removeObserver(o){
        this.eventObservers.splice(eventObservers.indexOf(o), 1);
    }
    // ==== END OBSERVER LOGIC ==== //
    // ==== GENERATING AND CHECKING MOVES ==== //
    // checks if the current player is checkmated... or stalemated...
    isGameOver(){
        let moves = this.generateMoves();

        // fifty move rule
        if (this.halfmove == 100) this.result = '/';

        // three-fold
        if (this.positions[this.getPosition()] >= 3) this.result = '/';
        
        // yup. this code is not broken. ha ha.
        this.nextTurn();

        // no legal moves?!
        if (moves.length == 0){
            let prevBlock = this.blocked;
            this.blocked = Piece.none;
            if (this.isDoubleAttacked(this.getKingSq())){
                // CHECKMATE!!!
                this.result = '#';
            }else{
                // stalemate...!
                this.result = '/';
            }
            this.blocked = prevBlock;
        }

        // nothing to see here...!
        this.nextTurn();

        return this.result;
    }
    // checks if a piece type is on the board
    isPieceTypeOnBoard(piece){
        for (let s = 0; s < 64; s++){
            if (this.squares[s] == piece)
                return true;
        }
        return false;
    }
    // gets all legal blocks from this position (given player's move)
    generateBlocks(move){
        
        // if this was the first move, white cannot block the piece that they blocked
        let firstMoveBlock = Piece.none;
        if (this.fullmove == 1 && Piece.ofColor(this.turn, Piece.white)){
            firstMoveBlock = Piece.getType(this.squares[move.from]);
        }

        this.makeMove(move);

        let blocks = [];

        // actually consider castling through check (by blocking attacking piece)
        let castleAttack = 0;
        if (move.castleSide == 'k'){
            castleAttack = this.getAttackingPiece(move.to) || this.getAttackingPiece(move.to -1) || this.getAttackingPiece(move.to -2);
        }else if (move.castleSide == 'q'){
            castleAttack = this.getAttackingPiece(move.to) || this.getAttackingPiece(move.to +1) || this.getAttackingPiece(move.to +2);
        }

        if (castleAttack){
            blocks.push(Piece.getType(castleAttack));
        }else{

            // go through every piece type and try to block it
            for (let i = 1; i <= 6; i++){
                if (this.isBlockLegal(i)){
                    blocks.push(i);
                }
            }
        }

        this.unmakeMove(move);

        let index = blocks.indexOf(firstMoveBlock);
        if (index > -1){
            blocks.splice(index, 1);
        }

        return blocks;
    }
    // detects which piece this is, and generates moves for it. Generally used for graphical side of app.
    generatePieceMoves(start, piece){
        if (Piece.ofType(this.blocked, piece) || this.madeMove) return [];

        let moves = [];

        if (Piece.ofColor(piece, this.turn)){
            switch(Piece.getType(piece)){
                case Piece.bishop:
                case Piece.rook:
                case Piece.queen:
                    this.generateSlidingMoves(start, piece, moves);
                    break;
                case Piece.knight:
                    this.generateKnightMoves(start, piece, moves);
                    break;
                case Piece.king:
                    this.generateKingMoves(start, piece, moves);
                    break;
                case Piece.pawn:
                    this.generatePawnMoves(start, piece, moves);
                    break;
            }
        }

        return this.filterLegalMoves(moves);
    }
    // generates all possible moves for the given turn
    generateMoves(filter = true){
        let moves = [];

        for (let s = 0; s < 64; s++){
            let piece = this.squares[s];
            if (Piece.ofColor(piece, this.turn) && !Piece.ofType(piece, this.blocked)){
                if (Piece.isSliding(piece)){
                    this.generateSlidingMoves(s, piece, moves);
                }else if (Piece.ofType(piece, Piece.king)){
                    this.generateKingMoves(s, piece, moves, filter);
                }else if (Piece.ofType(piece, Piece.knight)){
                    this.generateKnightMoves(s, piece, moves);
                }else if (Piece.ofType(piece, Piece.pawn)){
                    this.generatePawnMoves(s, piece, moves);
                }
            }
        }

        if (filter) moves = this.filterLegalMoves(moves);

        return moves;
    }
    // generates moves for a sliding piece
    generateSlidingMoves(start, piece, moves){
        let dirStart = Piece.ofType(piece, Piece.bishop) ? 4 : 0;
        let dirEnd = Piece.ofType(piece, Piece.rook) ? 4 : 8;

        for (let i = dirStart; i < dirEnd; i++){
            for (let j = 0; j < numSquaresToEdge[start][i]; j++){
                let target = start + dirOffsets[i] * (j + 1);
                let targetValue = this.squares[target];

                // piece of same color, cannot move further
                if (Piece.ofColor(targetValue, piece))
                    break;
                    
                moves.push(new Move(target, start, this.testBlock, targetValue));

                // cannot move past enemy piece.
                // this statement is an assumption: if not friendly and not empty, then ENEMY!!!
                if (targetValue != 0)
                    break;
            }
        }
    }
    // generates moves for a king
    generateKingMoves(start, piece, moves, checkCastle = true){
        let toEdge = numSquaresToEdge[start];

        // check all directions
        for (let i = 0; i < dirOffsets.length; i++){
            if (toEdge[i] > 0){
                let target = start + dirOffsets[i];
                let targetValue = this.squares[target];

                if (Piece.ofColor(piece, targetValue))
                    continue;

                moves.push(new Move(target, start, this.testBlock, targetValue));
            }
        }

        // check for castling, only if rook is not blocked as well
        if (checkCastle && !Piece.ofType(this.blocked, Piece.rook)){
            let k;
            let q;
            if (Piece.ofColor(piece, Piece.white)){
                k = this.wK;
                q = this.wQ;
            }else if (Piece.ofColor(piece, Piece.black)){
                k = this.bK;
                q = this.bQ;
            }

            // kingside
            if (k){
                this.nextTurn();
                // set block for a moment
                let temp = this.blocked;
                this.blocked = this.testBlock;

                let isAttackedK = this.isSetDoubleAttacked([start, start + dirOffsets[1], start + dirOffsets[1] * 2]);
                let isOccupied = this.squares[start + dirOffsets[1]] || this.squares[start + dirOffsets[1] * 2];
                this.nextTurn();
                
                this.blocked = temp;

                if (!isAttackedK && !isOccupied){
                    moves.push(new Move(start + dirOffsets[1] * 2, start, this.testBlock, 0, 'k', k, q));
                }
            }

            // queenside
            if (q){
                this.nextTurn();
                // set block for a moment
                let temp = this.blocked;
                this.blocked = this.testBlock;

                let isAttackedQ = this.isSetDoubleAttacked([start, start + dirOffsets[3], start + dirOffsets[3] * 2]);
                let isOccupied = this.squares[start + dirOffsets[3]] || this.squares[start + dirOffsets[3] * 2];
                this.nextTurn();

                this.blocked = temp;

                if (!isAttackedQ && !isOccupied){
                    moves.push(new Move(start + dirOffsets[3] * 2, start, this.testBlock, 0, 'q', k, q));
                }
            }
        }
    }
    // generates moves for a pawn
    generatePawnMoves(start, piece, moves){
        let pawnMoves = [];

        let moveDir = Piece.ofColor(piece, Piece.white) ? 8: -8;
        let r = this.getRankOfSq(start);
        let canDoubleMove = Piece.ofColor(piece, Piece.white) ? r == 1: r == 6;

        // check if pawn is promoting
        let isPromoting = Piece.ofColor(piece, Piece.white) ? r == 6: r == 1;

        // handle movement
        if (!this.squares[start + moveDir]){
            pawnMoves.push(new Move(start + moveDir, start, '-', 0, false, false, false, isPromoting));

            if (canDoubleMove && !this.squares[start + moveDir * 2]){
                pawnMoves.push(new Move(start + moveDir * 2, start, '-'));
            }
        }

        // handle capturing
        let targetV1 = this.squares[start + moveDir -1];
        if (!Piece.ofColor(piece, targetV1) && targetV1 && getFileFromSq(start) != 0){
            pawnMoves.push(new Move(start + moveDir -1, start, '-', targetV1, false, false, false, isPromoting));
        }
        let targetV2 = this.squares[start + moveDir +1];
        if (!Piece.ofColor(piece, targetV2) && targetV2 && getFileFromSq(start) != 7){
            pawnMoves.push(new Move(start + moveDir +1, start, '-', targetV2, false, false, false, isPromoting));
        }

        // handle en passant
        if (this.enTarget != -1){
            // can en passant?!
            let atFile = getFileFromSq(this.enTarget);
            if (Math.abs(start + moveDir - this.enTarget) == 1 && Math.abs(atFile - getFileFromSq(start)) == 1){
                pawnMoves.push(new Move(this.enTarget, start, '-', 0, false, false, false, false, true));
            }
        }

        // if pawn is promoting, dupe all moves for every promotion possibility
        for (let i = 0; i < pawnMoves.length; i++){
            let move = pawnMoves[i];
            if (move.promotion){
                for (let j = 2; j <= 5; j++){
                    let m = new Move(move.to, move.from, move.block, move.captured, move.castleSide, move.castleK, move.castleQ, j);
                    moves.push(m);
                }
            }else{
                moves.push(move);
            }
        }
    }
    // generates moves for a knight
    generateKnightMoves(start, piece, moves){
        for (let i = 0; i < knightOffsets.length; i++){
            let targetSq = start + knightOffsets[i];
            let targetValue = this.squares[targetSq];

            if (!Piece.ofColor(targetValue, piece)){

                // get rank and file increases
                let rankInc = easyKnightOffsets[i][0];
                let fileInc = easyKnightOffsets[i][1];

                // get number of squares to edge based on move's direction
                let ranksToEdge = rankInc > 0 ? numSquaresToEdge[start][0] : numSquaresToEdge[start][2];
                let filesToEdge = fileInc > 0 ? numSquaresToEdge[start][1] : numSquaresToEdge[start][3];

                // if does not exceed edge, move is possible
                if (Math.abs(rankInc) <= ranksToEdge && Math.abs(fileInc) <= filesToEdge){
                    moves.push(new Move(targetSq, start, this.testBlock, targetValue));
                }
                
            }
        }
    }
    // takes in a list of moves, and gives a list of all legal moves
    filterLegalMoves(moves){
        for (let i = 0; i < moves.length; i++){
            if (!this.isMoveLegal(moves[i])){
                moves.splice(i, 1);
                i--;
            }
        }
        return moves;
    }
    // retrieves the current player's king's square
    getKingSq(){
        return this.turn == Piece.black ? this.whiteKing: this.blackKing;
    }
    // actually retrieves the current player's king's square
    getCurKingSq(){
        return this.turn == Piece.white ? this.whiteKing: this.blackKing;
    }
    // checks if a move is legal
    isMoveLegal(move){
        this.makeMove(move);

        let kingSq = this.getKingSq();
        let attacksKing = this.isDoubleAttacked(kingSq);

        this.unmakeMove(move);

        return !attacksKing;
    }
    // checks if a block is legal
    isBlockLegal(block){
        let temp = this.blocked;
        this.blocked = block;

        let kingSq = this.getKingSq();
        let attacksKing = this.isAttacked(kingSq);

        this.blocked = temp;

        return !attacksKing && this.isPieceTypeOnBoard(this.turn | block);
    }
    // rather redundant code from isAttacked, but this also returns the piece that is attacking the given square.
    getAttackingPiece(sq){
        
        // go through every move
        let test = this.generateMoves(false);
        for (let i = 0; i < test.length; i++){
            if (test[i].to == sq)
                return this.squares[test[i].from];
        }

        return 0;
    }
    // checks if a certain square be attacked
    isAttacked(sq){

        // go through every move
        let test = this.generateMoves(false);
        for (let i = 0; i < test.length; i++){
            if (test[i].to == sq)
                return true;
        }

        return false;
    }
    // returns true there are at least two piece-type attacks on given squares
    isSetDoubleAttacked(squares){
        // go through every move
        let test = this.generateMoves(false);
        let attackingPiece = 0;
        for (let i = 0; i < test.length; i++){
            // check if this move attacks any squares in the set
            let isSq = false;
            for (let j = 0; j < squares.length; j++){
                if (test[i].to == squares[j]){
                    isSq = true;
                    break;
                }
            }

            // check if this is now a double attack
            if (isSq){
                if (attackingPiece == 0){
                    attackingPiece = this.squares[test[i].from];
                }else if (!Piece.ofType(attackingPiece, this.squares[test[i].from])){
                    return true;
                }
            }
        }

        return false;
    }
    // checks if a certain square is attacked at least twice by pieces of two different types
    isDoubleAttacked(sq){

        // go through every move
        let test = this.generateMoves(false);
        let attackingPiece = 0;
        for (let i = 0; i < test.length; i++){
            if (test[i].to == sq){
                if (attackingPiece == 0){
                    attackingPiece = this.squares[test[i].from];
                }else if (!Piece.ofType(attackingPiece, this.squares[test[i].from])){
                    return true;
                }
            }
        }

        return false;
    }
    // performs a move on the board
    makeMove(move){
        // remember castling
        if (Piece.ofColor(this.turn, Piece.white)){
            // remember white castling rights
            move.castleK = this.wK;
            move.castleQ = this.wQ;
        }else{
            // remember black castling rights
            move.castleK = this.bK;
            move.castleQ = this.bQ;
        }

        // if the move is in terms of a king, let's change the king square... and disallow castling...
        let v = this.squares[move.from];
        if (Piece.ofType(v, Piece.king)){
            if (Piece.ofColor(v, Piece.white)){
                this.whiteKing = move.to;
                this.wK = false;
                this.wQ = false;
            }else{
                this.blackKing = move.to;
                this.bK = false;
                this.bQ = false;
            }

            // handle if king is castling
            if (move.castleSide == 'k'){
                // move the rook over
                this.squares[move.to -1] = this.squares[move.to +1];
                this.squares[move.to +1] = 0;
            }else if (move.castleSide == 'q'){
                // move the rook over
                this.squares[move.to +1] = this.squares[move.to -2];
                this.squares[move.to -2] = 0;
            }
        }

        this.squares[move.to] = this.squares[move.from];
        this.squares[move.from] = 0;
        
        // fullmove
        if (Piece.ofColor(this.turn, Piece.black)){
            if (this.fullmove != '-') this.fullmove++;
        }

        // halfmove
        move.prevHalfMove = this.halfmove;
        this.halfmove++;
        if (Piece.ofType(this.squares[move.to], Piece.pawn) || move.capturedPiece){
            this.halfmove = 0;
        }

        // set turn
        this.nextTurn();

        // to-do:
        // castling
        if (move.to == 56 || move.from == 56)
            this.bQ = false;
        else if (move.to == 63 || move.from == 63){
            this.bK = false;
        }
        if (move.to == 0 || move.from == 0)
            this.wQ = false;
        else if (move.to == 7 || move.from == 7){
            this.wK = false;
        }

        // en passant
        let isPawnCapturing = false;
        if (move.isEnPassant){
            let moveDir = Piece.ofColor(this.turn, Piece.white) ? 8: -8;
            this.squares[this.enTarget + moveDir] = 0;
            isPawnCapturing = true;
        }

        // stores enTarget into move, then removes it from state.
        if (this.enTarget != -1){
            move.delEnTarget = this.enTarget;
            this.enTarget = -1;
        }

        // checks for double move
        let diff = move.from - move.to;
        if (Math.abs(diff) == 16 && Piece.ofType(this.squares[move.to], Piece.pawn)){
            this.enTarget = move.to + diff/2;
        }

        // set blocked
        move.wasBlocked = this.blocked;
        this.blocked = move.block;

        // promotion
        if (move.promotion){
            this.squares[move.to] = Piece.setType(this.squares[move.to], move.promotion);
        }
    }
    getMoveSAN(move){
        let SAN;

        let moveList = this.generateMoves();

        /* collects information on move collision ambiguity */
        let sameMove = false;
        let sameFile = false;
        let sameRank = false;
        if (!Piece.ofType(this.squares[move.from], Piece.pawn)){
            for (let i = 0; i < moveList.length; i++){
                let other = moveList[i];
                if (!(move.from == other.from) && move.to == other.to && Piece.ofType(this.squares[move.from], this.squares[other.from])){
                    // oh no, the move is ambiguous!
                    sameMove = true;

                    // do we need to specify the rank (first & foremost?)
                    if (squareToAlgebraicRank(move.from) == squareToAlgebraicRank(other.from))
                        sameRank = true;
                    
                    // what about the file
                    if (squareToAlgebraicFile(move.from) == squareToAlgebraicFile(other.from))
                        sameFile = true;
                }
            }
        }

        let movingPieceType = Piece.getType(this.squares[move.from]);

        // using information from move collision ambiguity, determine the resolving square
        let resolvedSquare = "";
        if (sameMove){
            if (sameRank || (!sameRank && !sameFile))
                resolvedSquare += squareToAlgebraicFile(move.from);
            if (sameFile)
                resolvedSquare += squareToAlgebraicRank(move.from);
        }
        if (Piece.ofType(this.squares[move.from], Piece.pawn) && this.squares[move.to]){
            resolvedSquare = squareToAlgebraicFile(move.from);
        }

        if (move.castleSide){
            if (move.castleSide == 'k'){
                SAN = "O-O";
            }else{
                SAN = "O-O-O";
            }
        }else{
            SAN = `${PieceASCII[movingPieceType]}${resolvedSquare}${this.squares[move.to] || move.isEnPassant ? 'x': ''}${squareToAlgebraic(move.to)}`;
        }

        this.makeMove(move);

        // handle additional pgn
        if (move.isEnPassant || (move.capturedPiece && Piece.ofType(this.squares[move.to], Piece.pawn))){
            let f = squareToAlgebraicFile(move.from);
            SAN = f + SAN;
        }

        if (move.promotion){
            SAN = `${SAN}=${PieceASCII[move.promotion]}`;
        }

        let blockASCII = PieceASCII[move.block];
        if (Piece.ofType(move.block, Piece.pawn)) blockASCII = 'p';
        if (Piece.ofColor(this.turn, Piece.white)) blockASCII = blockASCII.toUpperCase();
        else blockASCII = blockASCII.toLowerCase();

        SAN = `${SAN}${blockASCII}`;

        // is game over?
        let result = this.isGameOver();
        if (result == '#'){
            SAN += result;
        }

        this.unmakeMove(move);

        return SAN;
    }
    // makes the move if the player chose to do so.
    graphicsMakeMove(move){
        
        move.pgn = this.getMoveSAN(move);

        if (Piece.ofColor(this.turn, Piece.white)){
            for (let i = 0; i < this.eventObservers.length; i++){
                this.eventObservers[i].onFullMoveInc(this.fullmove);
            }
        }

        this.makeMove(move);

        let p = this.getPosition();
        if (!this.positions[p]) this.positions[p] = 0;
        this.positions[p]++;

        let result = this.isGameOver();

        // notify observers that a move was made
        for (let i = 0; i < this.eventObservers.length; i++){
            this.eventObservers[i].onMove(move, this.fullmove, this.turn);
        }

        // notify observers if result
        if (result){
            for (let i = 0; i < this.eventObservers.length; i++){
                this.eventObservers[i].onResult(result, Piece.ofColor(this.turn, Piece.white) ? Piece.black: Piece.white);
            }
        }

        // notify observers that any state changes can now be made.
        for (let i = 0; i < this.eventObservers.length; i++){
            this.eventObservers[i].onFinish(move);
        }
    }
    // un-does a move on the board (make sure this was the last move made)
    unmakeMove(move){
        // if the move is in terms of a king, let's change the king square...
        let v = this.squares[move.to];
        if (Piece.ofType(v, Piece.king)){
            Piece.ofColor(v, Piece.white) ? this.whiteKing = move.from: this.blackKing = move.from;

            // handle if king is uncastling
            if (move.castleSide == 'k'){
                // move the rook back over
                this.squares[move.to +1] = this.squares[move.to -1];
                this.squares[move.to -1] = 0;

                Piece.ofColor(v, Piece.white) ? (this.wK = true) : (this.bK = true);
            }else if (move.castleSide == 'q'){
                // move the rook back over
                this.squares[move.to -2] = this.squares[move.to +1];
                this.squares[move.to +1] = 0;

                Piece.ofColor(v, Piece.white) ? (this.wQ = true) : (this.bQ = true);
            }
        }
        if (Piece.ofColor(v, Piece.white)){
            this.wK = move.castleK;
            this.wQ = move.castleQ;
        }else{
            this.bK = move.castleK;
            this.bQ = move.castleQ;
        }

        this.squares[move.from] = this.squares[move.to];
        this.squares[move.to] = move.captured;

        // set turn
        this.nextTurn();

        // fullmove
        if (Piece.ofColor(this.turn, Piece.black)){
            this.fullmove--;
        }

        // halfmove
        this.halfmove = move.prevHalfMove;

        // en passant
        // bring back enTarget that might have been stored in move
        if (move.delEnTarget != -1){
            this.enTarget = move.delEnTarget;
        }

        if (move.isEnPassant){
            let moveDir = Piece.ofColor(this.turn, Piece.white) ? 8: -8;
            this.squares[this.enTarget - moveDir] = Piece.ofColor(this.turn, Piece.white) ? Piece.black | Piece.pawn: Piece.white | Piece.pawn;
        }

        // set blocked
        this.blocked = move.wasBlocked;
        move.wasBlocked = -1;

        // promotion
        if (move.promotion)
            this.squares[move.from] = Piece.setType(this.squares[move.from], Piece.pawn);

        // removes any stored result
        delete this.result;
    }
    // ==== END MOVE GENERATION AND CHECKING ==== //

    // ==== STATE UPDATES ==== //
    // plays SAN on the board
    playSAN(san){
        if (!san) return;
        
        let blocked = san[removeGlyphs(san).length -1];

        let moves = this.generateMoves(true);

        for (let m = 0; m < moves.length; m++){
            moves[m].block = Piece.getType(FENToPiece[blocked]);
            let SAN = this.getMoveSAN(moves[m]);
            if (SAN == san){
                this.graphicsMakeMove(moves[m]);
                return true;
            }
        }

        return false;
    }
    // returns rank (0 - 7) of given square
    getRankOfSq(sq){
        return Math.floor(sq/8);
    }
    nextTurn(){
        this.turn = this.turn == Piece.white ? Piece.black : Piece.white;
    }
    // loads a FEN-B into this board state
    loadFENB(fenb){
        // clear board first
        this.squares = new Uint8Array(64);
        this.positions = {};
        delete this.result;

        // 0 = board state
        // 1 = turn
        // 2 = castling
        // 3 = en passant target square
        // 4 = halfmove clock (number of halfmoves since last capture or pawn advance; fifty move rule)
        // 5 = fullmove number (number of fullmoves, starts at 1, incremented after black's move)
        // 6 = blocked piece
        let segments = fenb.split(" ");

        // rewrite board state
        let state = segments[0];
        let f = 0;
        let r = 7;
        for (let i = 0; i < state.length; i++){
            let c = state[i];
            
            if (c == '/'){
                r--;
                f = 0;
            }else if (FENToPiece[c]){
                let piece = FENToPiece[c];
                let sq = f + r * 8;
                this.squares[sq] = piece;
                f++;

                // if the piece is a king, record it
                if (Piece.ofType(piece, Piece.king)){
                    Piece.ofColor(piece, Piece.white) ? this.whiteKing = sq: this.blackKing = sq;
                }
            }else{
                f += parseInt(c);
            }
        }

        // set proper turn
        if (segments[1].toLowerCase() == 'w'){
            this.turn = Piece.white;
        }else{
            this.turn = Piece.black;
        }

        // castling
        this.wQ = segments[2].indexOf("Q") > -1;
        this.wK = segments[2].indexOf("K") > -1;
        this.bQ = segments[2].indexOf("q") > -1;
        this.bK = segments[2].indexOf("k") > -1;

        // en passant
        if (segments[3] == '-'){
            this.enTarget = -1;
        }else{
            this.enTarget = algebraicToSquare(segments[3]);
        }

        // halfmove clock
        this.halfmove = parseInt(segments[4]);

        // fullmove clock
        this.fullmove = parseInt(segments[5]);
        if (isNaN(this.fullmove)) this.fullmove = '-';

        // blocked
        this.blocked = FENToPiece[segments[6]] || 0;

        this.positions[this.getPosition()] = 1;
    }
    getFENB(){
        let FENB = "";

        // write board state into FENB
        for (let r = 7; r >= 0; r--){
            let empty = 0;
            for (let f = 0; f < 8; f++){
                let v = this.squares[f + r * 8];
                if (v){
                    if (empty) FENB += empty;
                    empty = 0;

                    let pieceFEN = PieceTypeToFEN[Piece.getType(v)];
                    FENB += Piece.ofColor(v, Piece.white) ? pieceFEN.toUpperCase(): pieceFEN.toLowerCase();
                }else{
                    empty++;
                }
            }
            if (empty) FENB += empty;
            FENB += '/';
        }
        FENB = FENB.substring(0, FENB.length -1);

        // set proper turn
        let turn = Piece.ofColor(this.turn, Piece.white) ? 'w': 'b';

        // castling
        let castling = `${this.wK ? 'K': ''}${this.wQ ? 'Q': ''}${this.bK ? 'k': ''}${this.bQ ? 'q': ''}`;
        if (castling.length == 0) castling = '-';

        // en passant
        let enPassant = this.enTarget > -1 ? squareToAlgebraic(this.enTarget): '-';
        
        // blocked
        let blockedFEN = PieceTypeToFEN[Piece.getType(this.blocked)];
        if (!blockedFEN) blockedFEN = '-';
        let blocked = Piece.ofColor(this.turn, Piece.white) ? blockedFEN.toUpperCase(): blockedFEN.toLowerCase();

        FENB += ` ${turn} ${castling} ${enPassant} ${this.halfmove} ${this.fullmove} ${blocked}`;

        return FENB;
    }
    loadPGN(pgn){
        // remove headers
        pgn = pgn.replace(/\[.+?\]\s*/g, "");
        console.log(pgn);

        // remove any comments
        pgn = pgn.replace(/\{.+?\}\s*/g, "");

        // start from starting position
        this.loadFENB(StartingFENB);

        // start reading san
        let pgnSplit = pgn.split(" ");
        for (let i = 1; i < pgnSplit.length; i += 3){
            this.playSAN(pgnSplit[i]);
            this.playSAN(pgnSplit[i + 1]);
        }
    }
    // ==== END STATE UPDATES ==== //
}
