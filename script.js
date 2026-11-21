
const DEFAULT_DATA = {
  coins: 0,
  points: 0,
  played: 0,
  completed: 0,
  finished: [],
  openedLetters: [],
  records: {},
  openedChest: [],
  vaultOpened: false,
  adventureEnding: ""
};

function loadData() {
  try {
    return { ...DEFAULT_DATA, ...JSON.parse(localStorage.getItem("entreNosSave") || "{}") };
  } catch {
    return { ...DEFAULT_DATA };
  }
}

let data = loadData();
let currentGame = null;
let runCompleted = false;

const $ = id => document.getElementById(id);

function saveData() {
  localStorage.setItem("entreNosSave", JSON.stringify(data));
  updateStats();
}

function resetTrophiesDirect() {
  try {
    const saved = JSON.parse(localStorage.getItem("entreNosSave") || "{}");
    saved.completed = 0;
    saved.finished = [];
    saved.records = {};
    localStorage.setItem("entreNosSave", JSON.stringify(saved));
    location.reload();
  } catch (error) {
    alert("Não foi possível zerar os troféus. Tente novamente.");
  }
}

function ensureHomeExtras() {
  const home = $("home");
  if (!home) return;

  if (!$("resetTrophiesArea")) {
    const area = document.createElement("div");
    area.id = "resetTrophiesArea";
    area.innerHTML = '<button id="resetTrophiesButton" onclick="resetTrophiesDirect()">🏆 Zerar troféus</button>';
    home.appendChild(area);
  }

  if (!$("creatorCredit")) {
    const credit = document.createElement("div");
    credit.id = "creatorCredit";
    credit.className = "creator-credit";
    credit.innerHTML = '<div>💗</div><strong>Criado por Marcos Gabriel</strong><br><span>Especialmente para Emily ❤️</span>';
    home.appendChild(credit);
  }
}

function updateStats() {
  const completed = $("completed");
  if (completed) completed.textContent = data.completed;

  const coinPill = document.querySelector(".coin-pill");
  if (coinPill) coinPill.style.display = "none";

  const stats = document.querySelector(".stats");
  if (stats) {
    if (stats.children[0]) stats.children[0].style.display = "none";
    if (stats.children[1]) stats.children[1].style.display = "none";
    stats.style.gridTemplateColumns = "1fr";
  }

  ensureHomeExtras();
}

function toast(msg) {
  const el = $("toast");
  if (!el) return;
  el.textContent = msg;
  el.classList.add("show");
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(() => el.classList.remove("show"), 2300);
}

function openGame(game) {
  currentGame = game;
  runCompleted = false;

  data.played++;
  saveData();

  $("home").classList.add("hidden");
  $("gameScreen").classList.remove("hidden");

  const games = {
    puzzle: showPuzzle,
    memory: showMemory,
    quiz: showQuiz,
    maze: showMaze,
    words: showWords,
    differences: showDifferences,
    hangman: showHangman,
    letters: showLetters,
    btsMusic: showBtsMusic,
    btsQuiz: showBtsQuiz,
    surprise: showSurprise,
    chest: showChest,
    adventure: showAdventure,
    vault: showVault
  };

  if (games[game]) games[game]();
  window.scrollTo(0, 0);
}

function goHome() {
  $("gameScreen").classList.add("hidden");
  $("home").classList.remove("hidden");
  currentGame = null;
  updateStats();
  window.scrollTo(0, 0);
}

function renderGame(title, desc, content) {
  $("gameContent").innerHTML =
    `<h2 class="game-title">${title}</h2>
     <p class="game-description">${desc}</p>${content}`;
}

function finishGame(points, msg) {
  if (runCompleted) return;

  runCompleted = true;

  if (!data.finished.includes(currentGame)) {
    data.finished.push(currentGame);
    data.completed++;
  }

  const coins = Math.max(5, Math.floor(points / 2));
  data.points += points;
  data.coins += coins;
  data.records[currentGame] = Math.max(data.records[currentGame] || 0, points);

  saveData();

  $("gameContent").insertAdjacentHTML(
    "beforeend",
    `<div class="result">
      <div style="font-size:35px">💖</div>
      <h3>Desafio concluído!</h3>
      <p>${msg}</p>
      <p>⭐ +${points} pontos · 💗 +${coins} moedas</p>
      <button class="primary-btn" onclick="goHome()">Voltar aos jogos</button>
    </div>`
  );

  toast("Você ganhou uma recompensa! 💕");
}

function shuffle(a) {
  return [...a].sort(() => Math.random() - .5);
}

function normalize(s) {
  return s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase().trim();
}

/* 1 — QUEBRA-CABEÇA */

const puzzleWords = ["VOCÊ", "É", "MEU", "LUGAR", "FAVORITO", "NO", "MUNDO", "❤️"];
let puzzle = [], puzzleMoves = 0;

function neighbors(i) {
  const r = Math.floor(i / 3), c = i % 3, out = [];
  if (r) out.push(i - 3);
  if (r < 2) out.push(i + 3);
  if (c) out.push(i - 1);
  if (c < 2) out.push(i + 1);
  return out;
}

