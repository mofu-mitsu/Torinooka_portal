const schoolData = {
    info: {
        philosophy: "「個性を翼に、未来へ羽ばたく」",
        concept: "とりの丘学園は、初等部から大学部まで一貫した教育を行う、自然豊かな丘の上に立つ学園です。生徒一人一人が持つ固有の『翼（個性）』を尊重し、それを美しく広げられる環境を提供します。",
        uniformPolicy: "当校は『自己表現の自由』を重んじているため、制服の着用は義務ではありません。標準制服は用意されていますが、アレンジや私服登校も認められています。",
        uniforms: [
            { stage: "初等部", style: "紺色のセーラー服", img: "uniform_e.png" },
            { stage: "中等部", style: "学ラン / 黒セーラー服", img: "uniform_m.png" },
            { stage: "高等部", style: "ブレザー / 赤チェック / クリームセーター", img: "uniform_h.png" }
        ]
    },
    characters: [
// characters配列の中身を更新
        { 
            id: "momoka", 
            fullName: "ももか", 
            name: "ももか", 
            gender: "女子", // 性別追加
            stage: "高等部", class: "H1-1", motif: "犬（元愛犬）", 
            mbti: "ENTJ", socio: "SLE", ennea: "8w7", hometown: "埼玉県", 
            description: "負けず嫌いでツンデレな性格。飼い主にはよく吠えるが、パパにはベタ慣れ。セレブのような気品あるポーズをよく決めている女王様。",
            img: "momoka.png", quote: "私が一番に決まってるじゃない！" 
        },
        { 
            id: "noriomi", 
            fullName: "のりおみ", 
            name: "のりおみ", 
            gender: "男子", // 性別追加
            stage: "高等部", class: "H1-3", motif: "クマ", 
            mbti: "INTP", socio: "LII", ennea: "5w6", hometown: "埼玉県", 
            description: "社交辞令の塊。くうにだけ素を出す。幸福を信じていないが、それを否定する自分も信用していない。不器用な優しさを持つ。",
            img: "noriomi.png", quote: "愛なんて壊れてしまえばいい…なんてね。" 
        },
        { id: "kuu", name: "くうちゃん", class: "H1-3", motif: "カラス", type: "INTJ / ILI / 5w4", description: "不器用な陰キャ（自称）。のりおみの最大の理解者。", img: "kuu.png", quote: "……勝手にいがみ合ってればいいじゃん。" },
        { id: "satsuki", name: "さつき", class: "H3-2", motif: "フクロウ", type: "INTJ / LII / 5w6", img: "satsuki.png", quote: "秩序こそが、学園を美しく保つ鍵です。" },
        // ... 他のキャラもここに追加
    ],
    terms: [
        { title: "クラス崩壊事件", content: "1-3で起きた深刻な事態。これ以降、生徒たちの関係性が激変した。" },
        { title: "劣勢Fe噴火", content: "INTPののりおみ等に見られる、感情が制御不能になり身体症状として現れる現象。" }
    ],
    stories: [
        { title: "雨の日の図書室", tag: "日常", content: "のりおみとくうの静かな時間。" },
        { title: "リボンの嘘", tag: "重い", content: "まいちゃんが隠し持つ弟への想い。" }
    ]
};

// schoolDataオブジェクトの中に追加してね
schoolData.world = {
    // 用語集
    terms: [
        { 
            title: "クラス崩壊事件", 
            category: "事件", 
            description: "高1-3で発生した深刻な対立。これによりクラス内の人間関係が激変し、のりおみやこうた達の性格や立ち位置に大きな影響を与えた。" 
        },
        { 
            title: "劣勢Fe噴火", 
            category: "心理", 
            description: "INTP（のりおみ等）に見られる症状。抑圧された感情が、泣く・震え・PTSDなどの身体症状として爆発すること。" 
        },
        { 
            title: "シェアハウス", 
            category: "生活", 
            description: "ほのか、なぎさ、めりの3人が共同生活をしている場所。世間にNOを突きつける彼女たちの避難所でもある。" 
        }
    ],
    // 相関図用（簡易検索用）
    relations: [
        { from: "ももか", to: "みみか", type: "大親友", color: "#f1c40f" },
        { from: "のりおみ", to: "くう", type: "唯一の理解者", color: "#ff4d6d" },
        { from: "ゆい", to: "のりおみ", type: "執着・依存", color: "#9b59b6" },
        { from: "こうた", to: "のりおみ", type: "問題児扱い（呆れ）", color: "#34495e" }
    ]
};

// schoolDataオブジェクト内に追加してね
schoolData.schoolLife = {
    menuList: [
        { name: "学園特製カレー", price: "450円", desc: "じっくり煮込んだ定番メニュー。" },
        { name: "日替わりパスタ（明太子）", price: "500円", desc: "女子生徒に人気のピリ辛パスタ。" },
        { name: "とりの丘ラーメン", price: "480円", desc: "醤油ベースの懐かしい味。" },
        { name: "サーモン親子丼", price: "600円", desc: "ちょっと贅沢したい日の特別メニュー。" },
        { name: "購買のやきそばパン", price: "150円", desc: "休み時間には争奪戦になる一品。" }
    ],
    rareMenu: { name: "【限定】いちごメロンパン", price: "200円", desc: "購買で1日5個しか販売されない伝説のパン。出会えたらラッキー！" }
};
