/**
 * もち風呂キャンミニゲーム - メインロジック
 */

class BGMSequencer {
    constructor(audioCtx) {
        this.ctx = audioCtx;
        // 平和なコード進行: Fmaj7 -> G7 -> Em7 -> Am
        this.progression = [
            [349.23, 440.00, 523.25, 659.25], // Fmaj7
            [392.00, 493.88, 587.33, 698.46], // G7
            [329.63, 392.00, 493.88, 587.33], // Em7
            [440.00, 523.25, 659.25, 783.99]  // Am7
        ];
        this.currentBar = 0;
        this.currentStep = 0;
        this.timer = null;
        this.isPlaying = false;
        this.masterGain = this.ctx.createGain();
        this.masterGain.gain.value = 0.05;
        this.masterGain.connect(this.ctx.destination);
    }

    start(bpm) {
        if (this.isPlaying) return;
        this.isPlaying = true;
        this.currentBar = 0;
        this.currentStep = 0;
        const interval = (60000 / bpm) / 2; // 8分音符

        const tick = () => {
            if (!this.isPlaying) return;
            if (this.currentStep === 0) {
                this.playChord(this.progression[this.currentBar % 4]);
            }
            if (Math.random() > 0.7) {
                this.playMelodyNote(this.progression[this.currentBar % 4]);
            }
            this.currentStep++;
            if (this.currentStep >= 8) {
                this.currentStep = 0;
                this.currentBar++;
            }
            this.timer = setTimeout(tick, interval);
        };
        tick();
    }

    stop() {
        this.isPlaying = false;
        if (this.timer) clearTimeout(this.timer);
    }

    playChord(freqs) {
        const now = this.ctx.currentTime;
        freqs.forEach(f => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'triangle';
            osc.frequency.setValueAtTime(f, now);
            gain.gain.setValueAtTime(0, now);
            gain.gain.linearRampToValueAtTime(0.12, now + 0.5);
            gain.gain.exponentialRampToValueAtTime(0.01, now + 4.0);
            osc.connect(gain);
            gain.connect(this.masterGain);
            osc.start(now);
            osc.stop(now + 4.0);
        });
    }

    playMelodyNote(chordFreqs) {
        const now = this.ctx.currentTime;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const baseFreq = chordFreqs[Math.floor(Math.random() * chordFreqs.length)];
        osc.frequency.setValueAtTime(baseFreq * 2, now);
        osc.type = 'sine';
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.01, now + 1.2);
        osc.connect(gain);
        gain.connect(this.masterGain);
        osc.start(now);
        osc.stop(now + 1.2);
    }
}

class Game {
    constructor() {
        this.gameState = 'TITLE';
        this.difficulty = 'NORMAL';
        this.position = CONFIG.POSITION.START;
        this.timeLeft = CONFIG.LIMIT_TIME;
        this.currentMessage = null;
        this.gameLoop = null;
        this.lastBeatTime = 0;
        this.lastFrameTime = 0;
        this.canInput = false;

        // Audio Context & BGM
        this.audioCtx = null;
        this.bgm = null;

        // DOM elements
        this.elements = {
            character: document.getElementById('character'),
            charWrapper: document.getElementById('character-wrapper'),
            bgLayers: document.getElementById('background-layers'),
            messageBubble: document.getElementById('message-bubble'),
            messageText: document.getElementById('message-text'),
            timeDisplay: document.getElementById('time-display'),
            difficultyDisplay: document.getElementById('difficulty-display'),
            startScreen: document.getElementById('start-screen'),
            resultScreen: document.getElementById('result-screen'),
            gameHUD: document.getElementById('game-hud'),
            resultTitle: document.getElementById('result-title'),
            resultText: document.getElementById('result-text'),
            resultChar: document.getElementById('result-character'),
            inputControls: document.getElementById('input-controls')
        };

        this.init();
    }

    init() {
        const diffBtns = document.querySelectorAll('.diff-btn');
        diffBtns.forEach(btn => {
            btn.addEventListener('click', () => {
                this.difficulty = btn.dataset.diff;
                this.startGame();
            });
        });

        document.getElementById('restart-button').addEventListener('click', () => {
            location.reload();
        });

        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.getElementById('btn-up').addEventListener('click', () => this.handleInput('👍'));
        document.getElementById('btn-down').addEventListener('click', () => this.handleInput('👎'));

        this.updateCharacterPosition(true);
    }

    initAudio() {
        if (!this.audioCtx) {
            this.audioCtx = new (window.AudioContext || window.webkitAudioContext)();
            this.bgm = new BGMSequencer(this.audioCtx);
        }
    }