function showPuzzle() {
  puzzle = [1,2,3,4,5,6,7,8,0];
  puzzleMoves = 0;

  for (let i = 0; i < 140; i++) {
    const e = puzzle.indexOf(0);
    const opts = neighbors(e);
    const n = opts[Math.floor(Math.random() * opts.length)];
    [puzzle[e], puzzle[n]] = [puzzle[n], puzzle[e]];
  }

  renderPuzzle();
}

function renderPuzzle() {
  const tiles = puzzle.map((n, i) =>
    `<button class="puzzle-tile ${n === 0 ? "empty" : ""}" onclick="movePuzzle(${i})">${n ? puzzleWords[n - 1] : ""}</button>`
  ).join("");

  renderGame("🧩 Quebra-cabeça", "Nível 2 · Organize as peças na ordem correta.", `
    <div class="game-panel">
      <p style="text-align:center;font-size:11px">VOCÊ É MEU LUGAR FAVORITO NO MUNDO ❤️</p>
      <div class="puzzle-grid">${tiles}</div>
      <p style="text-align:center;font-size:11px">Movimentos: <b>${puzzleMoves}</b> · Recorde: ${data.records.puzzle || "—"}</p>
      <button class="primary-btn" onclick="showPuzzle()">Embaralhar</button>
    </div>`);
}

function movePuzzle(i) {
  const e = puzzle.indexOf(0);
  if (!neighbors(e).includes(i) || runCompleted) return;

  [puzzle[e], puzzle[i]] = [puzzle[i], puzzle[e]];
  puzzleMoves++;

  if (puzzle.every((n, i) => n === ((i + 1) % 9))) {
    renderPuzzle();
    finishGame(Math.max(50, 150 - puzzleMoves), "Você organizou a mensagem! ❤️");
    return;
  }

  renderPuzzle();
}

/* 2 — MEMÓRIA */

let mem = [], memPick = [], memPairs = 0, memTurns = 0, memLock = false;

function showMemory() {
  const icons = ["💗","🌹","💍","💌","🧸","💐","😘","❤️","🌙","🦋"];
  mem = shuffle([...icons, ...icons]).map((v, i) => ({
    id: i, v, open: false, done: false
  }));
  memPick = [];
  memPairs = 0;
  memTurns = 0;
  memLock = false;
  renderMemory();
}

function renderMemory() {
  renderGame("🧠 Memória do amor", "Nível avançado · 10 pares. Encontre todos!", `
    <div class="game-panel">
      <p style="text-align:center;font-size:11px">Pares ${memPairs}/10 · Tentativas ${memTurns}</p>
      <div class="memory-grid">
        ${mem.map((c, i) =>
          `<button class="memory-card ${c.open ? "opened" : ""} ${c.done ? "matched" : ""}" onclick="flipMemory(${i})">${c.open || c.done ? c.v : "?"}</button>`
        ).join("")}
      </div>
      <button class="primary-btn" onclick="showMemory()">Recomeçar</button>
    </div>`);
}

function flipMemory(i) {
  if (memLock || runCompleted || mem[i].open || mem[i].done) return;

  mem[i].open = true;
  memPick.push(i);

  if (memPick.length === 2) {
    memTurns++;
    const [a, b] = memPick;

    if (mem[a].v === mem[b].v) {
      mem[a].done = mem[b].done = true;
      memPairs++;
      memPick = [];
      renderMemory();

      if (memPairs === 10) {
        finishGame(Math.max(60, 180 - memTurns * 3), "Você encontrou os dez pares! 💗");
      }
    } else {
      memLock = true;
      renderMemory();

      setTimeout(() => {
        mem[a].open = mem[b].open = false;
        memPick = [];
        memLock = false;
        renderMemory();
      }, 850);
    }
  } else {
    renderMemory();
  }
}

/* 3 — QUIZ DO CASAL */

const quizQ = [
  ["Qual atitude demonstra mais confiança em um relacionamento?", ["Ser sincero mesmo em conversas difíceis","Esconder problemas","Evitar diálogo","Fazer promessas sem cumprir"], 0],
  ["O que transforma um dia simples em especial?", ["Um presente caro","Estar junto de verdade","Uma postagem","Uma viagem obrigatória"], 1],
  ["Quando surge um desentendimento, o melhor caminho é:", ["Ignorar até passar","Disputar quem tem razão","Conversar e ouvir","Ficar dias sem falar"], 2],
  ["Qual detalhe costuma demonstrar carinho?", ["Lembrar de algo importante","Responder por obrigação","Fazer comparações","Não prestar atenção"], 0],
  ["O que sustenta uma relação ao longo do tempo?", ["Apenas paixão","Respeito, diálogo e cuidado","Ciúme constante","Nunca discordar"], 1],
  ["Qual é uma boa forma de apoiar quem amamos?", ["Diminuir seus sonhos","Ouvir e incentivar","Decidir tudo pela pessoa","Comparar com os outros"], 1],
  ["O que vale mais em um pedido de desculpas?", ["Uma desculpa sincera acompanhada de mudança","Uma justificativa longa","Culpar o outro","Fingir que nada aconteceu"], 0],
  ["Qual plano combina com um momento especial a dois?", ["Fazer algo que ambos gostem","Obrigar o outro a escolher","Passar o tempo discutindo","Cancelar sem conversar"], 0],
  ["O que é importante preservar mesmo namorando?", ["Respeito à individualidade","Controle total","Segredos que machucam","Competição"], 0],
  ["Qual frase resume uma relação saudável?", ["Precisamos pensar igual sempre","Estamos no mesmo time","Um deve vencer o outro","Carinho só nos dias bons"], 1]
];

