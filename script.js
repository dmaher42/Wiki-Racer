document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const startArticleTitleEl = document.getElementById('start-article-title');
    const startArticleLinkEl = document.getElementById('start-article-link');
    const targetArticleTitleEl = document.getElementById('target-article-title');
    const highScoreEl = document.getElementById('high-score');
    const timerEl = document.getElementById('timer');
    const clicksEl = document.getElementById('clicks');
    const scoreEl = document.getElementById('score');
    const pathListEl = document.getElementById('path-list');
    const moveFormEl = document.getElementById('move-form');
    const nextUrlInputEl = document.getElementById('next-url');
    const submitMoveBtnEl = document.getElementById('submit-move-btn');
    const gameControlBtn = document.getElementById('game-control-btn'); // The new dynamic button
    const victoryMessageEl = document.getElementById('victory-message');
    const finalClicksEl = document.getElementById('final-clicks');
    const finalTimeEl = document.getElementById('final-time');
    const finalScoreEl = document.getElementById('final-score');
    const playAgainBtnEl = document.getElementById('play-again-btn');

    // --- GAME STATE ---
    let gameState = {
        startArticle: '',
        targetArticle: '',
        currentArticle: '',
        clicks: 0,
        path: [],
        timerInterval: null,
        startTime: null,
        totalElapsedSeconds: 0, // To handle pausing
        isGameActive: false,
        isPaused: false
    };

    // --- A small, curated list of articles for the prototype ---
    const articlePool = [
        'Albert_Einstein', 'World_War_II', 'Ancient_Rome', 'Internet', 'Python_(programming_language)',
        'Leonardo_da_Vinci', 'Photosynthesis', 'Black_hole', 'Jupiter', 'The_Beatles',
        'Video_game', 'Artificial_intelligence', 'Japan', 'Evolution', 'Wikipedia'
    ];

    // --- HELPER FUNCTIONS ---
    function getArticleTitleFromUrl(url) {
        try {
            const urlObj = new URL(url);
            if (urlObj.hostname === 'en.wikipedia.org' && urlObj.pathname.startsWith('/wiki/')) {
                return decodeURIComponent(urlObj.pathname.split('/wiki/')[1]);
            }
        } catch (e) {
            return null;
        }
        return null;
    }

    function formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }

    // --- SCORING & HIGH SCORE ---
    function calculateScore() {
        // Base score of 10,000, minus penalties for time and clicks
        const timePenalty = gameState.totalElapsedSeconds * 10;
        const clickPenalty = gameState.clicks * 100;
        const score = Math.max(0, 10000 - timePenalty - clickPenalty);
        return score;
    }

    function getHighScore() {
        return parseInt(localStorage.getItem('wikiGameHighScore') || '0');
    }

    function setHighScore(score) {
        localStorage.setItem('wikiGameHighScore', score.toString());
        highScoreEl.textContent = score;
    }

    // --- CORE GAME LOGIC ---
    function initGame() {
        // Reset state
        clearInterval(gameState.timerInterval);
        gameState = {
            ...gameState,
            clicks: 0,
            path: [],
            timerInterval: null,
            startTime: null,
            totalElapsedSeconds: 0,
            isGameActive: false,
            isPaused: false
        };

        // Pick random articles
        const shuffled = [...articlePool].sort(() => 0.5 - Math.random());
        gameState.startArticle = shuffled[0];
        gameState.targetArticle = shuffled[1];
        gameState.currentArticle = gameState.startArticle;

        // Update UI
        startArticleTitleEl.textContent = gameState.startArticle.replace(/_/g, ' ');
        startArticleLinkEl.href = `https://en.wikipedia.org/wiki/${gameState.startArticle}`;
        targetArticleTitleEl.textContent = gameState.targetArticle.replace(/_/g, ' ');
        clicksEl.textContent = '0';
        scoreEl.textContent = '0';
        timerEl.textContent = '00:00';
        pathListEl.innerHTML = '';
        victoryMessageEl.classList.add('hidden');
        document.body.classList.remove('paused');
        
        // Disable controls
        nextUrlInputEl.disabled = true;
        submitMoveBtnEl.disabled = true;
    }

    function startGame() {
        gameState.isGameActive = true;
        gameState.startTime = Date.now();
        
        // Enable controls
        nextUrlInputEl.disabled = false;
        submitMoveBtnEl.disabled = false;
        nextUrlInputEl.focus();

        // Add start article to path
        addArticleToPath(gameState.startArticle);

        // Start timer
        gameState.timerInterval = setInterval(() => {
            const currentElapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
            gameState.totalElapsedSeconds = currentElapsed;
            timerEl.textContent = formatTime(currentElapsed);
            scoreEl.textContent = calculateScore(); // Update score live
        }, 100);
    }
    
    function pauseGame() {
        if (!gameState.isGameActive || gameState.isPaused) return;
        
        gameState.isPaused = true;
        clearInterval(gameState.timerInterval);
        document.body.classList.add('paused');
        nextUrlInputEl.disabled = true;
        submitMoveBtnEl.disabled = true;
        gameControlBtn.textContent = 'Resume Game';
    }

    function resumeGame() {
        if (!gameState.isGameActive || !gameState.isPaused) return;

        gameState.isPaused = false;
        document.body.classList.remove('paused');
        nextUrlInputEl.disabled = false;
        submitMoveBtnEl.disabled = false;
        nextUrlInputEl.focus();
        gameControlBtn.textContent = 'Pause Game';

        // Adjust start time to account for the pause duration
        gameState.startTime = Date.now() - (gameState.totalElapsedSeconds * 1000);

        gameState.timerInterval = setInterval(() => {
            const currentElapsed = Math.floor((Date.now() - gameState.startTime) / 1000);
            gameState.totalElapsedSeconds = currentElapsed;
            timerEl.textContent = formatTime(currentElapsed);
            scoreEl.textContent = calculateScore();
        }, 100);
    }

    function addArticleToPath(articleTitle) {
        gameState.path.push(articleTitle);
        const li = document.createElement('li');
        li.textContent = articleTitle.replace(/_/g, ' ');
        pathListEl.appendChild(li);
    }

    function handleMove(event) {
        event.preventDefault();
        if (!gameState.isGameActive || gameState.isPaused) return;

        const nextUrl = nextUrlInputEl.value;
        const nextArticle = getArticleTitleFromUrl(nextUrl);

        if (!nextArticle) {
            alert('Please enter a valid Wikipedia article URL.');
            return;
        }

        // Update game state
        gameState.currentArticle = nextArticle;
        gameState.clicks++;
        clicksEl.textContent = gameState.clicks;
        addArticleToPath(nextArticle);
        nextUrlInputEl.value = '';

        // Check for victory
        if (nextArticle === gameState.targetArticle) {
            endGame(true);
        }
    }

    function endGame(won) {
        gameState.isGameActive = false;
        clearInterval(gameState.timerInterval);
        document.body.classList.remove('paused');

        if (won) {
            const finalScore = calculateScore();
            finalClicksEl.textContent = gameState.clicks;
            finalTimeEl.textContent = formatTime(gameState.totalElapsedSeconds);
            finalScoreEl.textContent = finalScore;
            victoryMessageEl.classList.remove('hidden');

            // Check and update high score
            const currentHighScore = getHighScore();
            if (finalScore > currentHighScore) {
                setHighScore(finalScore);
            }
        }

        // Disable controls and reset button
        nextUrlInputEl.disabled = true;
        submitMoveBtnEl.disabled = true;
        gameControlBtn.textContent = 'Start Game';
    }

    // --- EVENT LISTENERS ---
    gameControlBtn.addEventListener('click', () => {
        const buttonState = gameControlBtn.textContent;
        if (buttonState === 'Start Game') {
            initGame();
            startGame();
            gameControlBtn.textContent = 'Pause Game';
        } else if (buttonState === 'Pause Game') {
            pauseGame();
        } else if (buttonState === 'Resume Game') {
            resumeGame();
        }
    });

    moveFormEl.addEventListener('submit', handleMove);
    
    playAgainBtnEl.addEventListener('click', () => {
        initGame();
        startGame();
        gameControlBtn.textContent = 'Pause Game';
    });

    // --- INITIALIZE ON LOAD ---
    initGame();
    highScoreEl.textContent = getHighScore();
});
