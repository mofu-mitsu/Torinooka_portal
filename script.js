const GAS_URL = "https://script.google.com/macros/s/AKfycbzGgLL_IKfl61Z-1EVnJMtnfGDZ0lEmRWN8xwNKpD2S5nQGbTRufsKs-5v4-b7Vvq4g/exec";

document.addEventListener('DOMContentLoaded', () => {

    // 全データからクラス名のリストを生成
    const classList = [...new Set(schoolData.characters.map(c => c.class))].sort();
    if (document.getElementById('story-list')) {
        loadStories();
    }
    // --- HOME（index.html）の初期化 ---
    if (document.getElementById('school-philosophy')) {
        document.getElementById('school-philosophy').innerText = schoolData.info.philosophy;
        document.getElementById('school-concept').innerText = schoolData.info.concept;
        
        renderVoteClassButtons(classList); // 投票ボタン生成
        initLetterClassSelect(classList);  // 【重要】お手紙のクラス選択を初期化
        showTodayPickup();
        loadReplies();
        loadRanking();
    }

    // --- 生徒名簿（chara.html）の初期化 ---
    if (document.getElementById('char-grid')) {
        renderClassFilters(classList); 
        renderCharacters('all');
    }
});

function initLetterClassSelect(classList) {
    const classSelect = document.getElementById('letter-class-select');
    if (!classSelect) return;
    
    classSelect.innerHTML = '<option value="">クラスを選択</option>';
    classList.forEach(className => {
        const opt = document.createElement('option');
        opt.value = className;
        opt.innerText = className;
        classSelect.appendChild(opt);
    });
    
    // 2段階目の宛先リストをリセットしておく
    const charSelect = document.getElementById('letter-to');
    if (charSelect) charSelect.innerHTML = '<option value="">先にクラスを選んでね</option>';
}
let allStories = []; // 全ストーリーを保持する変数

// --- ストーリー投稿フォームの表示切り替え ---
function toggleStoryForm() {
    const form = document.getElementById('story-form-area');
    form.style.display = form.style.display === 'none' ? 'block' : 'none';
}

// --- ストーリーをGASへ送信 ---
async function sendStory() {
    const title = document.getElementById('story-title').value;
    const stage = document.getElementById('story-stage').value;
    const chars = document.getElementById('story-chars').value;
    const tag = document.getElementById('story-tag').value;
    const content = document.getElementById('story-content').value;

    if (!title || !content) return alert("タイトルと内容は必須だゾ！");

    showToast("物語を紡いでいます...");
    
    const data = { type: "story", title, stage, chars, tag, content };

    try {
        await fetch(GAS_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(data) });
        showToast("投稿完了！ページを更新して確認してね。");
        toggleStoryForm();
        loadStories(); // 再読み込み
    } catch (e) {
        showToast("エラーで投稿できなかったゾ...");
    }
}

// --- ストーリーの読み込み ---
async function loadStories() {
    const list = document.getElementById('story-list');
    if (!list) return;
    toggleLoading('story-list', true);

    try {
        const response = await fetch(GAS_URL + "?type=stories");
        allStories = await response.json();
        renderStoryCards(allStories);
    } catch (e) {
        list.innerHTML = "<p>物語の読み込みに失敗しました。</p>";
    }
}

// --- カードの描画 ---
function renderStoryCards(stories) {
    const list = document.getElementById('story-list');
    list.innerHTML = '';

    stories.forEach(s => {
        const card = document.createElement('div');
        card.className = `story-card tag-${s.tag}`; // タグごとにクラスをつける
        card.innerHTML = `
            <div class="story-header">
                <span class="story-tag">${s.tag}</span>
                <span class="story-stage">${s.stage}</span>
            </div>
            <h3>${s.title}</h3>
            <p class="story-chars"><i class="fas fa-users"></i> ${s.chars}</p>
            <div class="story-preview">${s.content.substring(0, 50)}...</div>
            <button onclick="openStoryModal('${s.title}')" class="read-more">続きを読む</button>
        `;
        list.appendChild(card);
    });
}

// タグでフィルタリング
function filterStories(tagName) {
    const filtered = tagName === 'all' ? allStories : allStories.filter(s => s.tag === tagName);
    renderStoryCards(filtered);
}



