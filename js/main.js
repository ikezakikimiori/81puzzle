// --- JavaScript: 9x9 (81マス) パズルロジック (レスポンシブ対応) ---

const BOARD_SIZE = 9; // 盤面のサイズ
let board = [];       // パズルの論理的な状態 (9x9配列)
let tiles = {};       // タイル番号をキーにしたDOM要素の参照
let movesCount = 0;

const gameContainer = document.getElementById('game-container');
const messageElement = document.getElementById('message');

// --- サイズ計算用の変数 ---
let TILE_SIZE = 0;
let GAP_SIZE = 0;

// --- 論理関数 (変更なし) ---

// 指定されたタイルの位置 {row, col} を返すヘルパー関数
function getTilePos(currentBoard, tile) {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            if (currentBoard[r][c] === tile) return { row: r, col: c };
        }
    }
    return null; // 見つからない場合はnull
}

function createBoard() {
    let arr = [];
    const totalTiles = BOARD_SIZE * BOARD_SIZE;
    for (let i = 1; i < totalTiles; i++) arr.push(i);
    arr.push(0);

    let newBoard = [];
    while (arr.length) newBoard.push(arr.splice(0, BOARD_SIZE));
    return newBoard;
}

function getBlankPos(currentBoard) {
    return getTilePos(currentBoard, 0);
}

function isValidMove(currentBoard, tile) {
    const blankPos = getTilePos(currentBoard, 0);
    const tilePos = getTilePos(currentBoard, tile);

    if (!blankPos || !tilePos) return false;

    const { row: br, col: bc } = blankPos;
    const { row: r, col: c } = tilePos;

    // 隣接しているか（上下左右）を判定
    return (Math.abs(br - r) === 1 && bc === c) || (Math.abs(bc - c) === 1 && br === r);
}

function moveTile(currentBoard, tile) {
    if (!isValidMove(currentBoard, tile)) return false;

    const blankPos = getTilePos(currentBoard, 0);
    const tilePos = getTilePos(currentBoard, tile);

    // 配列内の値を交換する
    currentBoard[blankPos.row][blankPos.col] = tile;
    currentBoard[tilePos.row][tilePos.col] = 0;

    return true;
}

function shuffleBoard(currentBoard, moves = 1000) {
    const directions = [[0, 1], [0, -1], [1, 0], [-1, 0]];

    for (let i = 0; i < moves; i++) {
        const blankPos = getBlankPos(currentBoard);
        const { row: br, col: bc } = blankPos;

        const validNeighbors = [];
        for (const [dr, dc] of directions) {
            const nr = br + dr;
            const nc = bc + dc;
            if (nr >= 0 && nr < BOARD_SIZE && nc >= 0 && nc < BOARD_SIZE) {
                validNeighbors.push({ row: nr, col: nc });
            }
        }

        if (validNeighbors.length === 0) continue;

        const { row: nr, col: nc } = validNeighbors[Math.floor(Math.random() * validNeighbors.length)];
        const tileToMove = currentBoard[nr][nc];

        // moveTileを介さず直接スワップする
        currentBoard[br][bc] = tileToMove;
        currentBoard[nr][nc] = 0;
    }
}

function isSolved(currentBoard) {
    const flatBoard = currentBoard.flat();
    const totalTiles = BOARD_SIZE * BOARD_SIZE;

    for (let i = 0; i < totalTiles - 1; i++) {
        if (flatBoard[i] !== i + 1) return false;
    }
    return flatBoard[totalTiles - 1] === 0;
}

function validateBoard(currentBoard) {
    const flatBoard = currentBoard.flat();
    const numbers = new Set(flatBoard);
    if (numbers.size !== BOARD_SIZE * BOARD_SIZE) {
        const seen = {};
        const duplicates = [];
        for (const num of flatBoard) {
            seen[num] = (seen[num] || 0) + 1;
        }
        for (const num in seen) {
            if (seen[num] > 1) {
                duplicates.push(`${num} (x${seen[num]})`);
            }
        }
        const missing = [];
        for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
            if (!numbers.has(i)) {
                missing.push(i);
            }
        }
        return `盤面エラー: 重複=${duplicates.join(', ')}, 不足=${missing.join(', ')}`;
    }
    return null; // 有効
}

