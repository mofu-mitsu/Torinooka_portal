const GAS_URL = "https://script.google.com/macros/s/AKfycbxxU_LeW0UifW3kFHsSyORgSb3EI0W7zROp7sD2-8FvcEyz7m_tZoZ1DsrrEmYVACww/exec";

document.addEventListener('DOMContentLoaded', () => {
    // 共通データの準備
    const classList = [...new Set(schoolData.characters.map(c => c.class))].sort();

    // --- HOME (index.html) ---
    if (document.getElementById('school-philosophy')) {
        document.getElementById('school-philosophy').innerText = schoolData.info.philosophy;
        document.getElementById('school-concept').innerText = schoolData.info.concept;
        renderVoteClassButtons(classList); 
        initLetterClassSelect(classList);  
        showTodayPickup();
        loadReplies();
        loadRanking();
        showTodayMenu();
        loadBulletin();
    }

    // --- 生徒名簿 (chara.html) ---
    if (document.getElementById('char-grid')) {
        renderClassFilters(classList); 
        renderCharacters('all');
    }

    // --- ストーリー (story.html) ---
    if (document.getElementById('story-list')) {
        loadStories();
    }

    // --- 世界観 (world.html) ---
    if (document.getElementById('term-list')) {
        renderTerms();
        renderRelations();
    }

    // --- コンテンツ (games.html) ---
    if (document.getElementById('game-list')) {
        renderGames();
    }

    // --- 共通パーツ (全ページ共通) ---
    // カレンダー表示
    showCalendar();

    // リンクの自動修正
    document.querySelectorAll('.nav-item').forEach(item => {
        if (item.innerText.includes("コンテンツ")) item.href = "games.html";
    });

    // アクティブタブの装飾
    const activeNav = document.querySelector('.nav-item.active');
    if (activeNav && !document.body.classList.contains('home-page')) {
        activeNav.style.backgroundColor = "var(--wine)";
        activeNav.style.color = "white";
    }

    // イースターエッグ
    setInterval(spawnGohobi, 20000);
    const logo = document.querySelector('.logo-area h1');
    if(logo) logo.onclick = secretClick;

    // luxury-section のフェードイン演出
    const sections = document.querySelectorAll('.luxury-section');
    sections.forEach((sec, index) => {
        setTimeout(() => sec.classList.add('show'), index * 150);
    });
    // ★掲示板ページ、またはHOMEにいるなら、即座にログを読み込む！
    if (document.getElementById('bulletin-board-display')) {
        loadBulletin();
    }
});

// ==========================================
// 2. 画像 ＆ 丸枠 ＆ Coming Soon の鉄壁ガード
// ==========================================
function getCharImgHTML(char, sizeClass = 'char-circle-small') {
    const defaultImg = "images/coming_soon.png"; // みつきが用意する画像名
    const charImg = (char && char.img && char.img.trim() !== "") ? `images/${char.img}` : defaultImg;

    return `
        <div class="img-container ${sizeClass}">
            <img src="${charImg}" alt="character" onerror="this.src='${defaultImg}'">
        </div>
    `;
}
// --- 今日の学食メニュー（いちごメロンパン対応） ---
function showTodayMenu() {
    const menuArea = document.getElementById('today-menu-display');
    if (!menuArea) return;

    const today = new Date();
    const seed = today.getFullYear() + today.getMonth() + today.getDate();
    
    // 運勢判定（seedを使って、特定の日にだけいちごメロンパンを出す）
    let menuHTML = "";
    if (seed % 7 === 0) { // 7日に1回の確率
        const rare = schoolData.schoolLife.rareMenu;
        menuHTML = `
            <div class="menu-card rare">
                <span class="rare-badge">超限定！残りわずか</span>
                <h3>${rare.name}</h3>
                <p class="menu-price">${rare.price}</p>
                <p>${rare.desc}</p>
            </div>
        `;
    } else {
        const index = seed % schoolData.schoolLife.menuList.length;
        const menu = schoolData.schoolLife.menuList[index];
        menuHTML = `
            <div class="menu-card">
                <h3>${menu.name}</h3>
                <p class="menu-price">${menu.price}</p>
                <p>${menu.desc}</p>
            </div>
        `;
    }
    menuArea.innerHTML = menuHTML;
}
// --- 学園掲示板の読み込み（GASを使用） ---
// 掲示板ログの描画（削除要請ボタン付き）
async function loadBulletin() {
    const board = document.getElementById('bulletin-board-display');
    if (!board) return;
    try {
        const response = await fetch(GAS_URL + "?type=bulletin");
        const posts = await response.json();
        board.innerHTML = posts.map(p => `
            <div class="bulletin-post thread-style">
                <div class="post-header">
                    <span class="post-date">${p.date}</span>
                    <div class="post-actions">
                        <button class="req-btn" onclick="requestDelete('${p.date}')">削除要請</button>
                        <button class="admin-only-btn" onclick="deletePost('${p.date}')">消去</button>
                    </div>
                </div>
                <p class="post-content">${p.content}</p>
            </div>
        `).join('');
    } catch (e) { console.error("ログ取得失敗"); }
}

