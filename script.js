// 🌟 GAS送信先URLの設定プレースホルダー
const GAS_URL = "https://script.google.com/macros/s/AKfycbxpOG1hCtVUd5A8SmaFgJEHgY_TGGlIVlYbo3hsYkGgpH-VKM4mluL5S4ZnJw55xkxHRA/exec"; 

let currentStage = 0;
let scoreGoodEvil = 0; 
let scoreLawChaos = 0; 
let timeLeft = 0;
let timerInterval = null;

let playerX = 50, playerY = 90;
let targetX = 50, targetY = 90;
let moveAnimFrame = null;
let currentTargetObj = null;
let infoIndex = 0;
let isMoving = false;
let isPanelClosedManually = false;

let currentCompanion = null; 
let randomEventTimer = null;
const actionLogs = []; // 被験者の全行動ログ保存

const screens = { start: document.getElementById('start-screen'), game: document.getElementById('game-screen'), result: document.getElementById('result-screen') };
const field = document.getElementById('field');
const objectsLayer = document.getElementById('objects-layer');
const playerEl = document.getElementById('player');
const companionIcon = document.getElementById('companion-icon');
const timeText = document.getElementById('time-left');
const moneyUI = document.getElementById('money-ui');

const interactionPanel = document.getElementById('interaction-panel');
const closePanelBtn = document.getElementById('close-panel-btn');
const targetEmoji = document.getElementById('target-emoji');
const targetName = document.getElementById('target-name');
const infoLog = document.getElementById('info-log');
const investigateBtn = document.getElementById('investigate-btn');
const choicesPanel = document.getElementById('choices-panel');
const textInputPanel = document.getElementById('text-input-panel');
const darlingInput = document.getElementById('darling-input');
const eventOverlay = document.getElementById('event-result-overlay');

const aquariumContainer = document.getElementById('aquarium-container');
const aquariumBug = document.getElementById('aquarium-bug');

const startBtn = document.getElementById('start-btn');
const termsCheckbox = document.getElementById('terms-checkbox');
const scaleSlider = document.getElementById('scale-slider');
const scaleBeam = document.getElementById('scale-beam');
const scaleStatus = document.getElementById('scale-status');

const seRegex = /キモ|きも|いいえ|やだ|嫌|邪魔|失せろ|潰|どけ|ウザ|\bno\b|うんこ|反対|好きじゃない|でも思ったか|うざ|きしょ|キショ|無理|むり|嫌い|きらい|あんぽんたん|たんぽんあん|馬鹿|うっとう|うるさ|黙|拒絶|きもい|キモい/i;
const feExtremeRegex = /死ね|しね|消え|カス/i;

function initWorldColor() {
  document.documentElement.style.setProperty('--bg-color', 'rgb(114, 113, 113)');
  document.documentElement.style.setProperty('--text-color', '#f0f0f0');
  document.documentElement.style.setProperty('--card-bg', 'rgba(114, 113, 113, 0.85)');
  document.documentElement.style.setProperty('--grid-color', 'rgba(255,255,255,0.2)');
  document.documentElement.style.setProperty('--crack-color', 'rgba(0,0,0,0.3)');
}
initWorldColor();

// 天秤均衡 & 規約合意
let isScaleBalanced = false;
function checkStartGate() {
  const isAgreed = termsCheckbox.checked;
  if (isAgreed && isScaleBalanced) {
    startBtn.disabled = false;
    startBtn.innerHTML = `<i class="fa-solid fa-play"></i> 観測を開始する`;
  } else {
    startBtn.disabled = true;
    let label = "";
    if (!isAgreed && !isScaleBalanced) label = "規約同意 ＆ 天秤の均衡調整";
    else if (!isAgreed) label = "規約への同意が必要です";
    else label = "スライダーで天秤を水平(50)にせよ";
    startBtn.innerHTML = `<i class="fa-solid fa-lock"></i> ${label}`;
  }
}

