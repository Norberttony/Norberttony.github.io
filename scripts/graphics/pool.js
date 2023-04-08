// handles elements going in and out of the pool.

let draggingElem = document.getElementById("dragging");

// fetches an element from the pool
function fetchElem(className, f, r){
    let elem = document.getElementById("element-pool");
    if (!elem){
        elem = document.createElement("div");
    }

    elem.id = "";
    setElemLocation(elem, f, r);
    elem.className = className;

    return elem;
}

// sets the location of an element on the board
function setElemLocation(elem, f, r){
    elem.style.transform = `translate(${(isDisplayFlipped? 7 - f : f) * 100}%, ${(isDisplayFlipped? r : 7 - r) * 100}%)`;
}

// either creates a completely new highlight, or fetches an unused element.
function getHighlightFromPool(f, r){
    return fetchElem("highlight", f, r);
}

// either creates a completely new square highlight, or fetches an unused element.
function getSquareHighlightFromPool(f, r){
    return fetchElem("squareHighlight", f, r);
}

// either creates a completely new piece, or fetches an unused element.
function getPieceFromPool(f, r){
    let piece = fetchElem("piece", f, r);

    // dragging capabilities is actually given to a different, separate elem.
    piece.onmousedown = pieceMousedown;
    piece.addEventListener("touchstart", pieceMousedown, {passive: true});

    piece.id = `${f}_${r}`;
    
    return piece;
}

// puts an element back into the pool.
function setElemToPool(elem){
    elem.id = "element-pool";
    elem.className = "";
    elem.onmousedown = function(){}
    elem.onmouseup = function(){}
    elem.removeEventListener("touchstart", pieceMousedown, {passive: true});
}

// puts a class into the pool
function setClassToPool(classSelector, container = gameElem){
    let elems = container.getElementsByClassName(classSelector);
    while (elems.length > 0)
        setElemToPool(elems[0]);
}

// puts all pieces back into the pool.
function setAllPiecesToPool(container){
    setClassToPool("piece", container);
}

// puts all highlights back into pool.
function setAllHighlightsToPool(container){
    setClassToPool("highlight", container);
}

// puts all square highlights back into pool.
function setAllSquareHighlightsToPool(container){
    setClassToPool("squareHighlight", container);
}