// 削除要請（みつきにメールが飛ぶ）
async function requestDelete(date) {
    showToast("管理者に削除要請を送りました...");
    await fetch(GAS_URL, { 
        method: "POST", 
        mode: "no-cors", 
        body: JSON.stringify({ type: "delete_request", date: date }) 
    });
}
// ストーリー用フィルター初期化
function renderStoryFilters() {
    const tagSelect = document.getElementById('filter-tag');
    const classSelect = document.getElementById('filter-class');
    if (!tagSelect || !classSelect) return;

    // スプレッドシートにあるタグを全部拾って、重複を消す
    const tags = [...new Set(allStories.map(s => s.tag))].filter(t => t);
    tagSelect.innerHTML = '<option value="all">すべてのタグ</option>' + 
                          tags.map(t => `<option value="${t}">${t}</option>`).join('');

    // クラス一覧も取得
    const classes = [...new Set(allStories.map(s => s.stage))].filter(c => c);
    classSelect.innerHTML = '<option value="all">すべてのクラス</option>' + 
                            classes.map(c => `<option value="${c}">${c}</option>`).join('');
}


// 高度な検索実行
function executeStorySearch() {
    const textQuery = document.getElementById('search-text').value.toLowerCase();
    const tagQuery = document.getElementById('filter-tag').value;
    const classQuery = document.getElementById('filter-class').value;

    const filtered = allStories.filter(s => {
        const matchText = s.title.toLowerCase().includes(textQuery) || 
                         s.chars.toLowerCase().includes(textQuery) ||
                         s.content.toLowerCase().includes(textQuery);
        const matchTag = (tagQuery === 'all' || s.tag === tagQuery);
        const matchClass = (classQuery === 'all' || s.stage === classQuery);
        return matchText && matchTag && matchClass;
    });

    renderStoryCards(filtered);
}

// 掲示板への書き込み
async function sendBulletin(parentId = "") {
    const inputId = parentId ? `reply-input-${parentId.replace(/[:\s/]/g, '')}` : 'bulletin-input';
    const content = document.getElementById(inputId).value;
    if (!content) return;

    showToast("学園の壁に刻んでいます...");
    try {
        await fetch(GAS_URL, { 
            method: "POST", 
            mode: "no-cors", 
            body: JSON.stringify({ type: "bulletin", content: content, parentId: parentId }) 
        });
        showToast("投稿成功！");
        location.reload(); 
    } catch (e) { showToast("通信エラーだゾ..."); }
}

async function deletePost(dateStr) {
    const key = prompt("管理用合言葉を入れてね：");
    if (key !== "momoka11") return alert("合言葉が違うゾ！");

    showToast("削除依頼中...");
    try {
        await fetch(GAS_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ type: "delete_bulletin", date: dateStr }) });
        showToast("消去したゾ！");
        location.reload();
    } catch (e) { showToast("失敗だゾ..."); }
}
function renderRelations() {
    const container = document.getElementById('relation-visual');
    if (!container) return;
    container.innerHTML = schoolData.world.relations.map(r => `
        <div class="relation-line">
            <span class="rel-name">${r.from}</span>
            <span class="rel-arrow" style="color:${r.color}"> ── ${r.type} ──▶ </span>
            <span class="rel-name">${r.to}</span>
        </div>
    `).join('');
}
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
    // チェックボックスから取得（HTMLに id="story-use-illust" を追加してね）
    const useIllust = document.getElementById('story-use-illust') ? document.getElementById('story-use-illust').checked : false;

    if (!title || !content) return alert("タイトルと内容は必須だゾ！");

    const adminKey = prompt("学園史を刻むための『合言葉』を入力してね：");
    if (!adminKey) return;

    showToast("物語を紡いでいます...");
    
    const data = { type: "story", title, stage, chars, tag, content, adminKey, useIllust: useIllust };

    try {
        const response = await fetch(GAS_URL, { method: "POST", mode: "cors", body: JSON.stringify(data) });
        const result = await response.json();
        
        if (result === "success") {
            showToast("投稿完了！学園の歴史が更新されたゾ！");
            toggleStoryForm();
            loadStories();
        } else {
            showToast("合言葉が違うみたいだゾ…");
        }
    } catch (e) {
        showToast("エラーで投稿できなかったゾ...");
    }
}