function updateLetterCharSelect() {
    const className = document.getElementById('letter-class-select').value;
    const charSelect = document.getElementById('letter-to');
    if (!charSelect) return;

    charSelect.innerHTML = '<option value="">生徒を選択</option>';
    
    if (!className) {
        charSelect.innerHTML = '<option value="">先にクラスを選んでね</option>';
        return;
    }

    // 選ばれたクラスの生徒だけを抽出
    const filtered = schoolData.characters.filter(c => c.class === className);
    filtered.forEach(c => {
        const opt = document.createElement('option');
        opt.value = c.id;
        opt.dataset.name = c.name;
        opt.dataset.class = c.class;
        opt.innerText = c.name;
        charSelect.appendChild(opt);
    });
}

function renderClassFilters(classList) {
    const filterArea = document.querySelector('.filter-tabs');
    if (!filterArea) return;
    filterArea.innerHTML = `<button class="filter-btn active" onclick="renderCharacters('all')">全校生徒</button>`;
    classList.forEach(className => {
        const btn = document.createElement('button');
        btn.className = "filter-btn";
        btn.innerText = className;
        btn.onclick = () => renderCharactersByClass(className);
        filterArea.appendChild(btn);
    });
}

// --- トースト通知機能 ---
function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        document.body.appendChild(container);
    }
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerText = message;
    container.appendChild(toast);
    setTimeout(() => { toast.style.opacity = '0'; setTimeout(() => toast.remove(), 500); }, 3000);
}

// --- ローディング表示 ---
function toggleLoading(elementId, show) {
    const el = document.getElementById(elementId);
    if (!el) return;
    if (show) {
        el.innerHTML = '<div class="loading-spinner"></div>';
    }
}
function renderVoteClassButtons(classList) {
    const area = document.getElementById('quick-vote-area');
    if (!area) return;
    area.innerHTML = '<p class="small-title"><i class="fas fa-search"></i> クラスを選んで投票：</p>';
    
    const btnContainer = document.createElement('div');
    btnContainer.className = 'vote-class-tabs';

    classList.forEach(className => {
        const btn = document.createElement('button');
        btn.className = 'class-pill';
        btn.innerText = className;
        btn.onclick = (e) => {
            document.querySelectorAll('.class-pill').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            showVoteCharsByClass(className);
        };
        btnContainer.appendChild(btn);
    });
    area.appendChild(btnContainer);
    
    const charArea = document.createElement('div');
    charArea.id = 'vote-char-display';
    charArea.className = 'vote-scroll-container';
    // 初期メッセージを表示
    charArea.innerHTML = '<p class="placeholder-text">上のクラスボタンを押してね！</p>';
    area.appendChild(charArea);
    
    // 【修正】showVoteCharsByClass(classList[0]) を消しました。
}


function showVoteCharsByClass(className) {
    const display = document.getElementById('vote-char-display');
    display.innerHTML = '';
    const filtered = schoolData.characters.filter(c => c.class === className);
    
    filtered.forEach(c => {
        const card = document.createElement('div');
        card.className = 'vote-mini-card';
        card.innerHTML = `
            <img src="img/${c.img}" onerror="this.src='https://via.placeholder.com/70?text=bird'">
            <span>${c.name}</span>
            <button class="vote-btn-heart" onclick="sendVote('${c.id}', '${c.name}')">
                <i class="fas fa-heart"></i>
            </button>
        `;
        display.appendChild(card);
    });
}

async function loadRanking() {
    const rankingArea = document.getElementById('ranking-display');
    if (!rankingArea) return;
    toggleLoading('ranking-display', true);

    try {
        const response = await fetch(GAS_URL + "?type=ranking");
        const ranking = await response.json();
        
        rankingArea.innerHTML = ''; // ローディング消去
        if (ranking.length === 0) {
            rankingArea.innerHTML = "<p>今月の集計はまだありません。</p>";
            return;
        }

        rankingArea.innerHTML = ranking.map((r, i) => `
            <div class="ranking-item">
                <span class="rank-num">${i + 1}</span>
                <span class="rank-name">${r.name}</span>
                <span class="rank-count">${r.count} 票</span>
            </div>
        `).join('');
    } catch (e) {
        rankingArea.innerHTML = "<p>ランキング取得に失敗しました</p>";
    }
}

