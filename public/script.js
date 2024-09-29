const socket = io();

function createRoom() {
    socket.emit("getNewRoomCode");
};

function attemptJoinGame() {
    let userEnteredCode = document.getElementById("inlineFormInputGroupUsername2").value;
    socket.emit("isValidCode", userEnteredCode);
}

socket.on("validCodeVerdict", (isIn, code) => {
    if (isIn) {
        window.location.href = window.location.href + 'room?roomcode=' + code;
    } else {
        alert("Invalid Code");
    }
}) 

socket.on("returnRoomCode", (code) => {
    window.location.href = window.location.href + 'room?roomcode=' + code;
});