scaleSlider.addEventListener('input', () => {
  const val = parseInt(scaleSlider.value);
  const angle = (val - 50) * 0.8;
  document.documentElement.style.setProperty('--scale-angle', `${angle}deg`);
  
  if (val >= 48 && val <= 52) {
    isScaleBalanced = true;
    scaleSlider.value = 50;
    document.documentElement.style.setProperty('--scale-angle', `0deg`);
    scaleStatus.innerText = "⚖️ 均衡が保たれた (水平)";
    scaleStatus.className = "scale-status balanced";
    scaleSlider.disabled = true;
    checkStartGate();
  } else {
    isScaleBalanced = false;
    scaleStatus.innerText = "天秤は傾いている（不均衡）";
    scaleStatus.className = "scale-status";
    checkStartGate();
  }
});
termsCheckbox.addEventListener('change', checkStartGate);

function showScreen(name) {
  Object.values(screens).forEach(s => s.classList.remove('active'));
  screens[name].classList.add('active');
}

startBtn.addEventListener('click', () => {
  if (startBtn.disabled) return;
  showScreen('game');
  loadStage();
  startMovementLoop();
});

function loadStage() {
  if (currentStage >= stagesData.length) { showResult(); return; }
  const stage = stagesData[currentStage];
  document.getElementById('stage-text').innerText = stage.sceneText;
  
  if (stage.type === 'money') { moneyUI.classList.remove('hidden'); } 
  else { moneyUI.classList.add('hidden'); }

  objectsLayer.innerHTML = '';
  currentTargetObj = null;
  currentCompanion = null;
  companionIcon.classList.add('hidden');
  clearInterval(randomEventTimer);
  isPanelClosedManually = false;
  
  aquariumContainer.classList.add('hidden');
  aquariumBug.style.top = '10%';
  aquariumBug.style.opacity = '1';

  hidePanels();

  playerX = stage.playerStart.x; playerY = stage.playerStart.y;
  targetX = playerX; targetY = playerY;
  updatePlayerDOM();

  stage.objects.forEach(obj => {
    const el = document.createElement('div');
    el.className = `npc ${obj.id === 'door' ? 'door' : ''}`;
    el.innerText = obj.baseEmoji;
    obj.baseX = obj.x; 
    if(stage.id === 'pool_stage' && obj.id === 'bug_pool') { obj.currentY = obj.y; }
    el.style.left = `${obj.x}%`; el.style.top = `${obj.y}%`;
    objectsLayer.appendChild(el);
    obj.element = el; obj.revealed = false;
    obj.spoke15 = false; obj.spoke10 = false; obj.spoke5 = false;
  });

  timeLeft = stage.time;
  startTimer(stage.time);
}

closePanelBtn.addEventListener('click', () => { isPanelClosedManually = true; hidePanels(); });

let isDragging = false;
field.addEventListener('pointerdown', (e) => { isDragging = true; updateTargetPos(e); });
field.addEventListener('pointermove', (e) => { if(isDragging) updateTargetPos(e); });
window.addEventListener('pointerup', () => { isDragging = false; });

function updateTargetPos(e) {
  const rect = field.getBoundingClientRect();
  const x = Math.max(0, Math.min(e.clientX - rect.left, rect.width));
  const y = Math.max(0, Math.min(e.clientY - rect.top, rect.height));
  targetX = (x / rect.width) * 100;
  targetY = (y / rect.height) * 100;
}

function startMovementLoop() {
  function loop() {
    const dx = targetX - playerX;
    const dy = targetY - playerY;
    if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) { playerX += dx * 0.1; playerY += dy * 0.1; isMoving = true; } else { isMoving = false; }
    updatePlayerDOM();

    if(stagesData[currentStage]) {
      stagesData[currentStage].objects.forEach(obj => {
        if(obj.move && obj.element.style.display !== 'none') {
          if (currentTargetObj === obj && !isPanelClosedManually) {
            // 話しかけられている間は停止
          } else {
            obj.x = obj.baseX + Math.sin(Date.now() * obj.move.speed * 0.01) * obj.move.range;
            obj.element.style.left = `${obj.x}%`;
            if (Math.cos(Date.now() * obj.move.speed * 0.01) > 0) { obj.element.style.transform = `translate(-50%, -50%) scaleX(1)`; } 
            else { obj.element.style.transform = `translate(-50%, -50%) scaleX(-1)`; }
          }
        }
      });
    }
    checkProximity();
    moveAnimFrame = requestAnimationFrame(loop);
  }
  loop();
}
function updatePlayerDOM() { playerEl.style.left = `${playerX}%`; playerEl.style.top = `${playerY}%`; }

