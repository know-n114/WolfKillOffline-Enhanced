// 全局变量
let userId = '';
let gameId = '';

// 音效加载
const audio = {
  night: new Audio('audio/night.mp3'),
  day: new Audio('audio/day.mp3'),
  speak: new Audio('audio/speak.mp3'),
  vote: new Audio('audio/vote.mp3'),
  save: new Audio('audio/save.mp3'),
  poison: new Audio('audio/poison.mp3'),
  shoot: new Audio('audio/shoot.mp3'),
  revive: new Audio('audio/revive.mp3')
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.search);
  gameId = urlParams.get('code');
  userId = urlParams.get('id');

  if (gameId && userId) {
    // 进入游戏页面
    const data = JSON.parse(localStorage.getItem(`game_${gameId}`));
    if (!data) {
      alert("游戏已过期或不存在！");
      window.location.href = 'index.html';
      return;
    }

    renderGame();
  } else {
    // 进入创建页
    initCreatePage();
  }
});

function initCreatePage() {
  document.getElementById('createBtn')?.addEventListener('click', async () => {
    const count = parseInt(document.getElementById('playerCount').value);
    const code = Math.random().toString(36).substr(2, 6).toUpperCase();
    const hostId = 'HOST_' + Date.now();

    const data = {
      phase: 'waiting',
      players: [],
      votes: {},
      killed: null,
      saved: null,
      poisoned: null,
      deadPlayers: [],
      revived: false,
      createdAt: Date.now(),
      hostId: hostId,
      totalPlayers: count,
      currentPlayers: 0
    };

    localStorage.setItem(`game_${code}`, JSON.stringify(data));

    document.getElementById('hostPanel').style.display = 'block';
    document.getElementById('currentPlayers').textContent = '0';
    document.getElementById('totalPlayers').textContent = count;

    userId = hostId;
    window.location.href = `game.html?code=${code}&id=${hostId}`;
  });

  document.getElementById('joinBtn')?.addEventListener('click', () => {
    const code = document.getElementById('gameCode').value.trim();
    if (!code) return alert("请输入游戏码！");
    
    const data = JSON.parse(localStorage.getItem(`game_${code}`));
    if (!data) return alert("游戏不存在或已过期！");
    
    const id = 'PLAYER_' + Date.now();
    userId = id;
    
    window.location.href = `game.html?code=${code}&id=${id}`;
  });
}

function renderGame() {
  const data = JSON.parse(localStorage.getItem(`game_${gameId}`));
  const player = data.players.find(p => p.id === userId);

  // 显示游戏码
  document.getElementById('gameCodeDisplay').textContent = gameId;

  // 显示身份
  document.getElementById('yourRole').textContent = player ? player.role : '未知';

  // 显示阶段
  document.getElementById('phaseDisplay').textContent = getPhaseText(data.phase);

  // 更新人数
  const currentPlayers = document.getElementById('currentPlayers');
  if (currentPlayers) {
    currentPlayers.textContent = data.players.length;
  }

  // 如果是房主，显示控制面板
  if (data.hostId === userId) {
    document.getElementById('hostPanel').style.display = 'block';
    document.getElementById('startGameBtn').style.display = 'block';
  } else {
    document.getElementById('hostPanel').style.display = 'none';
  }

  // 根据阶段显示不同内容
  showPhaseContent(data);
}

function getPhaseText(phase) {
  switch (phase) {
    case 'waiting': return '等待开始';
    case 'night': return '夜晚';
    case 'day': return '白天';
    case 'end': return '游戏结束';
    default: return '未知';
  }
}

function showPhaseContent(data) {
  const voteSection = document.getElementById('voteSection');
  const actionSection = document.getElementById('actionSection');
  const resultSection = document.getElementById('resultSection');
  const nextPhaseBtn = document.getElementById('nextPhaseBtn');

  voteSection.style.display = 'none';
  actionSection.style.display = 'none';
  resultSection.style.display = 'none';
  nextPhaseBtn.style.display = 'none';

  if (data.phase === 'waiting') {
    if (data.hostId === userId) {
      document.getElementById('startGameBtn').style.display = 'block';
    }
  } else if (data.phase === 'night') {
    actionSection.style.display = 'block';
    document.getElementById('saveBtn').style.display = 'inline-block';
    document.getElementById('poisonBtn').style.display = 'inline-block';
    document.getElementById('shootBtn').style.display = 'inline-block';
    document.getElementById('reviveBtn').style.display = 'inline-block';
  } else if (data.phase === 'day') {
    voteSection.style.display = 'block';
    renderPlayersList();
  } else if (data.phase === 'end') {
    resultSection.style.display = 'block';
    document.getElementById('resultText').textContent = "游戏结束！";
    nextPhaseBtn.style.display = 'block';
  }
}

function renderPlayersList() {
  const container = document.getElementById('playersList');
  container.innerHTML = '';

  const data = JSON.parse(localStorage.getItem(`game_${gameId}`));
  const players = data.players.filter(p => !p.dead);

  players.forEach(player => {
    const btn = document.createElement('button');
    btn.className = 'player-btn';
    btn.textContent = player.name;
    btn.onclick = () => {
      const selected = document.querySelectorAll('.player-btn.selected');
      selected.forEach(b => b.classList.remove('selected'));
      btn.classList.add('selected');
      localStorage.setItem(`selected_vote_${gameId}_${userId}`, player.id);
    };
    container.appendChild(btn);
  });
}

document.getElementById('startGameBtn')?.addEventListener('click', () => {
  const data = JSON.parse(localStorage.getItem(`game_${gameId}`));
  if (data.hostId !== userId) return alert("只有房主才能开始游戏！");
  
  data.phase = 'night';
  data.currentPlayers = data.players.length;
  localStorage.setItem(`game_${gameId}`, JSON.stringify(data));

  audio.night.play().catch(e => {});
  window.location.reload();
});

document.getElementById('submitVoteBtn')?.addEventListener('click', () => {
  const data = JSON.parse(localStorage.getItem(`game_${gameId}`));
  const selected = localStorage.getItem(`selected_vote_${gameId}_${userId}`);
  if (!selected) return alert("请先选择一个玩家！");

  data.votes[userId] = selected;
  localStorage.setItem(`game_${gameId}`, JSON.stringify(data));

  audio.vote.play().catch(e => {});
  alert("投票成功！");
});