// --- クラス分けラベル（H1-1, H1-2...）を自動生成 ---
function renderClassFilters() {
    const filterArea = document.querySelector('.filter-tabs');
    if (!filterArea) return;

    // データにあるクラス名を重複なく取り出す
    const classes = [...new Set(schoolData.characters.map(c => c.class))].sort();
    
    filterArea.innerHTML = `<button class="filter-btn active" onclick="renderCharacters('all')">全校生徒</button>`;
    
    classes.forEach(className => {
        const btn = document.createElement('button');
        btn.className = "filter-btn";
        btn.innerText = className;
        btn.onclick = () => renderCharactersByClass(className);
        filterArea.appendChild(btn);
    });
}
function renderCharactersByClass(className) {
    const grid = document.getElementById('char-grid');
    grid.innerHTML = '';
    const filtered = schoolData.characters.filter(c => c.class === className);
    filtered.forEach(c => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.onclick = () => showProfile(c.id);
        card.innerHTML = `
            <img src="img/${c.img}" onerror="this.src='https://via.placeholder.com/150?text=Student'">
            <h4>${c.name}</h4>
            <small>${c.motif}</small>
        `;
        grid.appendChild(card);
    });
}
async function loadReplies() {
    const replyArea = document.getElementById('reply-display');
    if (!replyArea) return;

    try {
        // GASのURLに?type=stories などをつけずにそのままfetch
        const response = await fetch(GAS_URL);
        const replies = await response.json();
        
        if (replies.length === 0) {
            replyArea.innerHTML = "<p style='text-align:center;'>まだお返事はありません。</p>";
            return;
        }

        replyArea.innerHTML = replies.map(r => `
            <div class="reply-card">
                <div class="reply-header">
                    <span class="to-name">To: ${r.toName} 様</span>
                    <span class="reply-date">${new Date(r.date).toLocaleDateString()}</span>
                </div>
                <div class="user-msg">「${r.content}」</div>
                <div class="char-reply">
                    <strong>お返事：</strong><br>
                    ${r.reply.replace(/\n/g, '<br>')} <!-- ←ここで改行をHTMLに変換！ -->
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error("お返事の読み込み失敗", e);
    }
}

// --- 今日のとり表示 ---
function showTodayPickup() {
    const display = document.getElementById('random-char-display');
    if (!display) return;

    // 今日の日付（YYYY-MM-DD）を取得
    const today = new Date();
    const dateStr = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
    
    // 日付から数字（シード値）を生成
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) {
        seed += dateStr.charCodeAt(i);
    }

    // シード値を使ってキャラを選択（これで1日固定になるよ）
    const index = seed % schoolData.characters.length;
    const char = schoolData.characters[index];

    display.innerHTML = `
        <div class="pickup-card">
            <img src="img/${char.img}" class="pickup-img" onerror="this.src='https://via.placeholder.com/150?text=Today'">
            <div>
                <h3>${char.name} <small>(${char.class})</small></h3>
                <p>"${char.quote}"</p>
            </div>
        </div>
    `;
}

// --- クイック投票ボタン生成 ---
function renderQuickVote() {
    const area = document.getElementById('quick-vote-area');
    if (!area) return;
    area.innerHTML = ''; // 初期化
    // 最初の方のキャラ4人を表示
    schoolData.characters.slice(0, 4).forEach(c => {
        const btn = document.createElement('button');
        btn.className = "vote-btn";
        btn.innerHTML = `<i class="fas fa-heart"></i> ${c.name}`;
        btn.onclick = () => sendVote(c.id, c.name);
        area.appendChild(btn);
    });
}

// --- お手紙フォームの初期化（クラス分け対応） ---
function initLetterForm() {
    const select = document.getElementById('letter-to');
    if (!select) return;
    
    // クラスごとにグループ化
    const groups = {};
    schoolData.characters.forEach(c => {
        if (!groups[c.class]) groups[c.class] = [];
        groups[c.class].push(c);
    });

    select.innerHTML = '<option value="">宛先を選んでください</option>';
    for (const className in groups) {
        const groupTag = document.createElement('optgroup');
        groupTag.label = className;
        groups[className].forEach(c => {
            const opt = document.createElement('option');
            opt.value = c.id;
            opt.dataset.name = c.name;
            opt.dataset.class = c.class;
            opt.innerText = c.name;
            groupTag.appendChild(opt);
        });
        select.appendChild(groupTag);
    }
}

// --- 生徒名簿の表示（フィルタリング対応） ---
function renderCharacters(stageFilter) {
    const grid = document.getElementById('char-grid');
    if (!grid) return;
    grid.innerHTML = '';
    const filtered = stageFilter === 'all' ? schoolData.characters : schoolData.characters.filter(c => c.stage === stageFilter);

    filtered.forEach(c => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.onclick = () => showProfile(c.id);
        card.innerHTML = `
            <img src="img/${c.img}" onerror="this.src='https://via.placeholder.com/150?text=Student'">
            <h4>${c.name}</h4>
            <small>${c.class} / ${c.motif}</small>
        `;
        grid.appendChild(card);
    });

    // フィルタボタンのアクティブ状態管理
    const btns = document.querySelectorAll('.filter-btn');
    btns.forEach(btn => {
        btn.classList.remove('active');
        if (btn.innerText.includes(stageFilter) || (stageFilter === 'all' && btn.innerText.includes('全'))) {
            btn.classList.add('active');
        }
    });
}

// --- プロフィール詳細表示（フルネーム対応） ---
function showProfile(id) {
    const c = schoolData.characters.find(char => char.id === id);
    const modal = document.getElementById('profile-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    body.innerHTML = `
        <div class="modal-flex">
            <div class="modal-info">
                <h2>${c.fullName} <small>(${c.name})</small></h2>
                <p class="tag">${c.stage} ${c.class}</p>
                <div class="type-badge">
                    <span>${c.mbti}</span> <span>${c.socio}</span> <span>${c.ennea}</span>
                </div>
                <hr>
                <p><strong>モチーフ:</strong> ${c.motif}</p>
                <p><strong>出身:</strong> ${c.hometown}</p>
                <p class="modal-desc">${c.description}</p>
                <blockquote class="modal-quote">"${c.quote}"</blockquote>
                <button onclick="sendVote('${c.id}', '${c.name}')" class="vote-btn-big">
                    <i class="fas fa-heart"></i> ${c.name}に投票する
                </button>
            </div>
        </div>
    `;
    modal.style.display = "block";
}

function closeProfile() {
    const modal = document.getElementById('profile-modal');
    if (modal) modal.style.display = "none";
}

// --- GAS送信（投票） ---
async function sendVote(charId, charName) {
    showToast(`${charName}にエールを送信中...`);
    const char = schoolData.characters.find(c => c.id === charId);
    const data = { type: "vote", charId: charId, charName: charName, charClass: char.class };

    try {
        await fetch(GAS_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(data) });
        showToast(`${charName}に投票したゾ！届いてるといいな！`);
    } catch (e) {
        showToast("通信エラーだゾ...");
    }
}

// --- GAS送信（お手紙） ---
async function sendLetter() {
    const select = document.getElementById('letter-to');
    const selectedOpt = select.options[select.selectedIndex];
    const content = document.getElementById('letter-content').value;
    const btn = document.querySelector('.premium-btn'); // 送信ボタン

    if (!selectedOpt.value || !content) return alert("宛先と内容を入力してね！");

    // 処理開始：通知とボタン無効化
    showToast(`${selectedOpt.dataset.name}へお手紙を届けています...`);
    const originalBtnText = btn.innerText;
    btn.innerText = "送信中...";
    btn.disabled = true;

    const data = { 
        type: "letter", 
        toName: selectedOpt.dataset.name, 
        toClass: selectedOpt.dataset.class, 
        content: content 
    };

    try {
        await fetch(GAS_URL, { method: "POST", mode: "no-cors", body: JSON.stringify(data) });
        showToast("お手紙を届けたゾ！");
        document.getElementById('letter-content').value = "";
    } catch (e) {
        showToast("送信に失敗しちゃったみたい...");
    } finally {
        btn.innerText = originalBtnText;
        btn.disabled = false;
    }
}
