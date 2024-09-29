const socket = io();
var url_string = window.location.href;
var url = new URL(url_string);
let currentRoom = url.searchParams.get("roomcode");
let readPDF = false;
let pdfQuestions = [];

$(document).ready(function(){
    $("#getUsernameModal").modal('show');
});



async function handleChange(event) {
    readPDF = true;
    const file = event.target.files[0];
    const fileReader = new FileReader();

    fileReader.onload = function() {
        const typedarray = new Uint8Array(this.result);
        
        pdfjsLib.getDocument(typedarray).promise.then(pdf => {
            let textContent = '';

            const numPages = pdf.numPages;
            let pagePromises = [];

            for (let i = 1; i <= numPages; i++) {
                pagePromises.push(pdf.getPage(i).then(page => {
                    return page.getTextContent().then(text => {
                        const strings = text.items.map(item => item.str);
                        textContent += strings.join(' ') + '\n';
                    });
                }));
            }

            Promise.all(pagePromises).then(async () => {
                socket.emit('loadFile', pagePromises, textContent);
            });
            
        }).catch(error => {
            console.log(error)
;        });
    };

    fileReader.readAsArrayBuffer(file);

}

socket.on('loadFile', (qs) => {
    pdfQuestions = qs;
});

function addNewUser(username, socketID) {
    const outerDiv = document.createElement("div");
    outerDiv.setAttribute("id", socketID)
    outerDiv.setAttribute("class", "player-card");
    const avatar = document.createElement("div");
    avatar.innerHTML = username[0];
    avatar.setAttribute("class", "player-avatar");
    outerDiv.appendChild(avatar);
    const name = document.createElement("div");
    name.setAttribute("class", "player-name");
    name.innerHTML = username;
    const heartCount = document.createElement("p");
    heartCount.innerHTML = "❤️❤️❤️";
    heartCount.setAttribute("id", socketID + "HeartCount");
    outerDiv.appendChild(name);
    outerDiv.appendChild(heartCount);
    const wordUsed = document.createElement("p");
    wordUsed.setAttribute("id", socketID + "WordUsed");
    wordUsed.setAttribute("style", "word-break: break-all; word-wrap: break-word");
    outerDiv.appendChild(wordUsed);
    document.getElementsByClassName("game-container")[0].appendChild(outerDiv);
}

function addYourself(username, socketID) {
    const outerDiv = document.createElement("div");
    outerDiv.setAttribute("id", socketID);
    outerDiv.setAttribute("class", "player-card");
    const avatar = document.createElement("div");
    avatar.innerHTML = username[0];
    avatar.setAttribute("class", "player-avatar");
    outerDiv.appendChild(avatar);
    const name = document.createElement("div");
    name.setAttribute("class", "player-name");
    name.innerHTML = username;
    const heartCount = document.createElement("p");
    heartCount.innerHTML = "❤️❤️❤️";
    heartCount.setAttribute("id", socketID + "HeartCount");
    outerDiv.appendChild(name);
    outerDiv.appendChild(heartCount);
    const inputBoxYou = document.createElement("input");
    inputBoxYou.setAttribute("type","text");
    inputBoxYou.setAttribute("class","form-control");
    inputBoxYou.setAttribute("placeholder","Type Your Answer");
    inputBoxYou.setAttribute("id", "answer");
    outerDiv.appendChild(inputBoxYou);
    document.getElementsByClassName("game-container")[0].appendChild(outerDiv);

    inputBoxYou.addEventListener('keydown', function(event) {
        if (event.key == 'Enter') {
            console.log("pressed!")
            if(document.getElementById(socket.id).className.includes('player-card active')) {
                console.log("ActivePlayer pressed!")
                let answer = document.getElementById('answer').value;
                document.getElementById('answer').value = "";
                socket.emit('updateOthersText', {text: "", room: currentRoom});
                socket.emit('checkAnswer', {question: document.getElementById('question').innerHTML, answer: answer, room: currentRoom, id: socket.id});
            }
        } else {
            if(document.getElementById(socket.id).className.includes('player-card active')) {
                let answer = document.getElementById('answer').value;
                socket.emit('updateOthersText', {text: answer, room: currentRoom});
            }
        }
    });
}

socket.on('updateActivePlayerText', (data) => {
    document.getElementById(data.id+"WordUsed").innerHTML = data.text;
});

socket.on('returnAnswer', (validAns) => {
    if(validAns) {
        socket.emit('nextTurn', {room: currentRoom});
    }
});