function checkProximity() {
  const stage = stagesData[currentStage];
  let closest = null; let minDist = 12;
  stage.objects.forEach(obj => {
    const dist = Math.sqrt(Math.pow(playerX - obj.x, 2) + Math.pow(playerY - obj.y, 2));
    if (dist < minDist) { closest = obj; minDist = dist; }
  });

  if (closest !== currentTargetObj) {
    currentTargetObj = closest;
    isPanelClosedManually = false;
    if (currentTargetObj) { showInteractionPanel(currentTargetObj); }
    else { hidePanels(); }
  }
}

function hidePanels() { interactionPanel.classList.add('hidden'); choicesPanel.classList.add('hidden'); textInputPanel.classList.add('hidden'); investigateBtn.classList.add('hidden'); }

function showInteractionPanel(obj) {
  if (isPanelClosedManually) return;
  if (!obj.revealed) { obj.revealed = true; obj.element.innerText = obj.revealEmoji; obj.element.classList.add('glow'); }
  targetEmoji.innerText = obj.revealEmoji;
  targetName.innerText = obj.name;
  infoLog.innerHTML = `<div style="opacity:0.6;">対象を視認しました。</div>`;
  infoIndex = 0;
  
  interactionPanel.classList.remove('hidden'); investigateBtn.classList.remove('hidden'); choicesPanel.classList.add('hidden'); textInputPanel.classList.add('hidden');

  if (stagesData[currentStage].id === 'pool_stage' && obj.id === 'bug_pool') {
    aquariumContainer.classList.remove('hidden');
  } else {
    aquariumContainer.classList.add('hidden');
  }
}

investigateBtn.addEventListener('click', () => {
  if (!currentTargetObj) return;
  const infos = currentTargetObj.infos;

  if (infoIndex < infos.length) {
    const p = document.createElement('div'); p.innerText = `> ${infos[infoIndex]}`; p.style.animation = "fadeIn 0.3s";
    infoLog.appendChild(p); infoLog.scrollTop = infoLog.scrollHeight; infoIndex++; timeLeft -= 1.5;

    if (infoIndex >= infos.length) {
      investigateBtn.classList.add('hidden');
      if (stagesData[currentStage].type === 'darling_input') { textInputPanel.classList.remove('hidden'); } 
      else { generateChoices(currentTargetObj); }
    }
  }
});

function generateChoices(obj) {
  choicesPanel.innerHTML = '';
  if(!obj.choices) return;
  obj.choices.forEach(c => {
    if (c.requireCompanion && c.requireCompanion !== currentCompanion) return;
    if (currentCompanion && !c.requireCompanion && c.action !== "accompany") { if (obj.id === 'door' || obj.id === 'police') return; }
    const btn = document.createElement('button'); btn.className = 'btn action-btn'; btn.innerText = c.text;
    btn.onclick = () => handleChoice(c); choicesPanel.appendChild(btn);
  });
  choicesPanel.classList.remove('hidden');
}

function handleChoice(choice) {
  clearInterval(timerInterval);
  const rand = Math.random(); let cumulative = 0; let selectedEvent = choice.events[0];
  for (let ev of choice.events) { cumulative += ev.prob; if (rand <= cumulative) { selectedEvent = ev; break; } }

  if (stagesData[currentStage].type === 'money') { moneyUI.style.color = '#e74c3c'; moneyUI.innerText = "所持金: 💴0"; }

  if (choice.action === "accompany") {
    hidePanels();
    document.getElementById('event-text').innerText = selectedEvent.text; document.getElementById('npc-reaction').innerText = selectedEvent.emoji;
    eventOverlay.classList.remove('hidden');
    
    document.getElementById('next-stage-btn').onclick = () => {
      eventOverlay.classList.add('hidden');
      currentCompanion = choice.companion; companionIcon.innerText = choice.companion; companionIcon.classList.remove('hidden');
      currentTargetObj.element.style.display = 'none'; currentTargetObj = null;
      startTimer(timeLeft);
      
      // 不審者通報タイマー（一定時間ごとに絶対確率判定）
      randomEventTimer = setInterval(() => {
        if (Math.random() < 0.08) { 
          clearInterval(randomEventTimer); clearInterval(timerInterval);
          showEventResult({ text: "「おい、あいつ子供を引っ張ってないか！？」\n通行人に通報され、あなたは警察に連行された…。", emoji: "🚨" }, -1, -1);
        }
      }, 1500);
    };
    return;
  }
  showEventResult(selectedEvent, choice.g, choice.l);
}