// --- DOM操作関数 (レスポンシブ対応) ---

// タイルのCSS transformプロパティの値を計算
function getTilePosition(r, c) {
    const x = (c * (TILE_SIZE + GAP_SIZE)) - 4; // 4px左にずらす
    const y = (r * (TILE_SIZE + GAP_SIZE)) - 4; //4px上にずらす
    return `translate(${x}px, ${y}px)`;
}

// 動的にタイルと隙間のサイズを計算し、スタイルを更新
function updateDimensions() {
    const containerWidth = gameContainer.offsetWidth;
    
    // 全体の幅 = (タイルサイズ * 9) + (隙間 * 8)
    // 隙間をタイルの幅の特定の割合にする (例: 1/8)
    // containerWidth = 9 * TILE_SIZE + 8 * (TILE_SIZE / 8)
    // containerWidth = 9 * TILE_SIZE + TILE_SIZE
    // containerWidth = 10 * TILE_SIZE
    TILE_SIZE = containerWidth / 10;
    GAP_SIZE = TILE_SIZE / 8;

    // 全てのタイルのサイズを更新
    for (const tileValue in tiles) {
        const tileDiv = tiles[tileValue];
        if (tileDiv) {
            tileDiv.style.width = `${TILE_SIZE}px`;
            tileDiv.style.height = `${TILE_SIZE}px`;
            // フォントサイズもタイルサイズに合わせると見やすい
            tileDiv.style.fontSize = `${TILE_SIZE * 0.4}px`;
        }
    }
    // タイルの位置を再計算して適用
    updateTilePositions();
}


function createTiles() {
    gameContainer.innerHTML = '';
    tiles = {};

    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const tileValue = board[r][c];

            if (tileValue !== 0) {
                const tileDiv = document.createElement('div');

                tileDiv.classList.add('tile');
                // 初期位置とサイズは updateDimensions で設定される
                tileDiv.textContent = tileValue;
                tileDiv.setAttribute('data-value', tileValue);
                tileDiv.addEventListener('click', () => handleTileClick(tileValue));
                tiles[tileValue] = tileDiv;
                gameContainer.appendChild(tileDiv);
            }
        }
    }
}

function updateTilePositions() {
    for (let r = 0; r < BOARD_SIZE; r++) {
        for (let c = 0; c < BOARD_SIZE; c++) {
            const tileValue = board[r][c];

            if (tileValue !== 0) {
                const tileDiv = tiles[tileValue];
                if(tileDiv) { // 安全確認
                    tileDiv.style.transform = getTilePosition(r, c);
                }
            }
        }
    }
}

function handleTileClick(tileValue) {
    if (moveTile(board, tileValue)) {
        movesCount++;
        updateTilePositions();
        messageElement.textContent = `手番: ${movesCount} 回`;

        if (isSolved(board)) {
            messageElement.textContent = `🎉 おめでとう！${movesCount} 回でパズルを完成させました！`;
            messageElement.classList.add('win');
            Object.values(tiles).forEach(tile => {
                tile.classList.add('cleared');
            });
        }
    } else {
        messageElement.textContent = `❌ ${tileValue} は隣に空きがないので移動できません。`;
        messageElement.classList.remove('win');
    }飽き
}

function startGame() {
    board = createBoard();
    shuffleBoard(board, 1000);
    movesCount = 0;

    const validationError = validateBoard(board);
    if (validationError) {
        gameContainer.innerHTML = ''; // ボードをクリア
        messageElement.textContent = validationError;
        messageElement.classList.add('win'); // エラーを目立たせる
        return;
    }

    createTiles();
    updateDimensions(); // サイズ計算と位置更新を実行

    messageElement.textContent = "👆 タイルをクリックしてパズルを完成させよう！";
    messageElement.classList.remove('win');
}

// --- イベントリスナー ---

// DOMが読み込まれたらゲームを開始し、リサイズイベントにも対応
document.addEventListener('DOMContentLoaded', () => {
    startGame();
    // 遅延させて初期表示のズレを防ぐ
    setTimeout(() => {
        window.addEventListener('resize', updateDimensions);
    }, 100);
});