let qi = 0, qs = 0;

function showQuiz() {
  qi = 0;
  qs = 0;
  renderQuiz();
}

function renderQuiz() {
  if (qi >= quizQ.length) {
    renderGame("💕 Quiz do casal", "Seu resultado chegou!", `
      <div class="result">
        <h3>${qs}/${quizQ.length} acertos</h3>
        <p>O amor também é continuar aprendendo um com o outro.</p>
        <button class="primary-btn" onclick="finishGame(${qs * 15 + 30},'Você terminou o quiz!')">Receber recompensa</button>
      </div>`);
    return;
  }

  const q = quizQ[qi];

  renderGame("💕 Quiz do casal", `Pergunta ${qi + 1} de ${quizQ.length}`, `
    <div class="progress"><div style="width:${qi / quizQ.length * 100}%"></div></div>
    <div class="game-panel">
      <h3 style="font-size:15px">${q[0]}</h3>
      ${q[1].map((o, i) =>
        `<button class="option-btn" onclick="answerQuiz(${i})">${String.fromCharCode(65 + i)}. ${o}</button>`
      ).join("")}
    </div>`);
}

function answerQuiz(i) {
  if (runCompleted) return;
  if (i === quizQ[qi][2]) {
    qs++;
    toast("Resposta certa! 💗");
  } else {
    toast("Não foi dessa vez. Continue!");
  }
  qi++;
  renderQuiz();
}

/* 4 — LABIRINTO */

const maze = [
  ".........",
  ".###.###.",
  ".#...#...",
  "...#...#.",
  "##.#.#...",
  "...#...##",
  ".#...#...",
  "...###.#.",
  "........."
];

let player = { x: 0, y: 0 }, mazeSteps = 0;

function showMaze() {
  player = { x: 0, y: 0 };
  mazeSteps = 0;
  renderMaze();
}

function renderMaze() {
  let cells = "";

  for (let y = 0; y < 9; y++) {
    for (let x = 0; x < 9; x++) {
      const wall = maze[y][x] === "#";
      const p = player.x === x && player.y === y;
      const g = x === 8 && y === 8;
      cells += `<div class="maze-cell ${wall ? "wall" : ""} ${p ? "player" : ""} ${g ? "goal" : ""}">${p ? "💗" : g ? "💖" : ""}</div>`;
    }
  }

  renderGame("🗺️ Labirinto do amor", "Encontre o caminho até o coração.", `
    <div class="game-panel">
      <p style="text-align:center;font-size:11px">Passos: ${mazeSteps}</p>
      <div class="maze">${cells}</div>
      <div class="controls">
        <span></span><button onclick="moveMaze(0,-1)">↑</button><span></span>
        <button onclick="moveMaze(-1,0)">←</button>
        <button onclick="moveMaze(0,1)">↓</button>
        <button onclick="moveMaze(1,0)">→</button>
      </div>
      <button class="primary-btn" onclick="showMaze()">Recomeçar</button>
    </div>`);
}

function moveMaze(dx, dy) {
  if (runCompleted) return;

  const x = player.x + dx, y = player.y + dy;
  if (x < 0 || y < 0 || x > 8 || y > 8 || maze[y][x] === "#") {
    toast("Caminho bloqueado! Procure outra passagem.");
    return;
  }

  player = { x, y };
  mazeSteps++;

  if (x === 8 && y === 8) {
    renderMaze();
    finishGame(Math.max(60, 150 - mazeSteps), "Você encontrou o coração! ❤️");
    return;
  }

  renderMaze();
}

document.addEventListener("keydown", e => {
  if (currentGame !== "maze") return;
  const k = {
    ArrowUp: [0,-1],
    ArrowDown: [0,1],
    ArrowLeft: [-1,0],
    ArrowRight: [1,0]
  }[e.key];

  if (k) {
    e.preventDefault();
    moveMaze(...k);
  }
});

/* 5 — PALAVRAS */

const wordQs = [
  ["Sentimento que une duas pessoas.", "AMOR"],
  ["Demonstração de carinho com os braços.", "ABRACO"],
  ["Ato de afeto com os lábios.", "BEIJO"],
  ["O que devemos ter um pelo outro.", "RESPEITO"],
  ["Acreditar na palavra de alguém.", "CONFIANCA"],
  ["Lembrança boa que fica na memória.", "RECORDAO"],
  ["Cuidado demonstrado em pequenos gestos.", "CARINHO"]
];