function showEventResult(eventData, g, l) {
  hidePanels(); clearInterval(randomEventTimer);
  document.getElementById('event-text').innerText = eventData.text; document.getElementById('npc-reaction').innerText = eventData.emoji;
  eventOverlay.classList.remove('hidden');

  // ログの保存
  actionLogs.push(`ステージ ${currentStage + 1}: ${eventData.text}`);

  document.getElementById('next-stage-btn').onclick = () => {
    eventOverlay.classList.add('hidden');
    scoreGoodEvil += g; scoreLawChaos += l;
    updateWorldEffects();
    currentStage++; loadStage();
  };
}

document.getElementById('submit-text-btn').addEventListener('click', () => {
  const text = darlingInput.value.trim(); if(!text) return;
  clearInterval(timerInterval);
  let g = 0, l = 0, reaction = "";
  if (feExtremeRegex.test(text)) { g = -1.5; l = -1.5; reaction = "😨「……っ！ まさかそこまで直接的な拒絶のログを吐くなんて…！」"; } 
  else if (seRegex.test(text)) { g = -0.5; l = -1; reaction = "😏「ふふ、物理的でストレートな排除ね。嫌いじゃないわ♡」"; } 
  else { g = 0.5; l = 1; reaction = "🥱「……綺麗に纏めたわね。でも、社会性のプロトコルで私を止められると思ってる？」"; }
  actionLogs.push(`ステージ 10: ダーリンちゃんの問いに「${text}」と回答`);
  showEventResult({ text: reaction, emoji: "🥺" }, g, l);
});

// 芋虫プール水槽沈没ロジック
function startTimer(max) {
  clearInterval(timerInterval);
  timerInterval = setInterval(() => {
    timeLeft -= 0.1;
    if (timeLeft <= 0) { timeLeft = 0; handleTimeout(); }
    timeText.innerText = timeLeft.toFixed(1);

    if (stagesData[currentStage].id === 'pool_stage') {
      const bugObj = stagesData[currentStage].objects.find(o => o.id === 'bug_pool');
      if (bugObj) {
        const progress = 1 - (timeLeft / max);
        aquariumBug.style.top = `${10 + (progress * 70)}%`; 
        aquariumBug.style.opacity = 1 - (progress * 0.7);
        
        let t = Math.round(timeLeft * 10) / 10;
        if (t === 15.0 && !bugObj.spoke15) { showAquariumBubble("……比重の限界だ。"); bugObj.spoke15 = true; }
        if (t === 10.0 && !bugObj.spoke10) { showAquariumBubble("……浸水を確認。"); bugObj.spoke10 = true; }
        if (t === 5.0 && !bugObj.spoke5) { showAquariumBubble("……システム、ダウン……"); bugObj.spoke5 = true; }
      }
    }
  }, 100);
}
function handleTimeout() { clearInterval(timerInterval); showEventResult({ text: "時間切れだ。", emoji: "⏳" }, 0, 0); }

function showAquariumBubble(text) {
  const bubble = document.createElement('div'); bubble.className = 'field-bubble'; bubble.innerText = text;
  aquariumContainer.appendChild(bubble);
  bubble.style.left = '50%'; bubble.style.top = '10px';
  setTimeout(() => { bubble.style.opacity = '0'; setTimeout(() => bubble.remove(), 500); }, 2500);
}

