const BODY = document.querySelector('.body');
BODY.innerHTML =
  `
<div class="container"></div>
<div class="modal">
<div class="finish">
  <p class="finish__text"></p>
  <div class="finish__btn">OK</div>
</div>
</div>`;

const menuCode = `
<div class="menu">
<p class="menu__title">MineSweeper</p>
<div class="menu__form">
  <div class="menu__element">
    <span class="menu__name">Difficult</span>
      <span class="menu__counter lvl-output">Easy</span>
      <input class="menu__input lvl-input" type="range" min="1" max="3">
  </div>
  <div class="menu__element">
    <span class="menu__name">Bombs</span>
      <span class="menu__counter bombs-output">10</span>
      <input class="menu__input bombs-input" type="range" min="10" max="99">
  </div>
</div>
<div class="menu__button start">New Game</div>
<div class="menu__button save display-none">Continue</div>
</div>`;

const gameCode = `
<div class="game-wrapper">
<div class="panel">
  <div class="panel__stats">
  <div class="timer">Time: 0</div>
  <div class="clicks">Clicks: 0</div>
  </div>
  <div class="panel__buttons">
  <div class="panel__menu-btn save-btn">Save</div>
    <div class="panel__menu-btn restart-btn">Restart</div>
    <div class="panel__menu-btn menu-btn">Menu</div>
  </div>
</div>
<div class="game-field"></div>
</div>
`;

const container = document.querySelector('.container');

const svg = {
  bomb: '<svg class="svg" fill="black" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M459.1 52.4L442.6 6.5C440.7 2.6 436.5 0 432.1 0s-8.5 2.6-10.4 6.5L405.2 52.4l-46 16.8c-4.3 1.6-7.3 5.9-7.2 10.4c0 4.5 3 8.7 7.2 10.2l45.7 16.8 16.8 45.8c1.5 4.4 5.8 7.5 10.4 7.5s8.9-3.1 10.4-7.5l16.5-45.8 45.7-16.8c4.2-1.5 7.2-5.7 7.2-10.2c0-4.6-3-8.9-7.2-10.4L459.1 52.4zm-132.4 53c-12.5-12.5-32.8-12.5-45.3 0l-2.9 2.9C256.5 100.3 232.7 96 208 96C93.1 96 0 189.1 0 304S93.1 512 208 512s208-93.1 208-208c0-24.7-4.3-48.5-12.2-70.5l2.9-2.9c12.5-12.5 12.5-32.8 0-45.3l-80-80zM200 192c-57.4 0-104 46.6-104 104v8c0 8.8-7.2 16-16 16s-16-7.2-16-16v-8c0-75.1 60.9-136 136-136h8c8.8 0 16 7.2 16 16s-7.2 16-16 16h-8z"/></path></svg>',
  flag: '<svg class="svg" fill="darkblue" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 448 512"><!--! Font Awesome Pro 6.4.0 by @fontawesome - https://fontawesome.com License - https://fontawesome.com/license (Commercial License) Copyright 2023 Fonticons, Inc. --><path d="M64 32C64 14.3 49.7 0 32 0S0 14.3 0 32V64 368 480c0 17.7 14.3 32 32 32s32-14.3 32-32V352l64.3-16.1c41.1-10.3 84.6-5.5 122.5 13.4c44.2 22.1 95.5 24.8 141.7 7.4l34.7-13c12.5-4.7 20.8-16.6 20.8-30V66.1c0-23-24.2-38-44.8-27.7l-9.6 4.8c-46.3 23.2-100.8 23.2-147.1 0c-35.1-17.6-75.4-22-113.5-12.5L64 48V32z"></path></svg>',
}

const winSound = new Audio('./audio/win.mp3');
const loseSound = new Audio('./audio/lose.mp3');
const openSound = new Audio('./audio/open.mp3');
const flagSound = new Audio('./audio/flag.mp3');
winSound.volume = 0.1;
loseSound.volume = 0.1;
openSound.volume = 0.1;
flagSound.volume = 0.1;

