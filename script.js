let currentStoryPage = 1;
const storiesPerPage = 10;
let filteredStories = [];

const GAS_URL = "https://script.google.com/macros/s/AKfycbxigr4izcWO4yY1yIH-Cb3E_DL08MuUfSTrX1mWzM3ygJ9JVc25ZBhto_9x_1KAQ_dDGw/exec";

document.addEventListener('DOMContentLoaded', () => {
    // 共通データの準備
    console.log("【デバッグ報告】ページを読み込んだゾッ！");

    // 全キャラのデータから、クラス名だけを重複なしで抜き出す
    const classList =[...new Set(schoolData.characters.map(c => c.class))].filter(Boolean).sort();
    console.log("【デバッグ報告】抽出したクラスリスト（これがないとヤバい）:", classList);

    // --- 生徒名簿 (chara.html) の初期化 ---
    const charGrid = document.getElementById('char-grid');
    if (charGrid) {
        console.log("【デバッグ報告】生徒名簿ページを開いていると判定したゾ！");
        renderClassFilters(classList);          // プルダウンの選択肢を作る！
        renderCharactersByClass('all');         // 最初は「全校生徒」を表示する！
    } else {
        console.log("【デバッグ報告】ここは生徒名簿ページじゃないみたい。");
    }

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
        renderNews();
    }

    // --- 生徒名簿 (chara.html) ---
    // ★ここをスッキリ1つにまとめたよ！
    if (document.getElementById('char-grid')) {
        renderClassFilters(classList);          // プルダウンの選択肢を作る！
        renderCharactersByClass('all');         // 最初は「全校生徒」を表示！
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
    renderUniforms();
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
    if (document.getElementById('letter-class-select')) {
        initLetterClassSelect(classList);
        loadReplies();
    }
    setInterval(spawnGohobi, 15000); // これを追加！
});
let isGohobiWalking = false; // 今歩いているかどうかの判定フラグ
function scheduleNextGohobi() {
    // 画面が見えている時だけ出現させる（裏で大量発生させない）
    if (!document.hidden) {
        spawnGohobi();
    }
    // 45秒〜90秒のランダムな間隔で次を予約
    const nextTime = Math.floor(Math.random() * 45000) + 45000;
    setTimeout(scheduleNextGohobi, nextTime);
}
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