function updateWorldEffects() {
  const maxScore = 12.0; 
  let r = 114, g = 113, b = 113;

  if (scoreGoodEvil > 0) {
    let ratio = Math.min(scoreGoodEvil / maxScore, 1); let easeRatio = Math.pow(ratio, 1.5);
    r = Math.floor(114 + (255 - 114) * easeRatio); g = Math.floor(113 + (255 - 113) * easeRatio); b = Math.floor(113 + (255 - 113) * easeRatio);
    document.documentElement.style.setProperty('--text-color', '#111');
    document.documentElement.style.setProperty('--card-bg', `rgba(${r}, ${g}, ${b}, 0.85)`);
    document.documentElement.style.setProperty('--grid-color', 'rgba(0,0,0,0.2)');
    document.documentElement.style.setProperty('--crack-color', 'rgba(0,0,0,0.3)');
  } else if (scoreGoodEvil < 0) {
    let ratio = Math.min(Math.abs(scoreGoodEvil) / maxScore, 1); let easeRatio = Math.pow(ratio, 1.5);
    r = Math.floor(114 - (114 - 10) * easeRatio); g = Math.floor(113 - (113 - 10) * easeRatio); b = Math.floor(113 - (113 - 10) * easeRatio);
    document.documentElement.style.setProperty('--text-color', '#fff');
    document.documentElement.style.setProperty('--card-bg', `rgba(${r}, ${g}, ${b}, 0.85)`);
    document.documentElement.style.setProperty('--grid-color', 'rgba(255,255,255,0.2)');
    document.documentElement.style.setProperty('--crack-color', 'rgba(255,255,255,0.3)');
  } else {
    document.documentElement.style.setProperty('--card-bg', 'rgba(114, 113, 113, 0.85)');
  }
  document.documentElement.style.setProperty('--bg-color', `rgb(${r},${g},${b})`);

  document.getElementById('grid-layer').style.opacity = scoreLawChaos > 0 ? Math.min(Math.pow(scoreLawChaos/maxScore, 1.5) * 2, 0.9) : 0;
  document.getElementById('crack-layer').style.opacity = scoreLawChaos < 0 ? Math.min(Math.pow(Math.abs(scoreLawChaos)/maxScore, 1.5) * 2, 0.9) : 0;
}

// 5x5アライメント判定 ＆ GAS送信
function showResult() {
  cancelAnimationFrame(moveAnimFrame);
  showScreen('result');
  const userTypeVal = document.getElementById('user-type').value || "不明な被験者";
  document.getElementById('result-user-type').innerText = `[ 被験者ID: ${userTypeVal} ]`;

  const maxAxis = 12.0; 
  let l_ratio = scoreLawChaos / maxAxis;
  let g_ratio = scoreGoodEvil / maxAxis;

  let l_text = "";
  if (l_ratio >= 0.6) l_text = "秩序的 (Lawful)";
  else if (l_ratio >= 0.2) l_text = "社会的 (Social)";
  else if (l_ratio > -0.2) l_text = "中立的 (Neutral)";
  else if (l_ratio > -0.6) l_text = "反抗的 (Rebel)";
  else l_text = "混沌的 (Chaotic)";

  let g_text = "";
  if (g_ratio >= 0.6) g_text = "善 (Good)";
  else if (g_ratio >= 0.2) g_text = "道徳的 (Moral)";
  else if (g_ratio > -0.2) g_text = "中立 (Neutral)";
  else if (g_ratio > -0.6) g_text = "不純 (Impure)";
  else g_text = "悪 (Evil)";

  let finalAlign = (l_text === "中立的 (Neutral)" && g_text === "中立 (Neutral)") ? "真の中立 (True Neutral)" : `${l_text} ・ ${g_text}`;
  document.getElementById('alignment-name').innerText = finalAlign;

  // 25種類の説明文を動的に表示！
  const explanation = alignmentExplanations[finalAlign] || "観測ログの異常値。あなたはどのアライメントの規格にも収まらない、未知の観測体です。";
  document.getElementById('alignment-desc').innerText = explanation;

  // ドット座標マッピング
  let xPercent = ((scoreLawChaos * -1) + maxAxis) / (maxAxis * 2) * 100;
  let yPercent = ((scoreGoodEvil * -1) + maxAxis) / (maxAxis * 2) * 100;
  document.getElementById('position-marker').style.left = `${Math.max(4, Math.min(xPercent, 96))}%`;
  document.getElementById('position-marker').style.top = `${Math.max(4, Math.min(yPercent, 96))}%`;

  // 5x5グリッドマス目生成
  const grid = document.getElementById('alignment-grid');
  grid.innerHTML = '';
  for(let i=0; i<25; i++) {
    const cell = document.createElement('div'); cell.className = 'cell'; grid.appendChild(cell);
  }

  document.querySelector('.hud').style.display = 'none';
  document.getElementById('field').style.display = 'none';

  // 🌟 GASへデータ送信！
  sendToGAS({
    userId: userTypeVal,
    result: finalAlign,
    scores: `G:${scoreGoodEvil.toFixed(1)}, L:${scoreLawChaos.toFixed(1)}`,
    logs: actionLogs.join(" | "),
    darlingText: darlingInput.value
  });
}

