/**
 * もち風呂入れミニゲーム - 設定ファイル (ユーザー編集用)
 * 
 * 💡 セリフの修正方法:
 * 各カテゴリ（positive, negative等）の中にある { text: "...", type: "..." } を書き換えてください。
 * type は変更しないでください。
 */

const CONFIG = {
    DIFFICULTY: {
        EASY: {
            BPM: 45,
            MOVEMENT_BAD: -8,   // -3 -> -8
            TITLE: "かんたん"
        },
        NORMAL: {
            BPM: 65,
            MOVEMENT_BAD: -15,  // -8 -> -15
            TITLE: "ふつう"
        },
        HARD: {
            BPM: 90,
            MOVEMENT_BAD: -30,  // -15 -> -30
            TITLE: "むずかしい"
        }
    },
    POSITION: {
        MIN: -100, // ベッド（左）
        MAX: 100,  // お風呂（右）
        START: 0,
    },
    MOVEMENT_SUCCESS: 18,       // 15 -> 18 (成功時の進みを速く)
    JUDGE: {
        NORMAL: 0.3,
        STRONG: 0.7,
    },
    LIMIT_TIME: 30,
};

// --- ここからセリフ集 (ユーザー様で自由に変更してください) ---
const TEXT_BANK = {
    // 【肯定】 👍 (Jキー) で正解になるセリフ
    positive: [
        { text: "風呂入ろうかな？", type: "positive" },
        { text: "そろそろ入らなきゃだよね...", type: "positive" },
        { text: "さっぱりしたいな", type: "positive" },
        { text: "入浴剤、どれにしようかな？", type: "positive" },
        { text: "ゆず湯であったまろうかな", type: "positive" },
    ],

    // 【否定】 👎 (Kキー) で正解になるセリフ
    negative: [
        { text: "今日はもう寝ちゃいたい...", type: "negative" },
        { text: "明日入ればいいかな？", type: "negative" },
        { text: "布団が気持ちよすぎる", type: "negative" },
        { text: "一歩も動きたくない気分...", type: "negative" },
        { text: "今日はパスしてもいいかな？", type: "negative" },
    ],

    // 【決意】 👍 (Jキー) で正解になる強いセリフ (右端に近い時)
    commit: [
        { text: "準備完了！いってきます！", type: "commit" },
    ],

    // 【警告】 👎 (Kキー) で引き止めるセリフ (左端に近い時)
    warning: [
        { text: "ダメ、意識が遠のいてる...", type: "warning", correct: "👎" },
    ]
};

/**
 * 判定ロジック
 */
const getCorrectInput = (item, currentPosition) => {
    if (item.type === 'positive' || item.type === 'commit') return '👍';
    if (item.type === 'negative') return '👎';

    if (item.type === 'warning') return item.correct;

    return '👍';
};