function showWords() {
  renderGame("✍️ Palavras cruzadas", "Resolva as sete pistas. Não use acentos.", `
    <div class="game-panel">
      ${wordQs.map((q, i) =>
        `<div class="crossword-item">
          <label>${i + 1}. ${q[0]}</label>
          <input id="word${i}" autocomplete="off" placeholder="SUA RESPOSTA">
        </div>`
      ).join("")}
      <button class="primary-btn" onclick="checkWords()">Conferir respostas</button>
    </div>
    <div id="wordResult"></div>`);
}

function checkWords() {
  let n = 0;

  wordQs.forEach((q, i) => {
    const el = $("word" + i);
    if (normalize(el.value) === q[1]) {
      n++;
      el.style.borderColor = "#55b98c";
    } else {
      el.style.borderColor = "#ef7b9e";
    }
  });

  if (n === wordQs.length) {
    finishGame(180, "Você resolveu todas as pistas! 💌");
  } else {
    $("wordResult").innerHTML =
      `<div class="result"><h3>${n}/${wordQs.length} corretas</h3><p>Revise as respostas e tente novamente.</p></div>`;
  }
}

/* 6 — ENCONTRE AS DIFERENÇAS */

const sceneA = ["🌹","💗","🌙","🧸","⭐","💌","🌷","❤️","☁️","🕯️","🍓","🎀"];
const sceneB = ["🌹","💗","☀️","🧸","⭐","💌","🌷","💜","☁️","🕯️","🍒","🎀"];
const diffPositions = [2,7,10];
let found = [];

function showDifferences() {
  found = [];
  renderDifferences();
}

function renderDifferences() {
  const make = a => a.map((v, i) =>
    `<button class="scene-item ${found.includes(i) ? "found" : ""}" onclick="selectDifference(${i})">${v}</button>`
  ).join("");

  renderGame("🔎 Encontre as diferenças", "Compare as cenas e encontre os três detalhes alterados.", `
    <div class="game-panel">
      <p style="text-align:center;font-size:11px">Encontradas: ${found.length}/3</p>
      <div class="difference-grid">
        <div class="difference-scene"><div class="scene-title">CENA A</div><div class="scene-items">${make(sceneA)}</div></div>
        <div class="difference-scene"><div class="scene-title">CENA B</div><div class="scene-items">${make(sceneB)}</div></div>
      </div>
      <button class="primary-btn" onclick="showDifferences()">Reiniciar desafio</button>
    </div>`);
}

function selectDifference(i) {
  if (runCompleted || found.includes(i)) return;
  if (!diffPositions.includes(i)) {
    toast("Esse detalhe está igual nas duas cenas!");
    return;
  }

  found.push(i);
  renderDifferences();

  if (found.length === 3) {
    finishGame(120, "Você encontrou os três detalhes! 🔎");
  }
}

/* 7 — FORCA */

const hangWords = [
  ["NAMORO","Uma relação cheia de carinho."],
  ["CARINHO","Demonstração de afeto."],
  ["CORACAO","Símbolo clássico do amor."],
  ["SAUDADE","Sentimento de quem sente falta."],
  ["COMPANHEIRISMO","Estar junto e apoiar."],
  ["CUMPLICIDADE","Entendimento especial entre duas pessoas."],
  ["RECIPROCIDADE","Quando o sentimento e o cuidado são mútuos."],
  ["ETERNIDADE","Tempo que parece não ter fim."]
];

let hw, guesses = [], errors = 0;
const maxErrors = 6;

function showHangman() {
  hw = hangWords[Math.floor(Math.random() * hangWords.length)];
  guesses = [];
  errors = 0;
  renderHangman();
}

function renderHangman() {
  const display = [...hw[0]].map(c => guesses.includes(c) ? c : "_").join(" ");
  const won = [...hw[0]].every(c => guesses.includes(c));

  const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("").map(c =>
    `<button ${guesses.includes(c) ? "disabled" : ""} onclick="guessLetter('${c}')">${c}</button>`
  ).join("");

  renderGame("🔤 Acerte a palavra", "Descubra a palavra. Você tem seis erros permitidos.", `
    <div class="game-panel">
      <p style="text-align:center;font-size:12px">💡 ${hw[1]}</p>
      <div class="word-display">${display}</div>
      <p style="text-align:center;font-size:11px">Erros: ${errors}/${maxErrors}</p>
      <div class="progress"><div style="width:${errors / maxErrors * 100}%;background:#e96b81"></div></div>
      <div class="alphabet">${alphabet}</div>
      <button class="primary-btn" onclick="showHangman()">Nova palavra</button>
    </div>`);

  if (won) {
    finishGame(100 + Math.max(0, (maxErrors - errors) * 5), `A palavra era ${hw[0]}. Mandou muito bem!`);
  } else if (errors >= maxErrors) {
    $("gameContent").insertAdjacentHTML("beforeend", `
      <div class="result"><h3>Quase lá!</h3><p>A palavra era ${hw[0]}.</p>
      <button class="primary-btn" onclick="showHangman()">Tentar outra</button></div>`);
  }
}

