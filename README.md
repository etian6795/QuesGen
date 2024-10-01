<h1><img style="width: 30px; height: 30px;" src="https://quesgen.onrender.com/logo.png"> QuesGen</h1>

<p>This is the source code for QuesGen, a fast-paced multiplayer 🏃 trivia/study game backed by the power of AI💪</p>

<p>We built QuesGen using Node.js (Socket.io⚡), HTML, and CSS. Our inspiration came from many trivia questions being boring and having only one answer. We realized that with the power of large language models, we could construct an automatic system to judge answers to much more open-ended questions.</p>

<p>We quickly figured out that these types of trivia questions would be great in STEM education📚, and we elicited Chain-of-Thought reasoning in GPT-4o to generate a set of relatively open-ended questions in the fields of Mathematics🔢, Computer Science💻, Physics💻, Biology🧬, and more! We even support users uploading their own notes so we can generate questions to use in the game!</p>

<p>Now the fun part! Gamifying the process 🎮! Multiple players are placed in a room and are repeatedly cycled through by being asked questions. Each player has 3 lives, and if a player fails to produce a satisfactory response as determined by the LLM in the allotted time, the player loses a life. Once a player loses all lives, they are eliminated from the game. Speed and accuracy are crucial to victory in QuesGen. The last player standing wins the game.</p>
<p>User responses were reviewed with the GPT-4 API, where we use Chain-of-Thought reasoning to more accurately evaluate a response for correctness.</p>

<h1>Youtube Demo</h1>

[![QuesGen](http://img.youtube.com/vi/O7TLz_F-3Hg/0.jpg)](http://www.youtube.com/watch?v=O7TLz_F-3Hg "Video Title")
