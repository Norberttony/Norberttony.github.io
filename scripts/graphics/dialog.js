
let dialog_box_containerElem = document.getElementById("dialog-box-container");
let dialog_boxElem = document.getElementById("dialog-box");
let dialog_box_titleElem = document.getElementById("dialog-box-title");
let dialog_box_descElem = document.getElementById("dialog-box-desc");

let result_boxElem = document.getElementById("result-box");

let invite_popup_containerElem = document.getElementById("invite-popup-container");
let invite_popupElem = document.getElementById("invite-popup");

function showDialogContainer(){
    dialog_box_containerElem.style.display = "flex";
}

function hideDialogContainer(){
    dialog_box_containerElem.style.display = "none";
}

function displayDialogBox(title, desc){
    hideResultBox();

    showDialogContainer();
    dialog_boxElem.style.display = "block";
}

function hideDialogBox(){
    hideDialogContainer();

    dialog_boxElem.style.display = "none";
}

function displayResultBox(result){
    // change text
    document.getElementById("result-box_result").innerText = result;

    // hide other boxes
    hideDialogBox();

    // display
    showDialogContainer();
    result_boxElem.style.display = "block";
}

function hideResultBox(){
    result_boxElem.style.display = "none";
    hideDialogContainer();
}

function hideInvite(){
    invite_popup_containerElem.style.display = "none";
    invite_popupElem.style.display = "none";
}
