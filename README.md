<div style="text-align: center; margin-bottom: 1rem;">
  <h1>Multiplayer Poker</h1>
</div>

<p style="text-align: center;">
  A real-time multiplayer poker game built with <strong>React</strong> and <strong>Socket.IO</strong>, supporting live betting, chip tracking, folding logic, and automatic showdown evaluation.
</p>

<hr/>

<div style="text-align: center;">
  <h2>Installation &amp; Running Locally</h2>
</div>

<p>To install and run the project locally, follow these steps:</p>

<pre style="background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto;">
git clone https://github.com/GitProjsStack/poker-room-multiplayer.git
# Assuming you are at the root of the project -> ...\poker-room-multiplayer>
cd server
npm install
cd ..
npm install
</pre>

<p>Then start the server by running:</p>

<pre style="background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto;">
node server/index.js
</pre>

<p>Wait until you see the message:</p>

<p><em>✅ Server running on http://localhost:xxxx (usually 3001)</em></p>

<p>Next, start the client UI with:</p>

<pre style="background: #f4f4f4; padding: 1rem; border-radius: 5px; overflow-x: auto;">
npm start
</pre>

<p>This will open the client at <code>http://localhost:3000</code>.</p>

<p>Each player should open their own browser tab at <code>localhost:3000</code> to join the game and start playing.</p>

<hr/>

<div style="text-align: center;">
  <h2>Features</h2>
</div>

<ul>
  <li>Create or join private poker rooms via room code</li>
  <li>Real-time multiplayer gameplay with live betting</li>
  <li>Actions: <strong>Fold</strong>, <strong>Call</strong> (minimum 2 chips, no checking), <strong>Raise</strong></li>
  <li>Pot and bet size synced across all players</li>
  <li>Player chip balances updated in real time</li>
  <li>Folded players are skipped and locked out of further actions</li>
  <li>If one player remains (everyone else folds), they win the pot and a new round starts</li>
  <li>Community cards dealt progressively during each betting loop</li>
  <li>Final <strong>showdown</strong> using <code>pokersolver</code> to determine winner</li>
  <li>Winner’s chips awarded before next round starts</li>
  <li>Clean UI: player hands, community cards, game messages, and error feedback</li>
  <li>Host has control over starting the game</li>
</ul>

<hr/>

<div style="text-align: center;">
  <h2>How It Works</h2>
</div>

<ol>
  <li>Players create or join a room with a name and code</li>
  <li>The host starts the game</li>
  <li>Each player receives two private cards</li>
  <li>Players take turns to <strong>Fold</strong>, <strong>Call</strong>, or <strong>Raise</strong></li>
  <li>Betting continues until everyone matches the bet or folds</li>
  <li>Community cards are revealed in rounds</li>
  <li>If only one player remains, they win by default</li>
  <li>Otherwise, a <strong>showdown</strong> reveals all hands and evaluates the best one</li>
  <li>Chips are awarded, and the game continues with a new round (same players and chip counts)</li>
</ol>

<hr/>

<div style="text-align: center;">
  <h2>Tech Stack</h2>
</div>

<div>
  <h3>Frontend</h3>
  <ul>
    <li>React (Hooks, Context API)</li>
    <li>Socket.IO client</li>
    <li>CSS styling</li>
  </ul>
</div>

<div>
  <h3>Backend</h3>
  <ul>
    <li>Node.js</li>
    <li>Socket.IO for real-time communication</li>
    <li>In-memory game state tracking per room</li>
  </ul>
</div>

<div>
  <h3>Game Logic</h3>
  <ul>
    <li><a href="https://www.npmjs.com/package/pokersolver" target="_blank" rel="noopener noreferrer"><code>pokersolver</code></a> — evaluates the best hand at showdown</li>
  </ul>
</div>

<hr/>