function guessLetter(c) {
  if (runCompleted || errors >= maxErrors || guesses.includes(c)) return;
  guesses.push(c);
  if (!hw[0].includes(c)) errors++;
  renderHangman();
}

/* 8 — CARTAS SECRETAS */

const letters = [
  ["Uma pequena declaração","Se eu pudesse escolher novamente, escolheria você. Em cada dia, em cada momento e em cada versão da nossa história. ❤️"],
  ["Meu lugar favorito","Meu lugar favorito não é uma cidade, uma casa ou uma viagem. Meu lugar favorito é onde você está. 💗"],
  ["Um desejo","Quero colecionar momentos com você, conhecer lugares novos, rir das coisas bobas e continuar construindo nossa história. 🌹"],
  ["Uma promessa","Prometo cuidar do nosso carinho, valorizar nossos momentos e escolher conversar mesmo nos dias difíceis. 💌"],
  ["Para nunca esquecer","Você é uma parte muito especial da minha vida. Nunca duvide do quanto sua presença faz diferença para mim. 🧸"]
];

function showLetters() {
  renderGame("💌 Cartas secretas", "Todas as cartas estão disponíveis. Abra e releia qualquer mensagem quando quiser.", `
    <div class="game-panel">
      <div style="text-align:center;font-size:30px;margin-bottom:10px">💗 💌 💗</div>
      ${letters.map((l, i) =>
        `<button class="letter-choice" onclick="openLetter(${i})">💌 Carta ${i + 1}<span style="float:right">Abrir carta →</span></button>`
      ).join("")}
    </div>
    <div id="letterResult"></div>`);
}

function openLetter(i) {
  const l = letters[i];
  $("letterResult").innerHTML = `
    <div class="letter-card">
      <div class="letter-icon">💌</div>
      <h3>${l[0]}</h3>
      <p>${l[1]}</p>
      <p style="font-size:22px">❤️</p>
    </div>`;
}

/* 9 — QUIZ MUSICAL BTS */

const songs = [
  {name:"Dynamite",id:"4saklk6nie3yiGePpBwUoc"},
  {name:"Butter",id:"3VqeTFIvhxu3DIe4eZVzGq"},
  {name:"Spring Day",id:"0WNGsQ1oAuHzNTk8jivBKW"},
  {name:"DNA",id:"35FNfIOs3J1DGDKuDoahRx"},
  {name:"FAKE LOVE",id:"5Sn2fm8aisVlR7S6u1KW57"},
  {name:"IDOL",id:"2AIWoHr9DF6y4KALCBKWQS"}
];

let musicRound = 0, musicScore = 0, musicOrder = [];

function showBtsMusic() {
  musicRound = 0;
  musicScore = 0;
  musicOrder = shuffle(songs);
  renderBtsMusic();
}

