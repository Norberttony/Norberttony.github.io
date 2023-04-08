// handles storing variations, comments, glyphs, and general annotations for given moves.

class PGNMove {
    constructor(san, glyph, comment, sqNotes, arrNotes){
        this.san = san;
        this.glyph = glyph;
        this.comment = comment;
        this.sqNotes = sqNotes;
        this.arrNotes = arrNotes;
    }
}

class PGNTree {
    constructor(){
        this.moves = [];
    }
    // sets the move variation of a board to the given move...
    // move locations are an array of ply numbers
    // 7, 1, 10, 3, 4 means "mainline ply 7, then first variation, 10th ply, 3rd variation of that ply, then 4th ply"
    setBoardVariation(board, moveFrom, moveLocation){
        
    }
}
