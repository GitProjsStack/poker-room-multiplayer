<div style="text-align: center; margin-bottom: 1rem;">
  <h1>Multiplayer Poker</h1>
</div>

<p style="text-align: center;">
  A real-time multiplayer poker game built with <strong>React</strong> and <strong>Socket.IO</strong>, supporting live betting, chip tracking, folding logic, and automatic showdown evaluation.
</p>

<p style="text-align: center;">
  <strong>Live Demo:</strong><br/>
  <a href="https://multiplayer-poker-gitprojsstack.netlify.app" target="_blank" rel="noopener noreferrer">https://multiplayer-poker-gitprojsstack.netlify.app</a>
</p>

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
