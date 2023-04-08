// Contains any precomputed logic related to game logic (calculating moves, etc.)

// Precomputes knight moves for every single possible square.
// organized as starting from middle, clockwise direction
const knightOffsets = [17, 10, -6, -15, -17, -10, 6, 15];
// easy knight offsets was to prevent headaches and nothing else. Simply, move by [rank, file].
const easyKnightOffsets = [[2, 1], [1, 2], [-1, 2], [-2, 1], [-2, -1], [-1, -2], [1, -2], [2, -1]];
const knightMoves = [];

// Precomputes distance to edge of board from every square based on direction.
// organized as N, E, S, W, then NE, SE, SW, NW
const dirOffsets = [8, 1, -8, -1, 9, -7, -9, 7];
const numSquaresToEdge = [];
for (let r = 0; r < 8; r++){
    for (let f = 0; f < 8; f++){
        let n = 7 - r;
        let e = 7 - f;
        let s = r;
        let w = f;

        numSquaresToEdge.push([
            n,
            e,
            s,
            w,
            Math.min(n, e),
            Math.min(s, e),
            Math.min(s, w),
            Math.min(n, w)
        ]);
    }
}