// --- ストーリーの読み込み ---
async function loadStories() {
    const list = document.getElementById('story-list');
    if (!list) return;

    list.innerHTML = `
        <div class="loading-spinner-wrap" style="text-align:center; padding:50px;">
            <div class="loading-spinner"></div>
            <p style="color:var(--gold); font-weight:bold; margin-top:10px;">学園の記録を読み込み中...</p>
        </div>`;

    try {
        const response = await fetch(GAS_URL + "?type=stories");
        allStories = await response.json();
        
        renderStoryFilters(); // ★タグプルダウンを自動生成
        renderStoryCards(allStories);
    } catch (e) {
        list.innerHTML = "<p>読み込みに失敗したゾッ。GASのURLを確認してね。</p>";
    }
}

// タグボタンを自動で作る魔法の関数
function renderDynamicTagFilters(stories) {
    const filterArea = document.getElementById('story-filters');
    if (!filterArea) return;

    // データにある全てのタグを抽出して重複を消す
    const tags = [...new Set(stories.map(s => s.tag))].filter(t => t);
    
    // 「すべて」ボタンだけ残してリセット
    filterArea.innerHTML = '<button class="filter-btn active" onclick="filterStories(\'all\')">すべて</button>';
    
    tags.forEach(tag => {
        const btn = document.createElement('button');
        btn.className = 'filter-btn';
        btn.innerText = tag;
        btn.onclick = () => filterStories(tag);
        filterArea.appendChild(btn);
    });
}

// --- ストーリーカードの描画（アイコン表示版） ---
function renderStoryCards(stories) {
    const list = document.getElementById('story-list');
    if (!list) return;
    list.innerHTML = '';

    stories.forEach(s => {
        const charNames = s.chars.split(/[、,]/).map(name => name.trim());
        const iconsHTML = charNames.map(name => {
            const charObj = schoolData.characters.find(c => c.name === name);
            let imgFile = charObj ? charObj.img : "";
            // ストーリー投稿時に「イラスト版」が選ばれていたら
            if (charObj && charObj.imgIllust && s.useIllust === true) {
                imgFile = charObj.imgIllust;
            }
            return getCharImgHTML({ ...charObj, img: imgFile }, 'char-circle-mini');
        }).join('');

        const card = document.createElement('div');
        card.className = `story-card tag-${s.tag}`;
        const preview = s.content.replace(/\n/g, ' ').substring(0, 50);

        card.innerHTML = `
            <div class="story-header">
                <span class="story-tag">#${s.tag}</span>
                <span class="story-stage">${s.stage}</span>
            </div>
            <h3>${s.title}</h3>
            <div class="story-char-icons-wrap">${iconsHTML}</div>
            <div class="story-preview">${preview}...</div>
            <button onclick="openFullStory('${s.date}')" class="read-more-btn">物語を読む</button>
        `;
        list.appendChild(card);
    });
}

function formatText(text) {
    return text.replace(/\n/g, '<br>');
}