function startGame(SIZE, BOMBS_COUNT) {
  container.innerHTML = gameCode;

  const gameField = document.querySelector('.game-field');
  const timerInfo = document.querySelector('.timer');
  const clicksInfo = document.querySelector('.clicks');
  const menuBtn = document.querySelector('.menu-btn');
  const restartBtn = document.querySelector('.restart-btn');
  const saveBtn = document.querySelector('.save-btn');
  const modal = document.querySelector('.modal');
  const finishText = document.querySelector('.finish__text');
  const finishBtn = document.querySelector('.finish__btn');
  const cellsCount = SIZE * SIZE;
  let cellsLeft = SIZE * SIZE - BOMBS_COUNT;
  let gameActive = true;
  let secondsCount = 0;
  let clicksCount = 0;
  let memoryClicks = [];
  let memoryFlags = [];
  let timerFlag = 0;

  gameField.innerHTML = '<div class="cell"></div>'.repeat(cellsCount);
  const cells = [...gameField.children];
  let bombsIndex = [];

  if (SIZE === 10) gameField.classList.add('game-easy');
  else if (SIZE === 15) gameField.classList.add('game-medium');
  else if (SIZE === 25) gameField.classList.add('game-hard');

  if (localStorage.getItem('saved') === 'true') {
    let clicks = localStorage.getItem('clicks').split(",");
    let flags = localStorage.getItem('flags').split(",");
    bombsIndex = localStorage.getItem('bombs').split(",").map(Number);
    for (let i of flags) {
      const row = Math.floor(i / SIZE);
      const column = i % SIZE;
      flag(row, column);
    }
    for (let i of clicks) {
      const row = Math.floor(i / SIZE);
      const column = i % SIZE;
      open(row, column);
    }
    secondsCount = Number(localStorage.getItem('secondsCount'));
    timerInfo.innerHTML = 'Time: ' + secondsCount;
    clicksCount = Number(localStorage.getItem('clicksCount'));
    clicksInfo.innerHTML = 'Clicks: ' + clicksCount;

    localStorage.setItem('saved', 'false');
  }

  function saveGame() {
    localStorage.setItem('saved', 'true');
    localStorage.setItem('size', SIZE);
    localStorage.setItem('bombsCount', BOMBS_COUNT);
    localStorage.setItem('bombs', bombsIndex);
    localStorage.setItem('clicks', memoryClicks);
    localStorage.setItem('flags', memoryFlags);
    localStorage.setItem('secondsCount', secondsCount);
    localStorage.setItem('clicksCount', clicksCount);
  }

  function toggleTimer(value) {
    if (value === 'on' &&  timerFlag === 1) {
      timerInfo.innerHTML = 'Time: ' + secondsCount;
      interval = setInterval(() => {
        secondsCount += 1;
        timerInfo.innerHTML = 'Time: ' + secondsCount;
      }, 1000);
    }
    if (value === 'off') clearInterval(interval);
  }

  function randomInRange(min, max) {
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  function plantBomb(targetIndex) {
    if (clicksCount === 1 && bombsIndex.length === 0) {
      let bombsPlanted = 0;
      while (bombsPlanted < BOMBS_COUNT) {
        const rand = randomInRange(0, SIZE * SIZE - 1);
        if (!bombsIndex.includes(rand) && rand !== targetIndex) {
          bombsIndex.push(rand);
          bombsPlanted += 1;
        }
      }
    }
  }

  function validCheck(row, column) {
    return (
      row >= 0 && row < SIZE &&
      column >= 0 && column < SIZE
    )
  }

  function bombCheck(row, column) {
    if (!validCheck(row, column)) return false;
    const index = row * SIZE + column;
    return bombsIndex.includes(index);
  }

  function countCheck(row, column) {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        if (bombCheck(row + i, column + j)) {
          count++;
        }
      }
    }
    return count;
  }

  function open(row, column) {
    if (!gameActive) return false;
    const index = row * SIZE + column;
    const cell = cells[index];

    if (!cell.classList.contains('active')) {
      cell.classList.add('active');
      cellNumber = countCheck(row, column);

      if (bombCheck(row, column)) {
        cell.innerHTML = svg.bomb;
        bombsIndex.forEach(bomb => {
          cells[bomb].innerHTML = svg.bomb;
        })
        cell.style.background = 'blue';
        finishText.innerHTML = 'You lose! Try again!';
        modal.classList.add('modal_active');
        gameActive = false;
        toggleTimer('off');
        localStorage.clear();
        loseSound.play();
      }
      else if (cellNumber > 0) {
        cellsLeft -= 1;
        cell.innerHTML = cellNumber;
        cell.classList.add(`color-${cellNumber}`);
        openSound.play();
      }
      else if (cellNumber === 0) {
        cell.innerHTML = ''
        cellsLeft -= 1;
        for (let i = -1; i <= 1; i++) {
          for (let j = -1; j <= 1; j++) {
            let neighbourIndex = (row + i) * SIZE + column + j;
            if (
              validCheck(row + i, column + j) &&
              !cells[neighbourIndex].classList.contains('active')) {
              open(row + i, column + j);
            }
          }
        }
      }
    }
    if (cellsLeft === 0) {
      finishText.innerHTML = `You Win! <br> Results: ${secondsCount} seconds and ${clicksCount} clicks!`;
      modal.classList.add('modal_active');
      gameActive = false;
      localStorage.clear();
      toggleTimer('off');
      winSound.play();
    }
  }

  function flag(row, column) {
    if (!gameActive) return false;
    const index = row * SIZE + column;
    const cell = cells[index];
    if (!cell.classList.contains('active')) {
      targetIndex = cells.indexOf(cell)
      if (cell.innerHTML !== svg.flag) {
        cell.innerHTML = svg.flag;
        memoryFlags.push(targetIndex);
      }
      else {
        cell.innerHTML = '';
        let flagIndex = memoryFlags.indexOf(targetIndex);
        memoryFlags.splice(flagIndex, 1);
      }
      flagSound.play();
    }
  }

  function cellClick(event) {
    let target = event.target.closest('.cell');
    if (target) {
      const targetIndex = cells.indexOf(target);
      const row = Math.floor(targetIndex / SIZE);
      const column = targetIndex % SIZE;

      if (!target.classList.contains('active')) {
        if (event.button === 0) {
          memoryClicks.push(targetIndex);
        }
        clicksCount += 1;
        clicksInfo.innerHTML = 'Clicks: ' + clicksCount;
      }

      plantBomb(targetIndex);

      if (event.button === 0 && target.innerHTML === '') open(row, column);
      else if (event.button === 2) flag(row, column);

      timerFlag += 1;
      toggleTimer('on');
      saveGame();
      console.log(localStorage.getItem('clicksCount'))
    }
  }

  gameField.addEventListener('mousedown', cellClick);
  gameField.addEventListener("contextmenu", function (event) {
    event.preventDefault();
  });
  menuBtn.addEventListener('click', () => {
    menu();
  })
  restartBtn.addEventListener('click', () => {
    localStorage.clear();
    localStorage.setItem('save', 'false');
    startGame(SIZE, BOMBS_COUNT);
  })
  saveBtn.addEventListener('click', () => {
    saveGame(SIZE);
  })
  finishBtn.addEventListener('click', () => {
    modal.classList.remove('modal_active');
    localStorage.setItem('save', 'false');
  });
}