    playSE(type) {
        if (!this.audioCtx) return;
        const oscillator = this.audioCtx.createOscillator();
        const gainNode = this.audioCtx.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.audioCtx.destination);

        const now = this.audioCtx.currentTime;

        if (type === 'success') {
            oscillator.type = 'sine';
            oscillator.frequency.setValueAtTime(440, now);
            oscillator.frequency.exponentialRampToValueAtTime(880, now + 0.1);
            gainNode.gain.setValueAtTime(0.3, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);
            oscillator.start(now);
            oscillator.stop(now + 0.2);
        } else if (type === 'bad') {
            oscillator.type = 'square';
            oscillator.frequency.setValueAtTime(220, now);
            oscillator.frequency.setValueAtTime(110, now + 0.05);
            gainNode.gain.setValueAtTime(0.2, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.3);
            oscillator.start(now);
            oscillator.stop(now + 0.3);
        } else if (type === 'click') {
            oscillator.type = 'triangle';
            oscillator.frequency.setValueAtTime(660, now);
            gainNode.gain.setValueAtTime(0.1, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.05);
            oscillator.start(now);
            oscillator.stop(now + 0.05);
        }
    }

    playJingle(isHappy) {
        if (!this.audioCtx) return;
        const now = this.audioCtx.currentTime;
        const notes = isHappy ? [523, 659, 783, 1046] : [392, 349, 329, 261];

        notes.forEach((freq, i) => {
            const osc = this.audioCtx.createOscillator();
            const gain = this.audioCtx.createGain();
            osc.type = isHappy ? 'sine' : 'triangle';
            osc.frequency.setValueAtTime(freq, now + i * 0.15);
            gain.gain.setValueAtTime(0.2, now + i * 0.15);
            gain.gain.exponentialRampToValueAtTime(0.01, now + i * 0.15 + 0.4);
            osc.connect(gain);
            gain.connect(this.audioCtx.destination);
            osc.start(now + i * 0.15);
            osc.stop(now + i * 0.15 + 0.4);
        });
    }

    startGame() {
        this.initAudio();
        this.gameState = 'PLAYING';
        this.position = CONFIG.POSITION.START;
        this.timeLeft = CONFIG.LIMIT_TIME;

        const now = performance.now();
        this.lastBeatTime = now;
        this.lastFrameTime = now;

        const diffConfig = CONFIG.DIFFICULTY[this.difficulty];
        this.elements.difficultyDisplay.textContent = diffConfig.TITLE;

        this.elements.startScreen.classList.add('hidden');
        this.elements.resultScreen.classList.add('hidden');
        this.elements.gameHUD.classList.remove('hidden');
        this.elements.inputControls.classList.remove('hidden');

        this.updateCharacterPosition(true);
        this.updateCharacterExpression('normal');

        if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
        this.gameLoop = requestAnimationFrame((t) => this.update(t));

        this.bgm.start(diffConfig.BPM);
        this.showNextMessage();
    }

    update(timestamp) {
        if (this.gameState !== 'PLAYING') return;

        const diffConfig = CONFIG.DIFFICULTY[this.difficulty];
        const beatInterval = 60000 / diffConfig.BPM;

        const elapsedSinceBeat = (timestamp - this.lastBeatTime);
        if (elapsedSinceBeat >= beatInterval) {
            this.lastBeatTime = timestamp;
            this.onBeat();
        }

        const deltaTime = (timestamp - this.lastFrameTime) / 1000;
        this.lastFrameTime = timestamp;

        this.timeLeft -= deltaTime;
        this.updateHUD();

        if (this.timeLeft <= 0) {
            this.endGame('TIMEUP');
        }

        this.gameLoop = requestAnimationFrame((t) => this.update(t));
    }

    onBeat() {
        this.showNextMessage();
    }

    updateHUD() {
        this.elements.timeDisplay.textContent = Math.max(0, Math.ceil(this.timeLeft));
    }

    showNextMessage() {
        const diffConfig = CONFIG.DIFFICULTY[this.difficulty];
        const beatInterval = 60000 / diffConfig.BPM;

        let category;
        const isPositiveTurn = Math.random() < 0.5;

        if (isPositiveTurn) {
            // 次の成功でお風呂（MAX）に届く場合のみ commit
            category = (this.position + CONFIG.MOVEMENT_SUCCESS >= CONFIG.POSITION.MAX) ? 'commit' : 'positive';
        } else {
            // 次の失敗でゲームオーバー（MIN）に届く場合のみ warning
            category = (this.position + diffConfig.MOVEMENT_BAD <= CONFIG.POSITION.MIN) ? 'warning' : 'negative';
        }

        const bank = TEXT_BANK[category];
        let nextMsg;
        let attempts = 0;
        do {
            nextMsg = bank[Math.floor(Math.random() * bank.length)];
            attempts++;
        } while (this.currentMessage && nextMsg.text === this.currentMessage.text && bank.length > 1 && attempts < 10);

        this.currentMessage = nextMsg;
        this.elements.messageText.textContent = this.currentMessage.text;
        this.elements.messageBubble.classList.add('active');
        this.canInput = true;

        setTimeout(() => {
            if (this.gameState !== 'PLAYING') return;
            this.elements.messageBubble.classList.remove('active');
            if (this.canInput) {
                this.applyMovement('MISS');
            }
        }, beatInterval * 0.9);
    }

    handleKeyDown(e) {
        if (!this.canInput || this.gameState !== 'PLAYING') return;
        if (e.key.toLowerCase() === 'j') this.handleInput('👎');
        if (e.key.toLowerCase() === 'k') this.handleInput('👍');
    }

    handleInput(input) {
        if (!this.canInput || this.gameState !== 'PLAYING') return;
        const correct = getCorrectInput(this.currentMessage, this.position);
        if (input === correct) {
            this.applyMovement('PERFECT');
            this.playSE('success');
        } else {
            this.applyMovement('MISS');
            this.playSE('bad');
        }
        this.canInput = false;
        this.elements.messageBubble.classList.remove('active');
    }

    applyMovement(rank) {
        const diffConfig = CONFIG.DIFFICULTY[this.difficulty];
        if (rank === 'MISS') {
            this.position += diffConfig.MOVEMENT_BAD;
            this.timeLeft = Math.max(0, this.timeLeft - 1);
            this.elements.character.classList.add('shake');
            setTimeout(() => this.elements.character.classList.remove('shake'), 300);
            this.updateCharacterExpression('angry');
        } else {
            this.position += CONFIG.MOVEMENT_SUCCESS;
            this.elements.character.classList.add('jump');
            setTimeout(() => this.elements.character.classList.remove('jump'), 400);
            this.updateCharacterExpression('happy');
        }

        this.position = Math.max(CONFIG.POSITION.MIN, Math.min(CONFIG.POSITION.MAX, this.position));
        this.updateCharacterPosition();

        if (this.position >= CONFIG.POSITION.MAX) {
            this.endGame('TRUE');
        } else if (this.position <= CONFIG.POSITION.MIN) {
            this.endGame('BAD');
        }
    }

    updateCharacterPosition(instant = false) {
        const percentage = ((this.position + 100) / 200) * 100;
        const displayLeft = 15 + (percentage * 0.7);
        this.elements.charWrapper.style.left = `${displayLeft}%`;
        const bgOffset = -(percentage / 2);
        this.elements.bgLayers.style.transform = `translateX(${bgOffset}%)`;
    }

    updateCharacterExpression(state) {
        this.elements.character.style.backgroundImage = `url(assets/${state}.png)`;
    }

    endGame(type) {
        this.gameState = 'RESULT';
        this.canInput = false;
        if (this.gameLoop) cancelAnimationFrame(this.gameLoop);
        if (this.bgm) this.bgm.stop();

        this.elements.gameHUD.classList.add('hidden');
        this.elements.resultScreen.classList.remove('hidden');
        this.elements.inputControls.classList.add('hidden');

        let title = "";
        let text = "";
        let finalExpression = "normal";

        if (type === 'TRUE') {
            title = "TRUE END: お風呂へ！";
            text = "「……仕方ないなぁ、行ってくる。」<br>もちはスッキリお風呂に入りました！";
            finalExpression = "refreshed";
            this.playJingle(true);
        } else if (type === 'BAD') {
            title = "BAD END: 就寝...";
            text = "「今日は完全に無理……zzz」<br>お風呂に入らず寝てしまいました。";
            finalExpression = "sad";
            this.playJingle(false);
        } else {
            if (this.position > 25) {
                title = "NORMAL END: まぁいっか";
                text = "「今日はやめとこ。明日頑張る。」<br>お風呂に入る気はありましたが、一歩届きませんでした。";
                finalExpression = "normal";
            } else {
                title = "NORMAL END: 今日はいいや";
                text = "「明日でいいよね？」<br>ゆっくり休んで明日に備えましょう。";
                finalExpression = "angry";
            }
            this.playJingle(false);
        }

        this.elements.resultTitle.textContent = title;
        this.elements.resultText.innerHTML = text;
        this.elements.resultChar.style.backgroundImage = `url(assets/${finalExpression}.png)`;
    }
}

window.addEventListener('load', () => {
    new Game();
});