// toggleReplies 関数を修正
function toggleReplies(dateStr) {
    const postId = dateStr.replace(/[:\s/]/g, '');
    const container = document.getElementById(`replies-${postId}`);
    const btn = document.getElementById(`btn-replies-${postId}`);
    if (!btn || !container) return;

    if (container.style.display === 'none' || container.style.display === '') {
        container.style.display = 'block';
        btn.innerHTML = `<i class="fas fa-times"></i> スレを閉じる`;
    } else {
        container.style.display = 'none';
        // ★裏側に保存しておいたHTMLをそのまま戻す！
        btn.innerHTML = btn.getAttribute('data-original');
    }
}
function openImageModal(imgSrc) {
    const modal = document.getElementById('profile-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    body.innerHTML = `
        <div style="text-align: center; position: relative;">
            <img src="${imgSrc}" style="max-width: 100%; height: auto; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        </div>
    `;
    modal.style.display = "block";
}


function renderUniforms() {
    const display = document.getElementById('uniform-display');
    if (!display) return;
    const uniforms = schoolData.info.uniforms;
    if (!uniforms) return;

    display.innerHTML = uniforms.map(u => `
        <div class="uniform-card">
            <!-- クリックで画像を拡大表示！ -->
            <div class="uniform-img-container" style="cursor: pointer;" onclick="openImageModal('images/${u.img}')">
                <img src="images/${u.img}" onerror="this.src='images/coming_soon.png'">
            </div>
            <h3 style="color:var(--navy); margin-top:15px;">${u.stage}</h3>
            <p style="font-size:0.9rem;">${u.style}</p>
        </div>
    `).join('');
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
    const sortOrder = document.getElementById('sort-order') ? document.getElementById('sort-order').value : 'new'; // 並び順取得

    filteredStories = allStories.filter(s => {
        const matchText = s.title.toLowerCase().includes(textQuery) || 
                         s.chars.toLowerCase().includes(textQuery) ||
                         s.content.toLowerCase().includes(textQuery);
        const matchTag = (tagQuery === 'all' || s.tag === tagQuery);
        const matchClass = (classQuery === 'all' || s.stage === classQuery);
        return matchText && matchTag && matchClass;
    });

    // ★ 日付で並び替え！
    filteredStories.sort((a, b) => {
        const dateA = new Date(a.date).getTime();
        const dateB = new Date(b.date).getTime();
        return sortOrder === 'new' ? dateB - dateA : dateA - dateB;
    });

    currentStoryPage = 1; // 検索したら1ページ目に戻す
    renderStoryCards(filteredStories);
}

// 掲示板への書き込み
async function sendBulletin(parentId = "") {
    // 1. 返信か新規投稿かで入力元を切り替える
    // parentIdがある場合は、プロンプトで内容を聞くか、動的に生成された入力欄から取る
    let content;
    if (parentId) {
        content = prompt("返信内容を入力してください：");
        if (!content) return; // キャンセル時は何もしない
    } else {
        const inputEl = document.getElementById('bulletin-input');
        if (!inputEl) return;
        content = inputEl.value;
    }

    if (!content) return;

    showToast("掲示板に刻んでいます...");
    try {
        await fetch(GAS_URL, { 
            method: "POST", 
            mode: "no-cors", 
            body: JSON.stringify({ type: "bulletin", content: content, parentId: parentId }) 
        });
        showToast("投稿成功だゾッ！");
        if (!parentId) document.getElementById('bulletin-input').value = "";
        loadBulletin(); // 再読み込み
    } catch (e) { showToast("失敗したゾ..."); }
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
async function requestDelete(date, content) {
    if(!confirm("この投稿の削除要請を管理者に送りますか？")) return;
    
    showToast("要請を送信中...");
    try {
        await fetch(GAS_URL, { 
            method: "POST", 
            mode: "no-cors", 
            body: JSON.stringify({ 
                type: "delete_request", 
                date: date, 
                content: content // ここで内容をしっかり渡すゾッ
            }) 
        });
        showToast("管理者に通知したゾッ！");
    } catch (e) { showToast("送信失敗だゾ..."); }
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

    list.innerHTML = `<div class="loading-area"><div class="loading-spinner"></div><p>記録を読み込み中...</p></div>`;

    try {
        const response = await fetch(GAS_URL + "?type=stories");
        allStories = await response.json();
        filteredStories = allStories; // 初期状態は全件
        renderStoryFilters(); // フィルタ作成
        renderStoryCards(allStories); // 描画！
    } catch (e) {
        console.error("Story load error:", e);
        list.innerHTML = "<p>物語の読み込みに失敗したゾッ。</p>";
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
    
    filteredStories = stories;
    const start = (currentStoryPage - 1) * storiesPerPage;
    const pagedStories = filteredStories.slice(start, start + storiesPerPage);

    if (pagedStories.length === 0) {
        list.innerHTML = "<p>該当する物語はまだないゾッ。</p>";
        return;
    }

    pagedStories.forEach(s => {
        // キャラアイコンの生成
        const charNames = s.chars ? s.chars.split(/[、,]/).map(name => name.trim()) :[];
        const iconsHTML = charNames.map(name => {
            const charObj = schoolData.characters.find(c => c.name === name);
            let imgFile = charObj ? charObj.img : "";
            
            // ★ 文字列でもブール値でも、とにかく「trueっぽい」ならイラスト化！
            const useIllustFlag = (s.useIllust === true || s.useIllust === "true" || s.useIllust === "TRUE");
            if (charObj && charObj.imgIllust && useIllustFlag) {
                imgFile = charObj.imgIllust;
            }
            
            return getCharImgHTML({ ...charObj, img: imgFile }, 'char-circle-mini');
        }).join('');

        const card = document.createElement('div');
        card.className = `story-card tag-${s.tag}`;
        const preview = s.content ? s.content.replace(/\n/g, ' ').substring(0, 50) : "";

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
    renderStoryPagination(filteredStories.length);
}
function toggleReplies(dateStr, count) {
    const postId = dateStr.replace(/[:\s/]/g, '');
    const container = document.getElementById(`replies-${postId}`);
    const btn = document.getElementById(`btn-replies-${postId}`);
    if (!btn || !container) return;

    if (container.style.display === 'none' || container.style.display === '') {
        container.style.display = 'block';
        btn.innerHTML = `<i class="fas fa-times"></i> スレを閉じる`;
    } else {
        container.style.display = 'none';
        // ★ 受け取った数字をそのまま使うから、絶対に undefined にならない！
        btn.innerHTML = `<i class="fas fa-comments"></i> スレを開く (${count})`;
    }
}

function formatText(text) {
    return text.replace(/\n/g, '<br>');
}
function renderStoryPagination() {
    const list = document.getElementById('story-list');
    const totalPages = Math.ceil(filteredStories.length / storiesPerPage);
    if (totalPages <= 1) return;

    const nav = document.createElement('div');
    nav.className = 'pagination-area';
    nav.innerHTML = `
        <button onclick="changeStoryPage(-1)" ${currentStoryPage === 1 ? 'disabled' : ''} class="filter-btn">前へ</button>
        <span>${currentStoryPage} / ${totalPages}</span>
        <button onclick="changeStoryPage(1)" ${currentStoryPage === totalPages ? 'disabled' : ''} class="filter-btn">次へ</button>
    `;
    list.appendChild(nav);
}
function changeStoryPage(offset) {
    currentStoryPage += offset;
    renderStoryCards(filteredStories);
    window.scrollTo({ top: 0, behavior: 'smooth' });
}
// --- ストーリー詳細表示（エラー対策版） ---
function openFullStory(dateStr) {
    const s = allStories.find(story => String(story.date) === String(dateStr));
    if (!s) return;

    const modal = document.getElementById('profile-modal');
    const body = document.getElementById('modal-body');

    // 登場キャラのアイコンを生成（★イラスト切り替え判定を追加！）
    const charNames = s.chars ? s.chars.split(/[、,]/).map(name => name.trim()) :[];
    const iconsHTML = charNames.map(name => {
        const charObj = schoolData.characters.find(c => c.name === name);
        let imgFile = charObj ? charObj.img : "";
        
        // ★ 文字列でもブール値でも、とにかく「trueっぽい」ならイラスト化！
        const useIllustFlag = (s.useIllust === true || s.useIllust === "true" || s.useIllust === "TRUE");
        if (charObj && charObj.imgIllust && useIllustFlag) {
            imgFile = charObj.imgIllust;
        }
        
        return getCharImgHTML({ ...charObj, img: imgFile }, 'char-circle-mini');
    }).join('');

    body.innerHTML = `
        <div class="story-full-view" style="text-align:left">
            <span class="close-btn" onclick="closeProfile()">&times;</span>
            <div class="story-modal-header">
                <span class="m-tag">${s.tag}</span> <span class="m-tag">${s.stage}</span>
            </div>
            <h2 class="story-modal-title" style="text-align:center">${s.title}</h2>
            <div class="story-char-icons-wrap" style="justify-content:center">${iconsHTML}</div>
            <p style="text-align:center; font-size:0.9rem; color:#666;">出演：${s.chars}</p>
            <hr>
            <div class="story-modal-content" style="white-space: pre-wrap;">${s.content}</div>
            <p class="story-modal-date" style="text-align:right">${s.date} 記録</p>
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
    console.log("【デバッグ報告】renderClassFilters が呼ばれたゾッ！");
    console.log("【デバッグ報告】受け取ったクラス一覧:", classList);
    
    const select = document.getElementById('char-class-filter'); 
    console.log("【デバッグ報告】プルダウンのHTML要素:", select);
    
    if (!select) {
        console.error("【重大エラー】id='char-class-filter' のプルダウンがHTMLに見つからないゾ！HTMLのスペルを確認して！");
        return; 
    }
    
    let optionsHTML = '<option value="all">全校生徒を表示</option>';
    
    classList.forEach(className => {
        if (!className) return; 
        optionsHTML += `<option value="${className}">${className}</option>`;
    });
    
    select.innerHTML = optionsHTML;
    console.log("【デバッグ報告】プルダウンに選択肢をセット完了だゾッ！");
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
function renderCharacterCards(characters) {
    const grid = document.getElementById('char-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    characters.forEach(c => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.onclick = () => showProfile(c.id); 
        card.innerHTML = `
            ${getCharImgHTML(c, 'char-circle-small')}
            <h4>${c.name}</h4>
            <small>${c.class || 'クラス不明'} / ${c.motif}</small>
        `;
        grid.appendChild(card);
    });
}

// loadBulletin の中身をこれに差し替えて！
async function loadBulletin(page = 1) {
    const board = document.getElementById('bulletin-board-display');
    if (!board) return;
    try {
        const response = await fetch(`${GAS_URL}?type=bulletin&page=${page}`);
        const data = await response.json();
        const allPosts = data.posts;
        
        board.innerHTML = '';
        if (!allPosts || allPosts.length === 0) {
            board.innerHTML = "<p style='text-align:center'>まだ書き込みはないゾッ。</p>";
            return;
        }

        const mainPosts = allPosts.filter(p => !p.parentId);
        const replies = allPosts.filter(p => p.parentId);

        board.innerHTML = mainPosts.map(p => {
            const threadReplies = replies.filter(r => r.parentId === p.date);
            const replyCount = threadReplies.length;
            const postId = p.date.replace(/[:\s/]/g, '');

            return `
                <div class="bulletin-post thread-style">
                    <div class="post-header">
                        <span class="post-date">${p.date}</span>
                        <div class="post-actions">
                            <button class="req-btn" onclick="sendBulletin('${p.date}')"><i class="fas fa-reply"></i> 返信</button>
                            <!-- ★ここに data-count をしっかり埋め込む！ -->
                            <button id="btn-replies-${postId}" class="req-btn" onclick="toggleReplies('${p.date}', ${replyCount})">
                                <i class="fas fa-comments"></i> スレを開く (${replyCount})
                            </button>
                            <button class="req-btn delete-req" onclick="requestDelete('${p.date}', '${p.content}')">削除要請</button>
                        </div>
                    </div>
                    <p class="post-content" style="white-space: pre-wrap;">${p.content}</p>
                    
                    <div id="replies-${postId}" class="replies-container" style="display:none;">
                        ${threadReplies.length > 0 ? threadReplies.map(r => `
                            <div class="reply-item">
                                <small>${r.date}</small>
                                <p style="white-space: pre-wrap;">${r.content}</p>
                            </div>
                        `).join('') : '<p style="font-size:0.8rem; color:#888;">まだ返信はないゾッ。</p>'}
                    </div>
                </div>`;
        }).join('');
    } catch (e) { console.error("掲示板エラー", e); }
}

// --- クラス分けラベル（H1-1, H1-2...）を自動生成 ---
function renderClassFilters() {
    // chara.html にある select タグを直接探す！
    const select = document.getElementById('char-class-filter'); 
    if (!select) return; // なければ何もしない
    
    // schoolData からクラス名のリストを自動生成する
    const classes =[...new Set(schoolData.characters.map(c => c.class))].filter(Boolean).sort();
    
    // 中身を「全校生徒」＋「各クラス」で作る
    let html = '<option value="all">全校生徒を表示</option>';
    classes.forEach(className => {
        html += `<option value="${className}">${className}</option>`;
    });
    
    select.innerHTML = html;
}
function renderCharactersByClass(className) {
    const grid = document.getElementById('char-grid');
    if (!grid) return;
    grid.innerHTML = '';
    
    // 'all' なら全員、それ以外ならそのクラスの生徒だけを抽出！
    const filtered = (className === 'all') 
        ? schoolData.characters 
        : schoolData.characters.filter(c => c.class === className);
        
    // カードを生成して並べる
    filtered.forEach(c => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.onclick = () => showProfile(c.id);
        card.innerHTML = `
            ${getCharImgHTML(c, 'char-circle-small')}
            <h4>${c.name}</h4>
            <small>${c.class || 'クラス不明'} / ${c.motif}</small>
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
// --- 今日のとり表示（真・ランダム ＆ 画像ありキャラ限定版） ---
function showTodayPickup() {
    const display = document.getElementById('random-char-display');
    if (!display) return;

    // 1. 画像が設定されているキャラ（Coming Soonじゃないキャラ）だけを抽出！
    const availableChars = schoolData.characters.filter(c => c.img && c.img.trim() !== "");
    if (availableChars.length === 0) return; // 全員画像なしの場合は何もしない

    // 2. 今日の日付から「シード値（純粋な数字）」を作成 (例: 20260415)
    const today = new Date();
    const seed = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
    
    // 3. 【新機能】サイン(sin)関数を使った強力なランダム計算！
    // 日付が1変わるだけで結果が劇的に飛ぶから、絶対に順番にはならないゾッ！
    const randomFraction = Math.abs(Math.sin(seed) * 10000) % 1;

    // 4. キャラクター数で掛けて、今日選ばれる1人を決定！
    const index = Math.floor(randomFraction * availableChars.length);
    const char = availableChars[index];

    // 5. 画面に表示
    display.innerHTML = `
        <div class="pickup-card" style="display:flex; align-items:center; gap:20px; padding:20px;">
            ${getCharImgHTML(char, 'pickup-img')}
            <div>
                <h3 style="margin:0">${char.name} <small>(${char.class})</small></h3>
                <p style="font-style:italic; margin:10px 0">"${char.quote}"</p>
                <button class="cheer-btn" onclick="sendVote('${char.id}', '${char.name}')"><i class="fas fa-heart"></i> 応援する</button>
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
// --- プロフィール表示（画像切り替えボタン追加版） ---
function showProfile(id) {
    const c = schoolData.characters.find(char => char.id === id);
    const modal = document.getElementById('profile-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    const suffix = (c.class === "teacher") ? "先生" : "";
    const displaySuffix = suffix ? ` (${suffix})` : "";

    // ★イラスト切り替えボタンの生成
    let toggleBtnHTML = "";
    if (c.imgIllust) {
        toggleBtnHTML = `
            <div style="margin-top: 10px;">
                <button class="req-btn" onclick="toggleProfileImage('${c.img}', '${c.imgIllust}')">
                    <i class="fas fa-sync-alt"></i> 画像を切り替える
                </button>
            </div>
        `;
    }

    // 画像コンテナにIDを振って、JSで操作できるようにする
    const imgHTML = `
        <div class="img-container char-circle">
            <img id="profile-main-img" src="images/${c.img}" onerror="this.parentElement.innerHTML='<div class=\\'coming-soon-box char-circle\\'>Coming<br>Soon</div>'">
        </div>
    `;

    body.innerHTML = `
        <div class="modal-profile-card">
            <span class="close-btn" onclick="closeProfile()">&times;</span>
            <div class="modal-header-bg"></div>
            <div class="modal-main-content">
                ${imgHTML}
                ${toggleBtnHTML} <!-- 切り替えボタン表示 -->
                
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

// --- 画像切り替え関数 ---
function toggleProfileImage(imgReal, imgIllust) {
    const imgEl = document.getElementById('profile-main-img');
    if (!imgEl) return;
    
    // 現在の画像のURLを見て、実写ならイラストへ、イラストなら実写へ切り替える
    if (imgEl.src.includes(imgReal)) {
        imgEl.src = `images/${imgIllust}`;
    } else {
        imgEl.src = `images/${imgReal}`;
    }
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
    
    // ★みつきファミリーの特別枠！
    const specialBirthdays =[
        { date: "1/17", name: "みつき（開発者・神）", type: "creator" },
        { date: "12/11", name: "ももかママ", type: "family" },
        { date: "2/19", name: "ももかパパ", type: "family" }
    ];

    const todaySpecials = specialBirthdays.filter(s => s.date === todayStr);
    const birthdayPeople = schoolData.characters.filter(c => c.birthday === todayStr);

    let html = `<div class="calendar-today"><i class="fas fa-clock"></i> Today: ${today.getFullYear()}/${today.getMonth()+1}/${today.getDate()}</div>`;
    
    if (birthdayPeople.length > 0 || todaySpecials.length > 0) {
        html += `<div class="birthday-card-special">`;
        
        // 生徒・先生の誕生日
        birthdayPeople.forEach(c => {
            // ★敬称の判定ロジック！先生の時は何もつけない（空文字）にするゾッ！
            let suffix = "くん";
            if (c.class === "teacher" || c.class === "teacher") {
                suffix = ""; // すでに名前に先生が入っているので付けない
            } else if (c.gender === "女子" || c.gender === "女") {
                suffix = "ちゃん";
            } else if (c.gender === "雌雄同体") {
                suffix = "さん"; // ほなみ対応！
            }

            // suffixが空文字の場合はスペースが余らないように調整
            const displayName = suffix ? `${c.name} ${suffix}` : c.name;

            html += `
                <div class="b-day-person">
                    ${getCharImgHTML(c, 'char-circle-small')}
                    <div class="b-day-info">
                        <span class="b-day-name">${displayName}</span>
                        <span class="b-day-greet">Happy Birthday! 🌸</span>
                    </div>
                </div>`;
        });

        // 開発者・ファミリーの特別表示
        todaySpecials.forEach(s => {
            const icon = s.type === "creator" ? "👑" : "🎉";
            html += `
                <div class="b-day-person" style="justify-content: center; background: linear-gradient(135deg, #fff, #ffe4e1); padding: 10px; border-radius: 10px; border: 2px dashed #ff4d6d;">
                    <div class="b-day-info" style="text-align: center;">
                        <span class="b-day-name" style="color: #e74c3c; font-size: 1.2rem;">${icon} ${s.name} ${icon}</span>
                        <span class="b-day-greet">特別なお誕生日おめでとうございます！✨</span>
                    </div>
                </div>`;
        });

        html += `</div>`;
    } else {
        html += `<p class="no-bday" style="text-align:center; color:#999; margin-top: 10px;">今日誕生日のキャラクターはいません</p>`;
    }
    calArea.innerHTML = html;
}


let pigClickCount = 0;
function spawnGohobi() {
    // 別のタブを見ている時や、すでに歩いている時は出さない！
    if (document.hidden || isGohobiWalking) return; 
    
    isGohobiWalking = true;
    
    const pig = document.createElement('div');
    pig.className = 'walking-gohobi';
    pig.innerHTML = '🐖'; 
    document.body.appendChild(pig);

    const gohobiQuotes =[
        "これはご褒美だゾ♡",
        "ワシャワシャしてやるゾッ！",
        "拙者のエキス、飲むかゾ？",
        "ツインテール最高だゾッ！",
        "豚骨スープが煮えたゾ〜"
    ];

    let pos = window.innerWidth;
    const interval = setInterval(() => {
        pos -= 2; 
        pig.style.left = pos + 'px';
        if (pos < -100) {
            clearInterval(interval);
            pig.remove();
            isGohobiWalking = false; // 画面外に出たらフラグをリセット！
        }
    }, 30);

    pig.onclick = () => {
        pigClickCount++;
        const randomQuote = gohobiQuotes[Math.floor(Math.random() * gohobiQuotes.length)];
        showToast(`ご褒美「${randomQuote} (${pigClickCount}/30) 」`);
        if (pigClickCount === 30) {
            triggerSoupEvent();
            pigClickCount = 0;
            clearInterval(interval);
            pig.remove();
            isGohobiWalking = false;
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
// --- 3. 秘密のページ（7回クリック）修正版 ---
let logoClicks = 0;
// --- 秘密のページ（7回クリック）強制記憶版 ---
function secretClick(e) {
    // もしリンクのクリック動作を止められるなら止める（念のため）
    if (e) e.preventDefault();

    // ブラウザの記憶から今のカウントを取り出す（なければ0）
    let currentClicks = parseInt(localStorage.getItem('logoClicks') || '0');
    currentClicks++;

    if (currentClicks >= 7) {
        // 7回に達したら発動！
        showToast("ご褒美＆えいじ「汗と脂のファンタジー、飲み干せえぇぇ！」");
        
        // 秘密のモーダルを表示
        const modal = document.getElementById('secret-modal');
        if (modal) modal.style.display = "block";
        
        // カウントをリセット
        localStorage.setItem('logoClicks', '0');
    } else {
        // 7回未満ならカウントを保存して、本来のリンク先（HOME）へ飛ばす
        localStorage.setItem('logoClicks', currentClicks);
        window.location.href = "index.html"; 
    }
}

function drinkFantasy() {
    showToast("ご褒美＆えいじ「力が……力がみなぎってくるぞおおぉぉ！」");
    document.body.style.backgroundColor = "#fffacd"; // スープ色に染まる
    setTimeout(() => { 
        document.body.style.backgroundColor = ""; // 元に戻す
        closeSecret();
    }, 3000);
}

function closeSecret() {
    const modal = document.getElementById('secret-modal');
    if (modal) modal.style.display = 'none';
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
function searchCharacters() {
    const input = document.getElementById('char-search-input');
    if (!input) return;
    const query = input.value.toLowerCase();
    
    const filtered = schoolData.characters.filter(c => 
        (c.name && c.name.toLowerCase().includes(query)) || 
        (c.fullName && c.fullName.toLowerCase().includes(query)) ||
        (c.class && c.class.toLowerCase().includes(query))
    );
    
    renderCharacterCards(filtered); 
}
function renderGames() {
    const gameList = document.getElementById('game-list');
    if (!gameList) return;
    
    const games = [
        { 
            title: "Psycho-Shooter (サイコシューター)", 
            desc: "弾は『言葉』！ネガティブな感情を撃ち抜き、論破や精神統一で難局を乗り越えるメンタル・シューティング。", 
            url: "https://mofu-mitsu.github.io/Psycho-Shooter/", 
            icon: "fa-crosshairs" 
        },
        { title: "ゆうきくんの気まぐれ猫占い", desc: "明るくノリの良いゆうきくんが未来を鑑定🔮✨", url: "https://mofu-mitsu.github.io/yuuki_fortune/", icon: "fa-cat" },
        { title: "タイピングマスター", desc: "教育実習コースでトリ’Sのキャラたちと特訓！", url: "https://mofu-mitsu.github.io/typing-Master/", icon: "fa-keyboard" },
        { title: "闇観測実験アーカイブ", desc: "入力速度や迷いまで観測……。あなたの心の「闇」を暴き出す本格実験ツール。", url: "https://mofu-mitsu.github.io/yami_kansoku_archive/", icon: "fa-eye" },
        { title: "とりの丘トリ’S大富豪", desc: "可愛いキャラたちとトランプの大富豪対決！", url: "https://daifugo-mofu.vercel.app", icon: "fa-crown" },
        { title: "みりんてゃソリティア", desc: "みりんてゃとトランプ勝負！クリアできるかな？", icon: "fa-layer-group", url: "https://mirintea-solitaire.vercel.app" },
        { title: "とりの丘トリ’S人狼", desc: "AIキャラたちと本気の心理戦！推理を楽しもう。", icon: "fa-wolf-pack-battalion", url: "https://mofu-mitsu.github.io/Torinooka-Werewolf/" },
        { title: "先駆シェフの献立メーカー", desc: "今日の夕飯が決まらない？シェフが勝手に献立を決めてくれるよ！", url: "https://mofu-mitsu.github.io/kondate-maker/", icon: "fa-utensils" }, // ← 追加！
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
// --- ハンバーガーメニューの開閉 ---
function toggleMenu() {
    const nav = document.getElementById('global-nav');
    if (nav) {
        nav.classList.toggle('open');
    }
}
function renderNews() {
    const display = document.getElementById('news-display');
    if (!display) return;
    
    // data.jsに news が設定されているかチェック
    const newsList = schoolData.info.news;
    if (!newsList || newsList.length === 0) {
        display.innerHTML = "<p>まだ新しいニュースはないゾッ。</p>";
        return;
    }

    display.innerHTML = newsList.map(n => `
        <div class="news-item">
            <div class="news-date">${n.date}</div>
            <div class="news-content-area">
                <h3 class="news-title">${n.title}</h3>
                <p class="news-text">${n.content}</p>
            </div>
        </div>
    `).join('');
}

function openImageModal(imgSrc) {
    const modal = document.getElementById('profile-modal');
    const body = document.getElementById('modal-body');
    if (!modal || !body) return;

    body.innerHTML = `
        <div style="text-align: center; position: relative;">
            <img src="${imgSrc}" style="max-width: 100%; height: auto; border-radius: 15px; box-shadow: 0 10px 30px rgba(0,0,0,0.5);">
        </div>
    `;
    modal.style.display = "block";
}

// ==========================================
// 11. はじめての方へ（Welcomeガイド）の開閉
// ==========================================
function toggleWelcome() {
    const content = document.getElementById('welcome-content');
    const arrow = document.getElementById('welcome-arrow');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        // 矢印を上に向けるアニメーション
        arrow.style.transform = 'rotate(180deg)';
    } else {
        content.style.display = 'none';
        // 矢印を下に戻す
        arrow.style.transform = 'rotate(0deg)';
    }
}
