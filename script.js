document.addEventListener('DOMContentLoaded', () => {
    // 1. HOME用の処理 (要素がある時だけ実行してエラーを防ぐ！)
    const philoText = document.getElementById('school-philosophy');
    const conceptText = document.getElementById('school-concept');
    if (philoText && conceptText) {
        philoText.innerText = schoolData.info.philosophy;
        conceptText.innerText = schoolData.info.concept;
        showTodayPickup();
        renderUniforms();
    }

    // 2. 名簿ページ用の処理
    const charGrid = document.getElementById('char-grid');
    if (charGrid) {
        renderCharacters('all');
    }
});

// 今日のとり表示
function showTodayPickup() {
    const display = document.getElementById('random-char-display');
    const char = schoolData.characters[Math.floor(Math.random() * schoolData.characters.length)];
    display.innerHTML = `
        <img src="img/${char.img}" class="pickup-img" onerror="this.src='img/default.png'">
        <div>
            <h3>${char.name} <small>(${char.class})</small></h3>
            <p>"${char.quote}"</p>
        </div>
    `;
}

// キャラ表示
function renderCharacters(stageFilter) {
    const grid = document.getElementById('char-grid');
    grid.innerHTML = '';
    const filtered = stageFilter === 'all' ? schoolData.characters : schoolData.characters.filter(c => c.stage === stageFilter);

    filtered.forEach(c => {
        const card = document.createElement('div');
        card.className = 'char-card';
        card.onclick = () => showProfile(c.id);
        card.innerHTML = `
            <img src="img/${c.img}" onerror="this.src='img/default.png'">
            <h4>${c.name}</h4>
            <small>${c.class} / ${c.motif}</small>
        `;
        grid.appendChild(card);
    });
}

// プロフ詳細表示
function showProfile(id) {
    const c = schoolData.characters.find(char => char.id === id);
    const modal = document.getElementById('profile-modal');
    document.getElementById('modal-body').innerHTML = `
        <h2>${c.name} (${c.class})</h2>
        <p><strong>MBTI:</strong> ${c.mbti} / ${c.socio} / ${c.ennea}</p>
        <p><strong>出身:</strong> ${c.hometown}</p>
        <p>${c.description}</p>
        <blockquote style="color:var(--gold)">"${c.quote}"</blockquote>
    `;
    modal.style.display = "block";
}

function closeProfile() {
    document.getElementById('profile-modal').style.display = "none";
}