function menu() {
  container.innerHTML = menuCode;
  const startBtn = document.querySelector('.start');
  const continueBtn = document.querySelector('.save');
  const lvlInput = document.querySelector('.lvl-input');
  const lvlOutput = document.querySelector('.lvl-output');
  const bombsInput = document.querySelector('.bombs-input');
  const bombsOutput = document.querySelector('.bombs-output');

  lvlInput.value = '1';
  bombsInput.value = '10';

  lvlInput.addEventListener('input', () => {
    if (lvlInput.value === '1') lvlOutput.innerHTML = 'Easy';
    else if (lvlInput.value === '2') lvlOutput.innerHTML = 'Medium';
    else if (lvlInput.value === '3') lvlOutput.innerHTML = 'Hard';
  })

  bombsInput.addEventListener('input', () => {
    bombsOutput.innerHTML = bombsInput.value;
  })

  if (localStorage.getItem('saved') === 'true') {
    continueBtn.classList.remove('display-none');
  }

  function continueGame() {
    let SIZE = Number(localStorage.getItem('size'));
    let BOMBS_COUNT = Number(localStorage.getItem('bombsCount'));
    localStorage.setItem('save', 'true');
    startGame(SIZE, BOMBS_COUNT);
  }

  startBtn.addEventListener('click', () => {
    localStorage.clear();
    if (lvlInput.value === '1') size = 10;
    else if (lvlInput.value === '2') size = 15;
    else if (lvlInput.value === '3') size = 25;
    startGame(size, bombsInput.value);
  });
  continueBtn.addEventListener('click', continueGame)
}
menu();