function renderBtsMusic() {
  if (musicRound >= musicOrder.length) {
    renderGame("🎧 Desafio musical BTS", "Resultado final", `
      <div class="result">
        <div style="font-size:35px">💜</div>
        <h3>${musicScore}/${songs.length} acertos</h3>
        <p>${musicScore === songs.length ? "ARMY lendária! Você reconheceu todas!" : "Bom trabalho, ARMY!"}</p>
        <button class="primary-btn" onclick="finishGame(musicScore * 25 + 25,'Você completou o desafio musical do BTS! Borahae! 💜')">Receber recompensa</button>
      </div>`);
    return;
  }

  const s = musicOrder[musicRound];
  const opts = shuffle([
    s.name,
    ...shuffle(songs.filter(x => x.name !== s.name)).slice(0, 3).map(x => x.name)
  ]);

  renderGame("🎧 Qual é essa música?", "Ouça pelo player oficial e escolha o título correto.", `
    <div class="bts-logo"><strong>BTS</strong><small>ARMY MUSIC QUIZ · RODADA ${musicRound + 1}/${songs.length}</small></div>
    <div class="progress"><div style="width:${musicRound / songs.length * 100}%"></div></div>
    <div class="game-panel">
      <p style="text-align:center;font-size:12px;font-weight:800">🎵 Toque em reproduzir e escute com atenção</p>
      <div class="spotify-player-mask">
        <iframe class="spotify-frame" src="https://open.spotify.com/embed/track/${s.id}?utm_source=generator&theme=0" width="100%" height="80" frameborder="0" allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" loading="lazy" title="Player oficial do Spotify"></iframe>
        <span class="spotify-title-cover" aria-hidden="true"></span>
      </div>
      <p class="audio-note">O áudio é fornecido pelo Spotify. Pode ser necessário entrar na sua conta.</p>
      ${opts.map(o =>
        `<button class="option-btn" onclick="answerMusic('${o.replace(/'/g, "\\'")}')">${o}</button>`
      ).join("")}
    </div>
    <p style="text-align:center;font-size:11px">Acertos: ${musicScore}</p>`);
}

function answerMusic(name) {
  if (runCompleted) return;
  if (name === musicOrder[musicRound].name) {
    musicScore++;
    toast("Acertou! ARMY de verdade! 💜");
  } else {
    toast("Essa não era! Bora para a próxima.");
  }
  musicRound++;
  renderBtsMusic();
}

/* 10 — BTS */

const members = [
  ["RM","Sou o líder do BTS e meu nome verdadeiro é Kim Namjoon.",["RM","Jin","V","Jimin"]],
  ["Jin","Sou conhecido pelo apelido Worldwide Handsome.",["SUGA","Jin","j-hope","Jung Kook"]],
  ["SUGA","Meu nome verdadeiro é Min Yoongi e também uso o nome Agust D.",["RM","Jimin","SUGA","V"]],
  ["j-hope","Meu nome verdadeiro é Jung Hoseok e sou conhecido por minha energia e dança.",["Jin","j-hope","RM","Jung Kook"]],
  ["Jimin","Meu nome verdadeiro é Park Jimin.",["V","Jimin","SUGA","Jin"]],
  ["V","Meu nome verdadeiro é Kim Taehyung.",["RM","Jung Kook","V","Jimin"]],
  ["Jung Kook","Sou conhecido como Golden Maknae do grupo.",["Jung Kook","Jin","SUGA","j-hope"]]
];

let bi = 0, bs = 0;

function showBtsQuiz() {
  bi = 0;
  bs = 0;
  renderBtsQuiz();
}

function renderBtsQuiz() {
  if (bi >= members.length) {
    renderGame("💜 Universo BTS", "Resultado ARMY", `
      <div class="result">
        <h3>${bs}/7 acertos</h3>
        <p>${bs === 7 ? "Perfeito! Você conhece os sete integrantes!" : "Muito bem! Continue aprendendo sobre o BTS."}</p>
        <button class="primary-btn" onclick="finishGame(bs * 25 + 25,'Você concluiu o desafio dos integrantes! Borahae! 💜')">Receber recompensa</button>
      </div>`);
    return;
  }

  const m = members[bi];

  renderGame("💜 Quem sou eu? BTS", `Pergunta ${bi + 1} de 7`, `
    <div class="bts-logo"><strong>BTS</strong><small>ARMY KNOWLEDGE TEST</small></div>
    <div class="progress"><div style="width:${bi / 7 * 100}%"></div></div>
    <div class="member-card">
      <div class="member-symbol">💜</div>
      <h3>Quem sou eu?</h3>
      <p>${m[1]}</p>
    </div>
    <div class="game-panel">
      ${shuffle(m[2]).map(o =>
        `<button class="option-btn" onclick="answerMember('${o}')">${o}</button>`
      ).join("")}
    </div>`);
}

function answerMember(a) {
  if (a === members[bi][0]) {
    bs++;
    toast("Acertou! 💜");
  } else {
    toast("Ops! Continue, ARMY!");
  }
  bi++;
  renderBtsQuiz();
}

/* 11 — MENSAGEM SURPRESA */

const surpriseMessages = [
  "Às vezes eu paro por alguns segundos e penso na sorte que tenho por ter você na minha vida. ❤️",
  "Se existisse um lugar onde todos os meus momentos favoritos estivessem guardados, você estaria em quase todos eles. 💗",
  "Não preciso de um dia especial para lembrar o quanto você é especial para mim.",
  "Entre tantas pessoas e tantos caminhos, meu coração encontrou em você um motivo para sorrir.",
  "Quero continuar descobrindo novos motivos para me apaixonar por você, até nos dias mais comuns.",
  "Você é aquela parte bonita da minha história que eu nunca quero deixar de escrever.",
  "Se hoje eu pudesse te entregar uma coisa, seria a oportunidade de se enxergar pelos meus olhos."
];

function showSurprise() {
  const message = surpriseMessages[Math.floor(Math.random() * surpriseMessages.length)];

  renderGame("💌 Mensagem surpresa", "Uma pequena lembrança para você, em um dia qualquer.", `
    <div class="experience-banner">
      <span class="big-icon">✨</span>
      <h3>Uma surpresa só sua</h3>
      <p>Nem toda surpresa precisa de uma data especial.</p>
    </div>
    <div class="surprise-message">
      <div class="big-icon">💗</div>
      <p>${message}</p>
      <span>Com carinho, para você. ❤️</span>
    </div>
    <button class="primary-btn" onclick="showSurprise()">Quero outra mensagem 💌</button>
  `);
}

/* 12 — BAÚ DE SURPRESAS */

const chestRewards = [
  {
    name: "Primeiro carinho",
    icon: "💌",
    requirement: 1,
    message: "Meu primeiro presente é simples: nunca se esqueça de que você é muito amada."
  },
  {
    name: "Um abraço demorado",
    icon: "🧸",
    requirement: 2,
    message: "Este presente vale um abraço bem apertado, daqueles que fazem o mundo ficar quietinho."
  },
  {
    name: "Um encontro especial",
    icon: "🌹",
    requirement: 4,
    message: "Você acaba de ganhar um encontro especial comigo. O destino e os detalhes ficam por nossa conta."
  },
  {
    name: "Uma declaração",
    icon: "❤️",
    requirement: 6,
    message: "Se eu pudesse escolher um presente para todos os dias, escolheria continuar vivendo momentos ao seu lado."
  },
  {
    name: "Surpresa final",
    icon: "💍",
    requirement: 10,
    message: "Você chegou até aqui. Meu maior presente é poder dividir a vida, os sonhos e as pequenas alegrias com você."
  }
];

function showChest() {
  const total = data.completed || 0;

  renderGame("🎁 Baú de surpresas", "Conclua jogos para revelar os presentes que preparei para você.", `
    <div class="experience-banner">
      <span class="big-icon">🎁</span>
      <h3>Um presente de cada vez</h3>
      <p>Você já concluiu ${total} jogo(s). Continue explorando para descobrir todos os presentes.</p>
    </div>
    <div class="chest-grid">
      ${chestRewards.map((reward, i) => {
        const unlocked = total >= reward.requirement;
        const opened = (data.openedChest || []).includes(i);

        return `
          <button class="chest-item ${unlocked ? "unlocked" : "locked"}"
            ${unlocked ? `onclick="openChestReward(${i})"` : "disabled"}>
            <span class="chest-icon">${opened ? "🎀" : unlocked ? reward.icon : "🔒"}</span>
            <strong>${opened ? "Presente aberto" : reward.name}</strong>
            <small>${opened ? "Toque para reler" : unlocked ? "Disponível! Toque para abrir" : `Desbloqueia com ${reward.requirement} jogos concluídos`}</small>
          </button>`;
      }).join("")}
    </div>
    <div id="chestResult"></div>
  `);
}

function openChestReward(i) {
  const reward = chestRewards[i];

  if (data.completed < reward.requirement) {
    toast("Ainda falta um pouquinho! 💗");
    return;
  }

  if (!data.openedChest.includes(i)) {
    data.openedChest.push(i);
    saveData();
  }

  $("chestResult").innerHTML = `
    <div class="letter-card">
      <div class="letter-icon">${reward.icon}</div>
      <h3>${reward.name}</h3>
      <p>${reward.message}</p>
      <p style="font-size:22px">❤️</p>
    </div>`;

  toast("Você abriu um presente! 🎁");
}

/* 13 — NOSSA AVENTURA */

const adventureScenes = {
  start: {
    icon: "🌙",
    title: "Uma noite só nossa",
    text: "Imagine que temos uma noite inteira livre, sem pressa e sem preocupações. A cidade está iluminada e temos a chance de criar uma lembrança nova. O que você escolheria?",
    choices: [
      ["🌃 Caminhar pela cidade e conversar", "walk"],
      ["🍿 Preparar uma noite de filmes", "movie"]
    ]
  },
  walk: {
    icon: "🌃",
    title: "Sob as luzes da cidade",
    text: "Enquanto caminhamos, encontramos um lugar tranquilo, com uma vista bonita. O que fazemos?",
    choices: [
      ["💬 Ficar conversando até perder a hora", "talk"],
      ["📸 Registrar esse momento juntos", "photo"]
    ]
  },
  movie: {
    icon: "🍿",
    title: "Nossa sessão particular",
    text: "A noite está aconchegante, os filmes estão escolhidos e temos tudo o que precisamos. Mas ainda falta decidir uma coisa.",
    choices: [
      ["😂 Escolher uma comédia para rir juntos", "laugh"],
      ["💕 Escolher um romance", "romance"]
    ]
  },
  talk: {
    icon: "💗",
    title: "O tempo passa sem perceber",
    text: "A conversa vai de lembranças engraçadas até sonhos que ainda queremos realizar. E então você percebe que o melhor da noite não era o lugar, mas a companhia.",
    choices: [
      ["❤️ Guardar esse momento no coração", "ending1"]
    ]
  },
  photo: {
    icon: "📸",
    title: "Uma lembrança para guardar",
    text: "Tiramos uma foto. Talvez ela não fique perfeita, mas vai lembrar uma noite em que fomos felizes simplesmente por estarmos juntos.",
    choices: [
      ["💌 Escrever uma legenda especial", "ending2"]
    ]
  },
  laugh: {
    icon: "😂",
    title: "Risadas sem motivo",
    text: "A gente ri das cenas, faz comentários bobos e transforma uma noite comum em uma lembrança que vai render muitas piadas internas.",
    choices: [
      ["🥰 Fazer dessa noite uma tradição", "ending3"]
    ]
  },
  romance: {
    icon: "🌹",
    title: "Um romance de verdade",
    text: "O filme termina, mas a vontade de continuar naquele momento permanece. Às vezes, a melhor história é aquela que estamos vivendo.",
    choices: [
      ["💞 Escolher continuar escrevendo nossa história", "ending4"]
    ]
  }
};

const adventureEndings = {
  ending1: "O melhor destino nem sempre aparece no mapa. Às vezes, ele está em uma conversa que gostaríamos que nunca acabasse. ❤️",
  ending2: "Algumas fotos guardam imagens. Outras guardam sentimentos. Essa seria uma daquelas que aquecem o coração. 📸",
  ending3: "Quero muitos dias assim: leves, engraçados e cheios de motivos para sorrir ao seu lado. 🥰",
  ending4: "Nosso romance não precisa de roteiro perfeito. Só quero continuar vivendo os próximos capítulos com você. 💗"
};

function showAdventure() {
  data.adventureEnding = "";
  renderAdventureScene("start");
}

function renderAdventureScene(scene) {
  const s = adventureScenes[scene];

  renderGame("🌹 Nossa aventura", "Uma história em que suas escolhas mudam o caminho.", `
    <div class="adventure-story">
      <div class="story-icon">${s.icon}</div>
      <h3>${s.title}</h3>
      <p>${s.text}</p>
    </div>
    <div class="game-panel" style="margin-top:12px">
      <p style="font-size:11px;text-align:center;color:var(--pink)">O QUE VOCÊ ESCOLHE?</p>
      ${s.choices.map(choice =>
        `<button class="adventure-choice" onclick="chooseAdventure('${choice[1]}')">${choice[0]}</button>`
      ).join("")}
    </div>
  `);
}

function chooseAdventure(choice) {
  if (adventureEndings[choice]) {
    data.adventureEnding = choice;
    saveData();

    renderGame("🌹 Nossa aventura", "O final da nossa história.", `
      <div class="adventure-story">
        <div class="story-icon">💗</div>
        <h3>Um final especial</h3>
        <p>${adventureEndings[choice]}</p>
        <p><strong>Mas nossa história continua...</strong></p>
      </div>
      <button class="primary-btn" onclick="showAdventure()">Viver outra aventura</button>
      <button class="option-btn" onclick="goHome()">Voltar ao nosso cantinho</button>
    `);
    return;
  }

  renderAdventureScene(choice);
}

/* 14 — COFRE SECRETO */

function showVault() {
  if (data.vaultOpened) {
    showVaultSuccess();
    return;
  }

  renderGame("🔐 Cofre secreto", "Há um pequeno segredo esperando por você. Será que consegue descobrir?", `
    <div class="vault-lock">
      <span class="vault-icon">🔒</span>
      <h3>Um segredo de quatro letras</h3>
      <p>Existem coisas que parecem pequenas, mas carregam um significado enorme. Este segredo é uma delas.</p>
      <div class="vault-hint">
        "Quatro sinais guardam uma identidade. Não são números, não formam uma palavra comum. O que importa é aquilo que representam."
      </div>
      <input
        id="vaultPassword"
        class="vault-input"
        type="password"
        maxlength="4"
        autocomplete="off"
        placeholder="••••"
        aria-label="Senha do cofre"
      >
      <button class="primary-btn" onclick="tryVault()">Tentar abrir o cofre</button>
      <div id="vaultFeedback" style="font-size:11px;margin-top:12px;color:var(--pink)"></div>
    </div>
    <div class="vault-hint">
      Uma última reflexão: às vezes, quatro letras conseguem dizer muito mais do que uma frase inteira. ❤️
    </div>
  `);

  const input = $("vaultPassword");
  input.addEventListener("keydown", e => {
    if (e.key === "Enter") tryVault();
  });
}

function tryVault() {
  const input = $("vaultPassword");
  if (!input) return;

  const password = normalize(input.value).replace(/\s/g, "");

  if (password === "ERNF") {
    data.vaultOpened = true;
    saveData();
    showVaultSuccess();
    toast("O segredo foi descoberto! 💗");
    return;
  }

  const feedback = $("vaultFeedback");
  feedback.textContent = "Ainda não... Talvez o segredo esteja mais perto do que parece. Tente novamente. 💭";
  input.value = "";
  input.focus();
}

function showVaultSuccess() {
  renderGame("🔐 O cofre foi aberto!", "Você descobriu o segredo. Agora existe uma mensagem só sua.", `
    <div class="vault-success">
      <div class="big-icon">💖</div>
      <h3>Para Emilly Rayane Nayara Ferreira</h3>
      <p>
        Você conseguiu encontrar o que estava escondido.
        Talvez quatro letras pareçam pouco, mas elas representam alguém
        que tem um espaço enorme na minha vida.
      </p>
      <p>
        Quero que você saiba que é especial, que sua presença transforma
        meus dias e que sou feliz por ter você na minha história.
      </p>
      <p>
        Não importa quantos desafios apareçam pelo caminho,
        quero continuar escolhendo você, cuidando de nós e criando
        lembranças que valham a pena guardar.
      </p>
      <p><strong>Com todo meu carinho. ❤️</strong></p>
      <div style="font-size:28px;margin-top:12px">💗 💗 💗</div>
    </div>
  `);
}

/* INICIALIZAÇÃO */

updateStats();
