document.addEventListener('DOMContentLoaded', () => {
    // --- DOM ELEMENTS ---
    const startArticleTitleEl = document.getElementById('start-article-title');
    const startArticleLinkEl = document.getElementById('start-article-link');
    const targetArticleTitleEl = document.getElementById('target-article-title');
    const timerEl = document.getElementById('timer');
    const clicksEl = document.getElementById('clicks');
    const pathListEl = document.getElementById('path-list');
    const moveFormEl = document.getElementById('move-form');
    const nextUrlInputEl = document.getElementById('next-url');
    const submitMoveBtnEl = document.getElementById('submit-move-btn');
    const newGameBtnEl = document.getElementById('new-game-btn');
    const victoryMessageEl = document.getElementById('victory-message');
    const finalClicksEl = document.getElementById('final-clicks');
    const finalTimeEl = document.getElementById('final-time');
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
        isGameActive: false
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
            isGameActive: false
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
        timerEl.textContent = '00:00';
        pathListEl.innerHTML = '';
        victoryMessageEl.classList.add('hidden');
        
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
            const elapsedSeconds = Math.floor((Date.now() - gameState.startTime) / 1000);
            timerEl.textContent = formatTime(elapsedSeconds);
        }, 1000);
    }
    
    function addArticleToPath(articleTitle) {
        gameState.path.push(articleTitle);
        const li = document.createElement('li');
        li.textContent = articleTitle.replace(/_/g, ' ');
        pathListEl.appendChild(li);
    }

    function handleMove(event) {
        event.preventDefault();
        if (!gameState.isGameActive) return;

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

        if (won) {
            const finalTime = Math.floor((Date.now() - gameState.startTime) / 1000);
            finalClicksEl.textContent = gameState.clicks;
            finalTimeEl.textContent = formatTime(finalTime);
            victoryMessageEl.classList.remove('hidden');
        }

        // Disable controls
        nextUrlInputEl.disabled = true;
        submitMoveBtnEl.disabled = true;
    }

    // --- EVENT LISTENERS ---
    newGameBtnEl.addEventListener('click', () => {
        initGame();
        startGame();
    });

    moveFormEl.addEventListener('submit', handleMove);
    
    playAgainBtnEl.addEventListener('click', () => {
        initGame();
        startGame();
    });

    // --- INITIALIZE ON LOAD ---
    initGame();
});
