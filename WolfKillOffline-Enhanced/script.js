// 音效管理器
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

// 动画类
class Animations {
  static fadeIn(el, duration = 500) {
    el.style.opacity = '0';
    el.style.display = 'block';
    setTimeout(() => {
      el.style.transition = `opacity ${duration}ms ease`;
      el.style.opacity = '1';
    }, 10);
  }

  static shake(el) {
    el.style.transform = 'translateX(5px)';
    setTimeout(() => {
      el.style.transform = 'translateX(-5px)';
      setTimeout(() => {
        el.style.transform = 'translateX(0)';
      }, 100);
    }, 100);
  }

  static pulse(el) {
    el.style.transform = 'scale(1.1)';
    setTimeout(() => {
      el.style.transform = 'scale(1)';
    }, 200);
  }

  static floatUp(el) {
    el.style.transform = 'translateY(10px)';
    setTimeout(() => {
      el.style.transform = 'translateY(0)';
    }, 300);
  }
}

// 全局变量
let gameId = '';
let userId = '';
let myRole = '';
let gameData = {};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
  const urlParams = new URLSearchParams(window.location.hash.substring(1));
  gameId = urlParams.get('code') || 'ABC123';
  userId = urlParams.get('id') || Math.random().toString(36).substr(2, 8);

  if (!localStorage.getItem(`game_${gameId}`)) {
    localStorage.setItem(`game_${gameId}`, JSON.stringify({
      phase: 'waiting',
      players: [],
      votes: {},
      killed: null,
      saved: null,
      poisoned: null,
      deadPlayers: [],
      revived: false,
      createdAt: Date.now()
    }));
  }

  const data = JSON.parse(localStorage.getItem(`game_${gameId}`));
  if (!data.players.some(p => p.id === userId)) {
    data.players.push({ id: userId, name: '玩家' + Math.floor(Math.random() * 100), role: '' });
    localStorage.setItem(`game_${gameId}`, JSON.stringify(data));
  }

  if (!data.players.find(p => p.id === userId)?.role) {
    const count = data.players.length;
    const roles = generateRoles(count);
    const role = roles[Math.floor(Math.random() * roles.length)];
    data.players = data.players.map(p => 
      p.id === userId ? { ...p, role } : p
    );
    localStorage.setItem(`game_${gameId}`, JSON.stringify(data));
    myRole = role;
  }

  renderGame();
});

function generateRoles(num) {
  const roles = [];
  const wolfCount = num <= 6 ? 1 : Math.ceil(num / 4);

  for (let i = 0; i < wolfCount; i++) roles.push('狼人');
  for (let i = 0; i < num - wolfCount - 2; i++) roles.push('村民');
  roles.push('预言家');
  roles.push('女巫');
  if (num >= 8) roles.push('猎人');
  if (num >= 9) roles.push('守卫');

  return roles.sort(() => Math.random() - 0.5);
}

function renderGame() {
  const data = JSON.parse(localStorage.getItem(`game_${gameId}`));
  const player = data.players.find(p => p.id === userId);

  document.getElementById('myRole').textContent = player?.role || '未知';

  const phase = data.phase;
  document.getElementById('phaseText').textContent = phase === 'day' ? '🌞 白天' : '🌙 黑夜';

  // 显示玩家列表
  const playerList = document.getElementById('playerList');
  playerList.innerHTML = '';
  data.players.forEach(p => {
    const div = document.createElement('div');
    div.textContent = `${p.name} (${p.role})`;
    playerList.appendChild(div);
  });

  // 切换显示区域
  const speechSection = document.getElementById('speechSection');
  const nightSection = document.getElementById('nightSection');
  const witchActions = document.getElementById('witchActions');
  const hunterActions = document.getElementById('hunterActions');
  const reviveAlert = document.getElementById('reviveAlert');

  if (phase === 'day') {
    speechSection.style.display = 'block';
    nightSection.style.display = 'none';
    witchActions.style.display = 'none';
    hunterActions.style.display = 'none';
    reviveAlert.style.display = 'none';
  } else {
    speechSection.style.display = 'none';
    nightSection.style.display = 'block';
    witchActions.style.display = 'none';
    hunterActions.style.display = 'none';
    reviveAlert.style.display = 'none';

    if (player?.role === '女巫') {
      witchActions.style.display = 'block';
    }
    if (player?.role === '猎人') {
      hunterActions.style.display = 'block';
    }
  }

  // 设置投票目标
  const targetName = document.getElementById('targetName');
  const randomPlayer = data.players[Math.floor(Math.random() * data.players.length)];
  targetName.textContent = randomPlayer.name;

  // 如果被复活
  if (data.revived) {
    reviveAlert.style.display = 'block';
  }

  // 播放阶段音效
  if (phase === 'day') {
    audio.day.play().catch(e => {});
    Animations.fadeIn(document.getElementById('phaseText'));
  } else {
    audio.night.play().catch(e => {});
    Animations.shake(document.getElementById('phaseText'));
  }
}

// 事件绑定
document.getElementById('createBtn')?.addEventListener('click', async () => {
  const count = parseInt(document.getElementById('playerCount').value);
  const code = Math.random().toString(36).substr(2, 6).toUpperCase();

  const data = {
    phase: 'waiting',
    players: [],
    votes: {},
    killed: null,
    saved: null,
    poisoned: null,
    deadPlayers: [],
    revived: false,
    createdAt: Date.now()
  };

  localStorage.setItem(`game_${code}`, JSON.stringify(data));

  window.location.href = `game.html?code=${code}&id=${userId}`;
});

document.getElementById('joinBtn')?.addEventListener('click', () => {
  const code = document.getElementById('gameCode').value.trim().toUpperCase();
  if (!code) return alert('请输入游戏码');
  window.location.href = `game.html?code=${code}&id=${userId}`;
});

// 发言
document.getElementById('speechInput')?.addEventListener('input', () => {
  audio.speak.play().catch(e => {});
});

// 投票
document.getElementById('submitVote')?.addEventListener('click', () => {
  audio.vote.play().catch(e => {});
  Animations.pulse(document.getElementById('submitVote'));
  alert(`你投票给了 ${document.getElementById('targetName').textContent}`);
});

// 女巫救人
document.getElementById('savePlayer')?.addEventListener('click', () => {
  audio.save.play().catch(e => {});
  Animations.floatUp(document.getElementById('savePlayer'));
  alert('你使用了解药救了一个人！');
});

// 女巫投毒
document.getElementById('poisonPlayer')?.addEventListener('click', () => {
  audio.poison.play().catch(e => {});
  Animations.shake(document.getElementById('poisonPlayer'));
  alert('你使用了毒药！');
});

// 猎人开枪
document.getElementById('shootPlayer')?.addEventListener('click', () => {
  audio.shoot.play().catch(e => {});
  Animations.pulse(document.getElementById('shootPlayer'));
  alert('你开枪带走了一个人！');
});

// 复活提示
document.getElementById('reviveAlert')?.addEventListener('click', () => {
  audio.revive.play().catch(e => {});
  Animations.pulse(document.getElementById('reviveAlert'));
});