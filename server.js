let getQuestion;
let checkAnswer;

(async () => {
    const module = await import('./checker.mjs');
    getQuestion = module.getQuestion;
})();

(async () => {
    const module = await import('./checker.mjs');
    checkAnswer = module.checkAnswer;
})();

let getNotesQuestion;

(async () => {
    const module = await import('./checker.mjs');
    getNotesQuestion = module.getNotesQuestion;
})();

const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');
const fs = require('fs');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);
let dataset = JSON.parse(fs.readFileSync('questions.json'));

app.use(express.static('public'));

const rooms = {};

io.on('connection', (socket) => {
    console.log('User Connected');

    socket.on('getQuestion', async (data) => {
        let q = await getQuestion(data.topic);
        socket.emit('returnQuestion', q);
    });

    socket.on('checkAnswer', async (data) => {
        let res = await checkAnswer(data.question, data.answer);
        io.in(data.room).emit('pulsate', {isCorrect: res, id: data.id});
        socket.emit('returnAnswer', res);
        if(res) {
            io.in(data.room).emit('deselectPlayer', data.id);
            rooms[data.room].questionsSet.add(data.question);
        }
    });
    socket.on("isValidCode", (code) => {
        socket.emit("validCodeVerdict", code in rooms, code);
    });
    socket.on('getNewRoomCode', () => {
        roomCode = '';
        while(roomCode.length == 0 || roomCode in rooms) {
            roomCode = generateCode();
        }
        rooms[roomCode] = {
            roomSize: 0,
            playerOrder: [],
            started: false,
            topic: '',
            turn: 0,
            questionsSet: new Set()
        };
        socket.emit('returnRoomCode', roomCode);
    });

    socket.on('joinRoom', (data) => {
        socket.join(data.room);
        console.log(socket.id);
        rooms[data.room].roomSize++;
        rooms[data.room].playerOrder.push({name: data.name, id: socket.id, lives: 3});
        console.log(rooms[data.room].playerOrder);

        socket.broadcast.to(data.room).emit('addNewPlayer', {name: data.name, id: socket.id});
    });

    socket.on('getOthers', (room) => {
        socket.emit('returnOthers', rooms[room].playerOrder);
    });

    socket.on('startGame', (data) => {
        let room = rooms[data.room];
        if(room.started) return;
        room.started = true;
        room.topic = data.topic;
        if (room.topic === "pdf") {
            dataset = {"pdf": data.dataset};
        }

        nextTurn(data.room, data.topic, room.playerOrder[room.turn].id)
    });

    socket.on('loseLife', (data) => {
        io.in(data.room).emit('deselectPlayer', data.id);
        io.in(data.room).emit('loseLife', {id: data.id, turn: rooms[data.room].turn});
        rooms[data.room].playerOrder[rooms[data.room].turn].lives--;
    });

    socket.on('nextTurn', (data) => {
        let room = rooms[data.room];
        let nextturn = (room.turn+1)%room.playerOrder.length;
        while(room.playerOrder[nextturn].lives == 0) {
            nextturn = (nextturn+1)%room.playerOrder.length;
        }
        let cnt = 0;
        for(let i = 0; i < room.roomSize; i++) {
            if(room.playerOrder[i].lives>0) cnt++;
        }
        console.log(nextturn);
        if(cnt==1) {
            io.in(data.room).emit('gameOver', nextturn);
        } else {
            console.log(room.turn);
            console.log(nextturn);
            console.log(room.playerOrder);
            room.turn = nextturn;
            nextTurn(data.room, room.topic, room.playerOrder[nextturn].id);
        }
    });

    socket.on('updateOthersText', (data) => {
        socket.to(data.room).emit('updateActivePlayerText', {text: data.text, id: socket.id});
    });

    let pdfQuestions = [];

    socket.on('loadFile', async (pagePromises, textContent) => {
        console.log(textContent);
        let questionsText = await getNotesQuestion(textContent);
        console.log(questionsText);
        pdfQuestions = parseQuestions(questionsText);
        console.log(pdfQuestions);

        socket.emit('loadFile', pdfQuestions);
    });
});

function parseQuestions(questionsText) {
    let splitQuestions = questionsText.split("\n");
    for (let i = 0; i < splitQuestions.length; i++) {
        splitQuestions[i] = {"question": splitQuestions[i].split(". ")[1]};
    }
    return splitQuestions;

}

function nextTurn(room, topic, id) {
    let question = getRandomQuestion(topic, room);
    io.in(room).emit('returnQuestion', question);
    io.in(room).emit('setActivePlayer', id);
}

function getRandomQuestion(topic, room) {
    if (topic === "pdf") {
        console.log(dataset[topic][Math.floor(Math.random() * dataset[topic].length)]);
        let q = dataset[topic][Math.floor(Math.random() * dataset[topic].length)].question;
        while(rooms[room].questionsSet.has(q)) {
            q = dataset[topic][Math.floor(Math.random() * dataset[topic].length)].question;
        }
        if(rooms[room].questionsSet.size > 10) {
            rooms[room].questionsSet = new Set();
        }
        return q;
    }
    let q = dataset.topics[topic][Math.floor(Math.random() * dataset.topics[topic].length)].question;
    while(rooms[room].questionsSet.has(q)) {
        q = dataset.topics[topic][Math.floor(Math.random() * dataset.topics[topic].length)].question;
    }
    if(rooms[room].questionsSet.size > 10) {
        rooms[room].questionsSet = new Set();
    }
    return q;
}

function generateCode() {
    code = '';
    for(let i = 0; i < 5; i++) {
        code += String.fromCharCode(97+Math.floor(Math.random() * 26));
    }
    return code;
}




app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/index.html'));
});

app.get('/room', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages/room.html'));
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));