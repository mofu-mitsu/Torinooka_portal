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
        {
            id: "momoka",
            name: "ももか",
            fullName: "ももか",
            stage: "高等部",
            class: "H1-1",
            motif: "犬",
            mbti: "ENTJ",
            socio: "SLE",
            ennea: "8w7",
            hometown: "埼玉県",
            description: "負けず嫌いでツンデレな性格。みつきに対してはよく吠える（ツン）が、パパにはベタ慣れ。セレブのような気品あるポーズをよく決めている。亡くなった後も学園の魂として（？）、あるいは設定として元気に君臨中。常に自分が中心にいないと気が済まない女王様気質。",
            img: "momoka.png",
            quote: "なによ、あんた！私に気安く触らないで！……パパはどこ？"
        },
        { 
            id: "noriomi", 
            name: "のりおみ", 
            stage: "高等部", 
            class: "H1-3", 
            motif: "クマ", 
            mbti: "INTP", 
            socio: "LII", 
            ennea: "5w6",
            hometown: "埼玉県",
            description: "社交辞令の塊。くうにだけ素を出す。幸福を信じていないが、それを否定する自分も信用していない。劣勢Fe噴火の症状（震え・身体症状など）を抱える。",
            img: "noriomi.png", 
            quote: "愛なんて壊れてしまえばいい…なんてね。社交辞令だよ。" 
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