// --- ストーリー詳細表示（エラー対策版） ---
function openFullStory(dateStr) {
    const s = allStories.find(story => String(story.date) === String(dateStr));
    if (!s) return;

    const modal = document.getElementById('profile-modal');
    const body = document.getElementById('modal-body');

    body.innerHTML = `
        <div class="story-full-view">
            <h2 class="story-modal-title">${s.title}</h2>
            <div class="story-modal-meta">
                <span class="m-tag">${s.tag}</span> <span class="m-tag">${s.stage}</span>
            </div>
            <p class="story-modal-chars">【出演】 ${s.chars}</p>
            <hr>
            <div class="story-modal-content" style="white-space: pre-wrap; text-align:left;">${s.content}</div>
            <p class="story-modal-date">${s.date} 記録</p>
        </div>
    `;
    modal.style.display = "block";
}
function filterStories(tagName) {
    // ボタンの見た目切り替え
    document.querySelectorAll('#story-filters .filter-btn').forEach(btn => {
        btn.classList.remove('active');
        if(btn.innerText === tagName || (tagName === 'all' && btn.innerText === 'すべて')) btn.classList.add('active');
    });

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
    area.innerHTML = `
        <div class="vote-selector-wrapper">
            <label for="vote-class-dropdown"><i class="fas fa-search"></i> クラスを選択：</label>
            <select id="vote-class-dropdown" class="premium-select" onchange="showVoteCharsByClass(this.value)">
                <option value="">-- クラスを選んでね --</option>
                ${classList.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
        </div>
        <div id="vote-char-display" class="vote-scroll-container">
            <p class="placeholder-text">クラスを選ぶと生徒が表示されるゾッ！</p>
        </div>
    `;
}