socket.on('pulsate', (data) => {
    pulsate(document.getElementById(data.id), data.isCorrect);
});

function pulsate(obj, isCorrect) {
    obj.classList.remove('pulse-green', 'pulse-red');
    void obj.offsetWidth;
    setTimeout(() => {
        if (isCorrect) {
            obj.classList.add('pulse-green');
        } else {
            obj.classList.add('pulse-red');
        }
    }, 10)

    console.log('After adding:', obj.className);
}

function joinRoom() {  
    let name = document.getElementById("usernameInputBox").value;
    addYourself(name, socket.id);
    $("#getUsernameModal").modal('hide');
    socket.emit('joinRoom', {room: currentRoom, name: name});
    playerList.push({username: name, id: socket.id, lives: 3, eliminated: false});
}

let playerList = []; //order matters, {username,id,lives,eliminated}
socket.emit("getOthers", currentRoom);
socket.on("returnOthers", (others) => {
    for(let i = 0; i < others.length; i++) {
        addNewUser(others[i].name, others[i].id);
        playerList.push({username: others[i].name, id: others[i].id, lives: 3, eliminated: false});
    }
});

socket.on("addNewPlayer", (data) => {
    addNewUser(data.name, data.id);
    playerList.push({username: data.name, id: data.id, lives: 3, eliminated: false})
});

function startGame() {
    if (readPDF) {
        socket.emit('startGame', {room: currentRoom, topic: "pdf", dataset: pdfQuestions});
    }
    socket.emit('startGame', {room: currentRoom, topic: document.getElementById('topicDropDown').options[document.getElementById('topicDropDown').selectedIndex].text, dataset: []});
}

socket.on('returnQuestion', (question) => {
    document.getElementById('question').innerHTML = question;
});

let countdownValue = 10;
let countdownTimer;
socket.on('setActivePlayer', (id) => {
    for(let i = 0; i < playerList.length; i++) {
        if(playerList[i].eliminated) {
            eliminatePlayer(playerList[i].id);
        } else {
            if(playerList[i].id == id) {
                highlightPlayerTurn(id);
            } else {
                unhighlightPlayerTurn(id);
            }
        }
    }
    highlightPlayerTurn(id);

    countdownValue = 10;
    duration = countdownValue;
    const countdownElement = document.getElementById('timer');
    const timerBar = document.getElementById('timerBar');
    timerBar.style.width = '100%';
    timerBar.setAttribute('aria-valuenow', 100);
    clearInterval(countdownTimer);
    countdownTimer = setInterval(() => {
        countdownValue--;
        const percentage = (countdownValue / duration) * 100;
        timerBar.style.width = `${percentage}%`;
        timerBar.setAttribute('aria-valuenow', percentage);
        if (countdownValue < 0) {
            if(socket.id == id) {
                console.log("loseing life");
                socket.emit('loseLife', {room: currentRoom, id: socket.id});
                socket.emit('nextTurn', {room: currentRoom});
                document.getElementById('answer').value = "";
                socket.emit('updateOthersText', {text: "", room: currentRoom});
            }
            clearInterval(countdownTimer);
            timerBar.style.width = '0%';
        }
    }, 1000);
});

socket.on('deselectPlayer', (id) => {
    unhighlightPlayerTurn(id);
});

socket.on('loseLife', (data) => {
    console.log(playerList);
    console.log(data.turn);
    playerList[data.turn].lives--;
    updateLives(data.id, playerList[data.turn].lives);
    if(playerList[data.turn].lives == 0) {
        eliminatePlayer(data.id);
    }
});

socket.on('gameOver', (winner) => {
    console.log(winner);
    console.log(playerList);
    document.getElementById(playerList[winner].id+"HeartCount").innerHTML = "👑👑👑";
});

function eliminatePlayer(socketID) {
    document.getElementById(socketID).setAttribute("class","player-card inactive");
}
function highlightPlayerTurn(socketID) {
    console.log(socketID);
    document.getElementById(socketID).setAttribute("class", "player-card active");
}
function unhighlightPlayerTurn(socketID) {
    document.getElementById(socketID).setAttribute("class", "player-card");
}
function updateLives(socketID, numLives) {
    let newString = "";
    for (let i = 0; i < numLives; i++) newString += "❤️";
    if (numLives == 0) {
        newString = "💀";
    }
    document.getElementById(socketID + "HeartCount").innerHTML = newString;
}

function toggleDarkMode() {
    document.body.classList.toggle('dark-mode');
}