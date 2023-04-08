// Contains all logic for pieces, such as their numerical representations. FEN to piece conversions
// are also stored here.
const Piece = {
    none: 0,
    king: 1,
    queen: 2,
    bishop: 3,
    knight: 4,
    rook: 5,
    pawn: 6,
    white: 8,
    black: 16,

    pieceType: parseInt("111", 2),
    colorType: parseInt("11000", 2),

    getType: function(p){
        return p & Piece.pieceType;
    },
    setType: function(p, t){
        return this.getColor(p) | t;
    },
    ofType: function(p, o){
        return Piece.getType(p) == Piece.getType(o);
    },
    getColor: function(p){
        return p & Piece.colorType;
    },
    ofColor: function(p, o){
        return Piece.getColor(p) == Piece.getColor(o);
    },
    isSliding: function(p){
        let t = Piece.getType(p);
        return t == Piece.rook || t == Piece.queen || t == Piece.bishop;
    }
};

const PieceASCII = ['?', 'K', 'Q', 'B', 'N', 'R', ''];

// converts algebraic notation to a square on the board
// consider attaching this directly to Board.
function algebraicToSquare(a){
    return a.charCodeAt(0) -97 + 8 * (parseInt(a[1]) -1);
}

// converts a square on the board to algebraic notation
function squareToAlgebraic(sq){
    let r = squareToAlgebraicRank(sq);
    let f = squareToAlgebraicFile(sq);
    return `${f}${r}`;
}

function squareToAlgebraicFile(sq){
    return String.fromCharCode(getFileFromSq(sq) + 97);
}

function squareToAlgebraicRank(sq){
    return Math.floor(sq/8) + 1;
}

function getFileFromSq(sq){
    return sq % 8;
}

const FENToPiece = {
    k: Piece.black | Piece.king,
    q: Piece.black | Piece.queen,
    b: Piece.black | Piece.bishop,
    n: Piece.black | Piece.knight,
    r: Piece.black | Piece.rook,
    p: Piece.black | Piece.pawn,

    K: Piece.white | Piece.king,
    Q: Piece.white | Piece.queen,
    B: Piece.white | Piece.bishop,
    N: Piece.white | Piece.knight,
    R: Piece.white | Piece.rook,
    P: Piece.white | Piece.pawn,
};

const PieceTypeToFEN = {
    [Piece.king]: 'k',
    [Piece.queen]: 'q',
    [Piece.bishop]: 'b',
    [Piece.knight]: 'n',
    [Piece.rook]: 'r',
    [Piece.pawn]: 'p'
};