function showVoteCharsByClass(className) {
    const display = document.getElementById('vote-char-display');
    if (!display || !className) return;
    display.innerHTML = '';
    const filtered = schoolData.characters.filter(c => c.class === className);
    
    filtered.forEach(c => {
        const card = document.createElement('div');
        card.className = 'vote-mini-card';
        card.innerHTML = `
            ${getCharImgHTML(c, 'char-circle-small')}
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
    try {
        const response = await fetch(GAS_URL + "?type=ranking");
        const ranking = await response.json();
        rankingArea.innerHTML = '';

        rankingArea.innerHTML = ranking.map((r, i) => {
            const char = schoolData.characters.find(c => c.name === r.name);
            let imgFile = char ? char.img : "";
            
            // ★ imgIllustを持っている子は、ランキングでは常にイラストを表示する
            if (char && char.imgIllust) {
                imgFile = char.imgIllust;
            }

            const imgHTML = getCharImgHTML({ ...char, img: imgFile }, 'rank-img');
            let rankMsg = "";
            if (i === 0) rankMsg = char?.rankQuote1 || "応援ありがとうございます！";
            else if (i === 1) rankMsg = char?.rankQuote2 || "2位、嬉しいです！";
            else if (i === 2) rankMsg = char?.rankQuote3 || "3位、感謝です！";

            return `
                <div class="ranking-item rank-${i+1}">
                    <div class="rank-badge">${i + 1}</div>
                    <div class="rank-img-wrap">${imgHTML}</div>
                    <div class="rank-content">
                        <span class="rank-name-text">${r.name} ${r.count} 票</span>
                        <p class="rank-quote">${rankMsg}</p>
                    </div>
                </div>`;
        }).join('');
    } catch (e) { console.error("ランキング取得失敗"); }
}
function searchCharacters() {
    const query = document.getElementById('char-search-input').value.toLowerCase();
    const grid = document.getElementById('char-grid');
    if (!grid) return;
    grid.innerHTML = '';

    const filtered = schoolData.characters.filter(c => 
        c.name.toLowerCase().includes(query) || 
        c.fullName.toLowerCase().includes(query) ||
        c.class.toLowerCase().includes(query)
    );

    filtered.forEach(c => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.onclick = () => showProfile(c.id);
        card.innerHTML = `
            ${getCharImgHTML(c, 'char-circle-small')}
            <h4>${c.name}</h4>
            <small>${c.class} / ${c.motif}</small>
        `;
        grid.appendChild(card);
    });
}
async function loadBulletin(page = 1) {
    const board = document.getElementById('bulletin-board-display');
    if (!board) return;
    try {
        const response = await fetch(`${GAS_URL}?type=bulletin&page=${page}`);
        const data = await response.json();
        const posts = data.posts;
        
        if (!posts || posts.length === 0) {
            board.innerHTML = "<p style='text-align:center;'>まだ書き込みはありません。</p>";
            return;
        }

        board.innerHTML = posts.map(p => `
            <div class="bulletin-post thread-style" style="white-space: pre-wrap;">
                <div class="post-header">
                    <span class="post-date">${p.date}</span>
                    <button class="req-btn" onclick="requestDelete('${p.date}', '${p.content}')">削除要請</button>
                </div>
                <p class="post-content">${p.content}</p>
            </div>
        `).join('');
    } catch (e) { 
        console.error("掲示板読み込み失敗", e);
        board.innerHTML = "<p>データの取得に失敗しました。GASのデプロイを確認してね！</p>";
    }
}
// --- クラス分けラベル（H1-1, H1-2...）を自動生成 ---
function renderClassFilters() {
    const filterArea = document.querySelector('.filter-tabs'); // 元のタグエリア
    if (!filterArea) return;

    // タグ（ボタン）を消して、プルダウンに置き換える
    const classes = [...new Set(schoolData.characters.map(c => c.class))].sort();
    
    filterArea.innerHTML = `
        <div class="filter-dropdown-area">
            <select class="premium-select" onchange="if(this.value==='all'){renderCharacters('all')}else{renderCharactersByClass(this.value)}">
                <option value="all">全校生徒を表示</option>
                ${classes.map(c => `<option value="${c}">${c}</option>`).join('')}
            </select>
        </div>
    `;
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
            <img src="images/${c.img}" onerror="this.src='https://via.placeholder.com/150?text=Student'">
            <h4>${c.name}</h4>
            <small>${c.motif}</small>
        `;
        grid.appendChild(card);
    });
}
async function loadReplies() {
    const replyArea = document.getElementById('reply-display');
    if (!replyArea) return;
    toggleLoading('reply-display', true);

    try {
        const response = await fetch(GAS_URL + "?type=replies");
        const replies = await response.json();
        
        replyArea.innerHTML = ''; // ローディング消去
        if (!replies || replies.length === 0) {
            replyArea.innerHTML = "<p style='text-align:center;'>まだ学園からの返信はありません。</p>";
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
                    <strong>${r.toName}からのお返事：</strong><br>
                    ${r.reply.replace(/\n/g, '<br>')}
                </div>
            </div>
        `).join('');
    } catch (e) {
        console.error("お返事の読み込み失敗", e);
        replyArea.innerHTML = "<p>返信の取得に失敗しました。</p>";
    }
}
// --- 今日のとり表示 ---
function showTodayPickup() {
    const display = document.getElementById('random-char-display');
    if (!display) return;
    const today = new Date();
    const dateStr = today.getFullYear() + "-" + (today.getMonth() + 1) + "-" + today.getDate();
    let seed = 0;
    for (let i = 0; i < dateStr.length; i++) seed += dateStr.charCodeAt(i);
    const index = seed % schoolData.characters.length;
    const char = schoolData.characters[index];

    display.innerHTML = `
        <div class="pickup-card">
            <!-- images/ フォルダを参照するように修正 -->
            <img src="images/${char.img}" class="pickup-img" onerror="this.src='https://via.placeholder.com/150?text=bird'">
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
            ${getCharImgHTML(c, 'char-circle-small')} <!-- ここで関数を使う -->
            <h4>${c.name}</h4>
            <small>${c.class} / ${c.motif}</small>
        `;
        grid.appendChild(card);
    });
}

// --- プロフィール詳細表示（フルネーム対応） ---
function showProfile(id) {
    const c = schoolData.characters.find(char => char.id === id);
    const modal = document.getElementById('profile-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    // 敬称の設定
    const suffix = (c.class === "teacher") ? "先生" : "";
    const displaySuffix = suffix ? ` (${suffix})` : "";

    body.innerHTML = `
        <div class="modal-profile-card">
            <span class="close-btn" onclick="closeProfile()">&times;</span>
            <div class="modal-header-bg"></div>
            <div class="modal-main-content">
                ${getCharImgHTML(c, 'char-circle')}
                <h2 class="modal-full-name">${c.fullName}${displaySuffix}</h2>
                <div class="modal-tags">
                    <span class="m-tag">${c.stage} ${c.class}</span>
                    <span class="m-tag">${c.gender}</span>
                    <span class="m-tag">${c.bloodType || '?'}型</span>
                </div>
                <div class="modal-mbti-area">
                    <span class="mbti-badge">${c.mbti}</span>
                    <span class="ennea-badge">${c.ennea}</span>
                </div>
                <div class="modal-detail-list">
                    <p><strong>モチーフ:</strong> ${c.motif}</p>
                    <p><strong>誕生日:</strong> ${c.birthday || '不明'}</p>
                    <p><strong>出身:</strong> ${c.hometown}</p>
                </div>
                <div class="modal-description-box">
                    <p>${c.description}</p>
                </div>
                <blockquote class="modal-quote-box">"${c.quote}"</blockquote>
                <button onclick="sendVote('${c.id}', '${c.name}')" class="vote-btn-big">
                    <i class="fas fa-heart"></i> ${c.name}を応援する
                </button>
            </div>
        </div>
    `;
    modal.style.display = "block";
}

function closeProfile() {
    document.getElementById('profile-modal').style.display = "none";
}

// --- GAS送信（投票） ---
async function sendVote(charId, charName) {
    const char = schoolData.characters.find(c => c.id === charId);
    showToast(`${charName}にエールを送信中...`);

    try {
        await fetch(GAS_URL, { method: "POST", mode: "no-cors", body: JSON.stringify({ type: "vote", charId, charName, charClass: char.class }) });
        
        // 【新機能】キャラからのお礼セリフをトーストで出す
        // quote（セリフ）の代わりに、お礼専用のデータがなければquoteを使うよ
        const thanksMsg = char.thanks || `${charName}「投票ありがとう！嬉しいゾッ！」`;
        showToast(thanksMsg); 
        
    } catch (e) { showToast("通信エラーだゾ..."); }
}
function showCalendar() {
    const calArea = document.getElementById('calendar-display');
    if (!calArea) return;

    const today = new Date();
    const todayStr = `${today.getMonth() + 1}/${today.getDate()}`;
    
    const birthdayPeople = schoolData.characters.filter(c => c.birthday === todayStr);

    let html = `<div class="calendar-today">Today: ${today.getFullYear()}/${today.getMonth()+1}/${today.getDate()}</div>`;
    
    if (birthdayPeople.length > 0) {
        html += `<div class="birthday-card-special">`;
        birthdayPeople.forEach(c => {
            // 先生対応の敬称
            const suffix = (c.class === "teacher") ? "先生" : (c.gender === "女子" ? "ちゃん" : "くん");
            html += `
                <div class="b-day-person">
                    ${getCharImgHTML(c, 'char-circle-small')}
                    <div class="b-day-info">
                        <span class="b-day-name">${c.name} ${suffix}</span>
                        <span class="b-day-greet">Happy Birthday! 🌸</span>
                    </div>
                </div>`;
        });
        html += `</div>`;
    } else {
        html += `<p class="no-bday">今日誕生日の生徒はいません</p>`;
    }
    calArea.innerHTML = html;
}


let pigClickCount = 0;
function spawnGohobi() {
    const pig = document.createElement('div');
    pig.className = 'walking-gohobi';
    pig.innerHTML = '🐖'; 
    document.body.appendChild(pig);

    const gohobiQuotes = [
        "これはご褒美だゾ♡",
        "ワシャワシャしてやるゾッ！",
        "拙者のエキス、飲むかゾ？",
        "ツインテール最高だゾッ！",
        "豚骨スープが煮えたゾ〜"
    ];

    let pos = window.innerWidth; // 右端からスタート
    const interval = setInterval(() => {
        pos -= 2; // 左へ移動
        pig.style.left = pos + 'px';
        if (pos < -100) {
            clearInterval(interval);
            pig.remove();
        }
    }, 30);

    pig.onclick = () => {
        pigClickCount++;
        const randomQuote = gohobiQuotes[Math.floor(Math.random() * gohobiQuotes.length)];
        showToast(`ご褒美「${randomQuote} (${pigClickCount}/30) 」`);
        if (pigClickCount === 30) {
            triggerSoupEvent();
            pigClickCount = 0;
        }
    };
}

// --- 1. いちごメロンパン争奪戦 ---
function playMelonPanGame() {
    const feedback = document.getElementById('game-feedback');
    const stage = document.getElementById('melonpan-game-stage');
    if(!stage) return;

    const daiki = document.getElementById('daiki-sprite');
    const tasuku = document.getElementById('tasuku-sprite');
    
    // リセット
    daiki.className = "char-sprite left img-container circle-frame";
    tasuku.className = "char-sprite right img-container circle-frame";
    stage.classList.remove('horror-shake', 'horror-dark');
    
    const rand = Math.random();
    setTimeout(() => {
        if (rand > 0.7) {
            feedback.innerHTML = "<span class='success-text'>成功！パンを死守！</span>";
            daiki.classList.add('zoom-in');
            showToast("だいき「……チッ、運がいいな。」");
        } else if (rand > 0.3) {
            feedback.innerHTML = "<span class='fail-text'>たすくに奪われた！</span>";
            tasuku.classList.add('zoom-in');
            showToast("たすく「ガハハ！百獣の王の獲物だ！」");
        } else {
            feedback.innerHTML = "<span class='horror-text'>地獄の威圧感……</span>";
            stage.classList.add('horror-dark', 'horror-shake');
            daiki.classList.add('zoom-in');
            tasuku.classList.add('zoom-in');
            showToast("だいき・たすく『……置いてけよ。』");
        }
    }, 100);
}

// --- 2. のりおみゲーム ---
let currentLine = null;
function nextNoriomiLine() {
    const balloon = document.getElementById('noriomi-balloon');
    const shutter = document.getElementById('shutter');
    const lines = schoolData.games.noriomiLines;

    if (!balloon || !lines) return;

    currentLine = lines[Math.floor(Math.random() * lines.length)];
    balloon.innerText = currentLine.text;
    if (shutter) shutter.classList.remove('closed');
}

function checkNoriomi(playerChoice) {
    if (!currentLine) return nextNoriomiLine();
    
    if (playerChoice === currentLine.isSocial) {
        showToast("正解！のりおみが少しだけ心を開いた。");
        nextNoriomiLine();
    } else {
        showToast("不正解！のりおみがシャッターを閉じた！");
        document.getElementById('shutter').classList.add('closed');
        setTimeout(nextNoriomiLine, 2000);
    }
}
function startNoriomiGame() {
    const startBtn = document.getElementById('nori-start-btn');
    const sincerityBtn = document.getElementById('sincerity-btn');
    const socialBtn = document.getElementById('social-btn');
    const balloon = document.getElementById('noriomi-balloon');

    if (startBtn) startBtn.style.display = 'none';
    if (sincerityBtn) sincerityBtn.style.display = 'inline-block';
    if (socialBtn) socialBtn.style.display = 'inline-block';
    if (balloon) balloon.style.visibility = 'visible';

    nextNoriomiLine();
}
let isGohobiRunning = false;

function startGohobiGame() {
    if (isGohobiRunning) return;
    isGohobiRunning = true;
    const container = document.getElementById('hand-container');
    const soup = document.getElementById('soup-sea');
    const btn = document.getElementById('gohobi-start-btn');
    
    btn.style.display = "none";
    soup.classList.remove('active');
    container.innerHTML = "";
    
    let score = 0;
    const gameInterval = setInterval(() => {
        if (!isGohobiRunning) { clearInterval(gameInterval); return; }

        const hand = document.createElement('div');
        hand.className = "falling-hand";
        hand.innerHTML = "🖐️";
        hand.style.left = (Math.random() * 80 + 5) + "%"; // 左右にランダム
        hand.style.top = "-50px"; // 上からスタート
        container.appendChild(hand);
        
        let topPos = -50;
        const fall = setInterval(() => {
            if (!isGohobiRunning) { clearInterval(fall); hand.remove(); return; }
            topPos += 4; // 落下速度
            hand.style.top = topPos + "px";

            // 画面の下（400px付近）まで行ったら負け
            if (topPos > 380) {
                clearInterval(fall);
                if (hand.parentNode) {
                    gameOverGohobi("スルーしたな！拙者の愛からは逃げられないゾ♡");
                    clearInterval(gameInterval);
                }
            }
        }, 20);

        hand.onclick = () => {
            if (!isGohobiRunning) return;
            hand.remove();
            clearInterval(fall);
            score++;
            if (score >= 15) { // 15回回避でクリア
                isGohobiRunning = false;
                clearInterval(gameInterval);
                showToast("回避成功！ご褒美くんは満足して去った。");
                btn.style.display = "block";
            }
        };
    }, 1000); // 1秒ごとに手が降ってくる
}

function gameOverGohobi(msg) {
    isGohobiRunning = false;
    document.getElementById('soup-sea').classList.add('active');
    document.getElementById('gohobi-start-btn').style.display = "block";
    showToast(msg);
}
function triggerSoupEvent() {
    const overlay = document.getElementById('soup-overlay');
    overlay.style.display = 'flex';
    showToast("ご褒美特製・濃厚豚骨スープが溢れ出した！");
    setTimeout(() => { overlay.style.display = 'none'; }, 5000);
}
function openSecret() {
    const modal = document.getElementById('secret-modal');
    if (modal) modal.style.display = "block";
}
// --- 3. 秘密のページ（7回クリック） ---
let logoClicks = 0;
function secretClick() {
    logoClicks++;
    if (logoClicks === 7) {
        showToast("ご褒美＆えいじ「汗と脂のファンタジー、飲み干せえぇぇ！」");
        const nav = document.querySelector('.premium-nav');
        if (!document.getElementById('secret-link')) {
            const a = document.createElement('a');
            a.id = 'secret-link';
            a.href = "javascript:void(0)"; // リンク先をJSに
            a.className = 'nav-item';
            a.innerHTML = '<i class="fas fa-skull-crossbones"></i> 秘密の部屋';
            a.onclick = openSecret; // ここを修正！
            nav.appendChild(a);
        }
        logoClicks = 0;
    }
}
function drinkFantasy() {
    showToast("ご褒美＆えいじ「力が……力がみなぎってくるぞおおぉぉ！」");
    document.body.style.backgroundColor = "#fffacd"; // スープ色に染まる
    setTimeout(() => { 
        document.body.style.backgroundColor = "#fdfdfd";
        closeSecret();
    }, 3000);
}

function closeSecret() {
    document.getElementById('secret-modal').style.display = 'none';
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
function openStoryModal(title) {
    const s = allStories.find(story => story.title === title);
    const modal = document.getElementById('profile-modal'); // 名簿のモーダルを再利用！
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    body.innerHTML = `
        <div class="story-full-view">
            <span class="story-stage">${s.stage} / ${s.tag}</span>
            <h2>${s.title}</h2>
            <p class="story-chars"><i class="fas fa-users"></i> 登場：${s.chars}</p>
            <hr>
            <div class="story-text-full">
                ${s.content.replace(/\n/g, '<br>')}
            </div>
            <p class="story-date">${new Date(s.date).toLocaleDateString()} 記録</p>
        </div>
    `;
    modal.style.display = "block";
}

function renderTerms() {
    const termList = document.getElementById('term-list');
    if (!termList) return;
    termList.innerHTML = schoolData.world.terms.map(t => `
        <div class="term-card">
            <span class="term-cat">${t.category}</span>
            <h3>${t.title}</h3>
            <p>${t.description}</p>
        </div>
    `).join('');
}

function filterTerms() {
    const query = document.getElementById('term-search').value.toLowerCase();
    const cards = document.querySelectorAll('.term-card');
    cards.forEach(card => {
        const title = card.querySelector('h3').innerText.toLowerCase();
        card.style.display = title.includes(query) ? 'block' : 'none';
    });
}

function renderGames() {
    const gameList = document.getElementById('game-list');
    if (!gameList) return;
    
    const games = [
        { title: "ゆうきくんの気まぐれ猫占い", desc: "明るくノリの良いゆうきくんが未来を鑑定🔮✨", url: "https://mofu-mitsu.github.io/yuuki_fortune/", icon: "fa-cat" },
        { title: "タイピングマスター", desc: "教育実習コースでトリ’Sのキャラたちと特訓！", url: "https://mofu-mitsu.github.io/typing-Master/", icon: "fa-keyboard" },
        { title: "とりの丘トリ’S大富豪", desc: "可愛いキャラたちとトランプの大富豪対決！", url: "https://daifugo-mofu.vercel.app", icon: "fa-crown" },
        { title: "みりんてゃソリティア", desc: "みりんてゃとトランプ勝負！クリアできるかな？", icon: "fa-layer-group", url: "https://mirintea-solitaire.vercel.app" },
        { title: "とりの丘トリ’S人狼", desc: "AIキャラたちと本気の心理戦！推理を楽しもう。", icon: "fa-wolf-pack-battalion", url: "https://mofu-mitsu.github.io/Torinooka-Werewolf/" },
        { title: "もふみつ工房 BOOTH", desc: "ノベルゲームや各種グッズをチェック！", icon: "fa-shopping-bag", url: "https://torisproject.booth.pm" }
    ];

    gameList.innerHTML = games.map(g => `
        <a href="${g.url}" target="_blank" class="game-card">
            <i class="fas ${g.icon} game-icon"></i>
            <div class="game-info">
                <h3>${g.title}</h3>
                <p>${g.desc}</p>
            </div>
            <i class="fas fa-external-link-alt ext-icon"></i>
        </a>
    `).join('');
}
