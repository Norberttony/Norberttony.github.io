
class Observer {
    constructor(){}
    onMove(move, fullMove, turn){}
    onResult(result, turn){}
    onFullMoveInc(fullMove){}
    onFinish(move){}
}

// create an observer to SPECIFICALLY remove "testMove" when needed... and record the made move.
class TempObserver extends Observer {
    constructor(){
        super();
    }
    onMove(move, fullMove, turn){
        madeMoves.push(move);
        testMove = undefined;
    }
}

gameState.addObserver(new TempObserver());