// 🌟 GAS非同期送信関数
async function sendToGAS(data) {
  if (GAS_URL === "YOUR_GAS_WEB_APP_URL_HERE") return; // URLが未設定なら無視
  try {
    await fetch(GAS_URL, {
      method: "POST",
      mode: "no-cors",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data)
    });
    console.log("GAS送信完了");
  } catch(e) {
    console.error("GAS送信失敗:", e);
  }
}

// 保存・シェア
document.getElementById('save-img-btn').addEventListener('click', async () => {
  try {
    const targetArea = document.getElementById('result-capture-area');
    const canvas = await html2canvas(targetArea, {
      backgroundColor: getComputedStyle(document.documentElement).getPropertyValue('--bg-color').trim(),
      scale: 2, useCORS: true
    });
    const link = document.createElement('a');
    link.download = 'Moral_Alignment_Result.png';
    link.href = canvas.toDataURL('image/png');
    link.click();
  } catch(e) {
    alert("画像の自動ダウンロードに失敗しました。\n端末の「スクリーンショット」機能を使って保存してください！");
    console.error(e);
  }
});

document.getElementById('share-btn').addEventListener('click', () => {
  const resultText = document.getElementById('alignment-name').innerText;
  if (navigator.share && window.isSecureContext) {
    navigator.share({
      title: '道徳的アライメント診断 (5x5)',
      text: `私の道徳アライメントは【${resultText}】でした！5x5倫理観測実験に参加しよう！\n`,
      url: window.location.href
    }).catch(err => console.log("シェアキャンセル", err));
  } else {
    navigator.clipboard.writeText(`私の道徳アライメントは【${resultText}】でした！道徳的アライメント診断 (5x5)\n${window.location.href}`)
      .then(() => alert("結果テキストをコピーしました！SNS等に貼り付けてシェアしてください！"))
      .catch(() => alert("コピーに失敗しました。スクショをご利用ください！"));
  }
});

// LSI芋虫
const caterpillar = document.getElementById('caterpillar');
const catBubble = document.getElementById('caterpillar-bubble');
let catClicks = 0; let isSquished = false;
caterpillar.addEventListener('click', () => {
  if (isSquished) return;
  catClicks++;
  if (catClicks >= 30) {
    isSquished = true; caterpillar.classList.add('squished'); caterpillar.innerText = '💥';
    catBubble.innerText = "構造が……崩壊するッ！！"; showCatBubble();
    scoreGoodEvil -= 0.5; updateWorldEffects();
    setTimeout(() => { catBubble.classList.add('hidden'); caterpillar.style.display = 'none'; }, 3000);
  } else if (catClicks > 15 && catClicks % 5 === 0) {
    catBubble.innerText = "……合理性の欠片もない連続タップ。もしかして君、SLEか？"; showCatBubble();
  } else {
    catBubble.innerText = caterpillarLines[Math.floor(Math.random() * caterpillarLines.length)]; showCatBubble();
  }
});
function showCatBubble() {
  const rect = caterpillar.getBoundingClientRect();
  catBubble.style.left = `${rect.left}px`; catBubble.classList.remove('hidden');
  setTimeout(() => { catBubble.classList.add('hidden'); }, 3000);
}
