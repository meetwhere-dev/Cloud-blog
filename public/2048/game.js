

let gameMap = document.getElementById('gameMap');
let scoreBox = document.getElementById('scoreBox');
let bestScoreBox = document.getElementById('bestScoreBox');
let restartGame = document.getElementById('restartGame');
let restartGameBtn = document.getElementById('restartGameBtn');


// 新游戏
let storage = window.localStorage;
let bestScore;
let totalScore = 0;
if (localStorage.getItem('bestScore')){
    bestScore = parseInt(localStorage.getItem('bestScore'));
}else{
    bestScore = 0;
}
bestScoreBox.innerText = bestScore;


// 游戏块 类
function GameBlock(col, row, val) {
    if(!val){
        val =2;
    }
    this.val = val;
    this.col = col;
    this.row = row;
    this.gameBlock = document.createElement('div');
    this.gameBlock.innerText = val;
    this.gameBlock.className = 'gameBlock';
    // this.gameBlock.style.translate = 120 * this.col + 'px ' + 120 * this.row + 'px';
    this.gameBlock.style.transform = 'translate3d(' + 120 * this.col + 'px, ' + 120 * this.row + 'px, 0px)' ;
    gameMap.appendChild(this.gameBlock);

    this.bind = function () {
        switch (this.val) {
            case 4:
                this.gameBlock.style.backgroundColor = '#ede0c8';
                break;
            case 8:
                this.gameBlock.style.backgroundColor = '#f2b179';
                this.gameBlock.style.color = '#f9f6f2';
                break;
            case 16:
                this.gameBlock.style.backgroundColor = '#f59563';
                this.gameBlock.style.color = '#f9f6f2';
                break;
            case 32:
                this.gameBlock.style.backgroundColor = '#f67c5f';
                this.gameBlock.style.color = '#f9f6f2';
                break;
            case 64:
                this.gameBlock.style.backgroundColor = '#f65e3b';
                this.gameBlock.style.color = '#f9f6f2';
                break;
            case 128:
                this.gameBlock.style.backgroundColor = '#edcf72';
                this.gameBlock.style.color = '#f9f6f2';
                break;
            case 256:
                this.gameBlock.style.backgroundColor = '#edcc51';
                break;
            
            default:
                break;

        }
        this.gameBlock.innerText = this.val;
        blockMap[this.row][this.col] = [this.val, this];
    }


    this.move = function (X, Y) {
        // Y为上下移动 X为左右移动
        this.row += Y;
        this.col += X;
        this.col < 0 ? this.col = 0 : this.col;
        this.col > 3 ? this.col = 3 : this.col;
        this.row < 0 ? this.row = 0 : this.row;
        this.row > 3 ? this.row = 3 : this.row;
        // this.gameBlock.style.translate = 120 * this.col + 'px ' + 120 * this.row + 'px';
        this.gameBlock.style.transform = 'translate3d(' + 120 * this.col + 'px, ' + 120 * this.row + 'px, 0px)';


    }
}





// 声明游戏块
let blockMap = [[[0, {}], [0, {}], [0, {}], [0, {}]],
[[0, {}], [0, {}], [0, {}], [0, {}]],
[[0, {}], [0, {}], [0, {}], [0, {}]],
[[0, {}], [0, {}], [0, {}], [0, {}]]];


createBlock();


function gameOver(){
    restartGame.style.display = 'block';
    document.onkeydown = {}
    storage['bestScore'] = bestScore;
}

function createBlock() {
    let x1 = Math.floor(Math.random() * 2);
    let y1 = Math.floor(Math.random() * 2 + 2);
    blockMap[x1][y1][1] = new GameBlock(y1, x1, 2);
    blockMap[x1][y1][1].bind();

    blockMap[y1][x1][1] = new GameBlock(x1, y1, 4);
    blockMap[y1][x1][1].bind();

}


function blockMove(block) {
    let scoreAdd = 0;
    // 向左移动
    if (block == 37) {
        let isMove = false;
        for (let y = 0; y < 4; y++) {
            // 防止2次合并模块
            let z = 0;

            for (let x = 1; x < 4; x++) {

                // 如果为空进行下一轮
                if (!blockMap[y][x][0]) {
                    continue
                }
                for (let i = x - 1; i >= z; i--) {

                    if (!blockMap[y][i][0]) {
                        blockMap[y][i + 1][1].move(-1, 0);
                        blockMap[y][i + 1][1].bind();
                        blockMap[y][i + 1] = [0, {}];
                        isMove = true;
                        continue
                    }

                    if (blockMap[y][i][0] == blockMap[y][i + 1][0]) {

                        gameMap.removeChild(blockMap[y][i][1].gameBlock);
                        blockMap[y][i + 1][1].move(-1, 0);
                        blockMap[y][i + 1][1].val *= 2;
                        scoreAdd += blockMap[y][i + 1][1].val
                        blockMap[y][i + 1][1].bind();
                        blockMap[y][i + 1] = [0, {}];
                        isMove = true;
                        z = i + 1;
                        break
                    }

                }
            }
        }
        for (let y = 0; y < 4; y++) {
            for (let x = 1; x < 4; x++) {
                if (!blockMap[y][x][0]) {
                    continue
                }
                for (let i = x - 1; i >= 0; i--) {

                    if (!blockMap[y][i][0]) {
                        blockMap[y][i + 1][1].move(-1, 0);
                        blockMap[y][i + 1][1].bind();
                        blockMap[y][i + 1] = [0, {}];
                        isMove = true;
                        continue
                    }
                }
            }
        }


        let temp = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (!blockMap[i][j][0]) {
                    temp.push([i, j]);
                }
            }
        }
        if (temp.length == 0) {
            gameOver();
            console.log('Game Over!');
        } else if (isMove) {
            let newBlockLocaltion = temp[Math.floor(Math.random() * temp.length)];
            value = Math.random() > 0.7 ? 4 : 2;
            newBlock = new GameBlock(newBlockLocaltion[1], newBlockLocaltion[0], value);
            blockMap[newBlockLocaltion[0]][newBlockLocaltion[1]] = newBlock;
            blockMap[newBlockLocaltion[0]][newBlockLocaltion[1]].bind();
            newBlock = {};
        }
    }

    // 向右移动i
    if (block == 39) {
        let isMove = false;

        for (let y = 0; y < 4; y++) {
            // 防止2次合并模块
            let z = 3;

            for (let x = 1; x < 4; x++) {
                // 如果为空进行下一轮
                if (!blockMap[y][3 - x][0]) {
                    continue
                }

                for (let i = 4 - x; i <= z; i++) {
                    if (!blockMap[y][i][0]) {
                        blockMap[y][i - 1][1].move(1, 0);
                        blockMap[y][i - 1][1].bind();
                        isMove = true;
                        blockMap[y][i - 1] = [0, {}];
                        continue
                    }
                    if (blockMap[y][i][0] == blockMap[y][i - 1][0]) {
                        gameMap.removeChild(blockMap[y][i][1].gameBlock);
                        blockMap[y][i - 1][1].move(1, 0);
                        blockMap[y][i - 1][1].val *= 2;
                        scoreAdd += blockMap[y][i - 1][1].val
                        blockMap[y][i - 1][1].bind();
                        blockMap[y][i - 1] = [0, {}];
                        isMove = true;
                        z = i - 1;
                        break
                    }

                }
            }
        }

        for (let y = 0; y < 4; y++) {
            for (let x = 1; x < 4; x++) {
                // 如果为空进行下一轮
                if (!blockMap[y][3 - x][0]) {
                    continue
                }
                for (let i = 4 - x; i <= 3; i++) {
                    if (!blockMap[y][i][0]) {
                        blockMap[y][i - 1][1].move(1, 0);
                        blockMap[y][i - 1][1].bind();
                        isMove = true;
                        blockMap[y][i - 1] = [0, {}];
                    }
                }
            }
        }



        let temp = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (!blockMap[i][j][0]) {
                    temp.push([i, j]);
                }
            }
        }
        if (temp.length == 0) {
            gameOver();
            console.log('Game Over!');
        } else if (isMove) {
            let newBlockLocaltion = temp[Math.floor(Math.random() * temp.length)];
            value = Math.random() > 0.7 ? 4 : 2;
            newBlock = new GameBlock(newBlockLocaltion[1], newBlockLocaltion[0], value);
            blockMap[newBlockLocaltion[0]][newBlockLocaltion[1]] = newBlock;
            blockMap[newBlockLocaltion[0]][newBlockLocaltion[1]].bind();
            newBlock = {};
        }

    }

    // 向上移动
    if (block == 38) {
        let isMove = false;
        for (let x = 0; x < 4; x++) {

            // 防止2次合并模块
            let z = 0;

            for (let y = 1; y < 4; y++) {
                // 如果为空进行下一轮
                if (!blockMap[y][x][0]) {
                    continue
                }
                for (let i = y - 1; i >= z; i--) {
                    if (!blockMap[i][x][0]) {
                        blockMap[i + 1][x][1].move(0, -1);
                        blockMap[i + 1][x][1].bind();
                        blockMap[i + 1][x] = [0, {}];
                        isMove = true;

                        continue
                    }
                    if (blockMap[i][x][0] == blockMap[i + 1][x][0]) {
                        gameMap.removeChild(blockMap[i][x][1].gameBlock);
                        blockMap[i + 1][x][1].move(0, -1);
                        blockMap[i + 1][x][1].val *= 2;
                        scoreAdd += blockMap[i + 1][x][1].val
                        blockMap[i + 1][x][1].bind();
                        blockMap[i + 1][x] = [0, {}];
                        z = i + 1;
                        isMove = true;
                        break;
                    }



                }
            }
        }

        for (let y = 1; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                // 如果为空进行下一轮
                if (!blockMap[y][x][0]) {
                    continue
                }
                for (let i = y - 1; i >= 0; i--) {
                    if (!blockMap[i][x][0]) {
                        blockMap[i + 1][x][1].move(0, -1);
                        blockMap[i + 1][x][1].bind();
                        blockMap[i + 1][x] = [0, {}];
                        isMove = true;
                    }

                }
            }
        }
        let temp = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (!blockMap[i][j][0]) {
                    temp.push([i, j]);
                }
            }
        }
        if (temp.length == 0) {
            gameOver();
            console.log('Game Over!');
        } else if (isMove) {
            let newBlockLocaltion = temp[Math.floor(Math.random() * temp.length)];
            value = Math.random() > 0.7 ? 4 : 2;
            newBlock = new GameBlock(newBlockLocaltion[1], newBlockLocaltion[0], value);
            blockMap[newBlockLocaltion[0]][newBlockLocaltion[1]] = newBlock;
            blockMap[newBlockLocaltion[0]][newBlockLocaltion[1]].bind();
            newBlock = {};
        }
    }

    // 向下移动
    if (block == 40) {
        let isMove = false;

        // 合并元素块
        for (let x = 0; x < 4; x++) {
            // 防止2次合并模块
            let z = 3;
            for (let y = 1; y < 4; y++) {

                // 如果为空进行下一轮
                if (!blockMap[3 - y][x][0]) {
                    continue
                }
                for (let i = 4 - y; i <= z; i++) {
                    if (!blockMap[i][x][0]) {
                        blockMap[i - 1][x][1].move(0, 1);
                        blockMap[i - 1][x][1].bind();
                        blockMap[i - 1][x] = [0, {}];
                        isMove = true;
                        continue
                    }
                    if (blockMap[i][x][0] == blockMap[i - 1][x][0]) {
                        gameMap.removeChild(blockMap[i][x][1].gameBlock);
                        blockMap[i - 1][x][1].move(0, 1);
                        blockMap[i - 1][x][1].val *= 2;
                        scoreAdd += blockMap[i - 1][x][1].val
                        blockMap[i - 1][x][1].bind();
                        blockMap[i - 1][x] = [0, {}];
                        isMove = true;
                        z = i - 1;
                        break;
                    }

                }
            }
        }

        // 前进方向为空则前进
        for (let y = 1; y < 4; y++) {
            for (let x = 0; x < 4; x++) {
                // 如果为空进行下一轮
                if (!blockMap[3 - y][x][0]) {
                    continue
                }
                for (let i = 4 - y; i <= 3; i++) {
                    if (!blockMap[i][x][0]) {
                        blockMap[i - 1][x][1].move(0, 1);
                        blockMap[i - 1][x][1].bind();
                        blockMap[i - 1][x] = [0, {}];
                        isMove = true;
                    }

                }
            }
        }

        let temp = [];
        for (let i = 0; i < 4; i++) {
            for (let j = 0; j < 4; j++) {
                if (!blockMap[i][j][0]) {
                    temp.push([i, j]);
                }
            }
        }
        if (temp.length == 0) {
            gameOver();
            console.log('Game Over!');
        } else if (isMove) {
            let newBlockLocaltion = temp[Math.floor(Math.random() * temp.length)];
            value = Math.random() > 0.7 ? 4 : 2;
            newBlock = new GameBlock(newBlockLocaltion[1], newBlockLocaltion[0], value);
            blockMap[newBlockLocaltion[0]][newBlockLocaltion[1]] = newBlock;
            blockMap[newBlockLocaltion[0]][newBlockLocaltion[1]].bind();
            newBlock = {};
        }

    }



    // 更新计分板
    if (scoreAdd){
        totalScore += scoreAdd;
        scoreBox.innerText = totalScore;
        if(totalScore>bestScore){
            bestScore = totalScore;
            bestScoreBox.innerText = bestScore;
        }
    }
}

let touchSatrtx
let touchSatrty
function touchSatrtFunc(e) {
    //evt.preventDefault(); //阻止触摸时浏览器的缩放、滚动条滚动等 
    let touch = e.touches[0]; //获取第一个触点 
    touchSatrtx = Number(touch.pageX); //页面触点X坐标 
    touchSatrty = Number(touch.pageY); //页面触点Y坐标 
}

document.body.addEventListener('touchmove', (e) => {
    e.preventDefault();
}, { passive: false });

function touchEndFunc(e) {
    //evt.preventDefault(); //阻止触摸时浏览器的缩放、滚动条滚动等 
    let touch = e.changedTouches[0]; //获取第一个触点 
    var touchEndx = Number(touch.pageX); //页面触点X坐标 
    var touchEndy = Number(touch.pageY); //页面触点Y坐标 
    //判断往哪边滑动

    if ((Math.abs(touchEndx - touchSatrtx) - Math.abs(touchEndy - touchSatrty)) > 0){
        if ((touchEndx - touchSatrtx) > 0){
            blockMove(39);
        }else{
            blockMove(37);
        }
    }else{
        if ((touchEndy - touchSatrty) > 0) {
            blockMove(40);
            return false
        } else {
            blockMove(38);
        }
    }
}
document.addEventListener('touchstart', touchSatrtFunc, false);
document.addEventListener('touchend', touchEndFunc, false);




document.onkeydown = function (e) {
    console.log(e)
    switch (e.keyCode) {
        case 37:

            blockMove(37);
            return false
        case 38:
            blockMove(38);
            return false
        case 39:
            blockMove(39);
            return false
        case 40:
            blockMove(40);
            return false
        default:
            break;
    }
}


restartGameBtn.onclick = function () {
    // 卸载沙盘元素
    for(let i =0; i<4; i++){
        for(let j = 0; j < 4; j++){
            if(blockMap[i][j][0]){
                gameMap.removeChild(blockMap[i][j][1].gameBlock);
            }
        }
    }

    blockMap = [[[0, {}], [0, {}], [0, {}], [0, {}]],
    [[0, {}], [0, {}], [0, {}], [0, {}]],
    [[0, {}], [0, {}], [0, {}], [0, {}]],
    [[0, {}], [0, {}], [0, {}], [0, {}]]];

    totalScore = 0; 
    scoreBox.innerText = totalScore;
    createBlock();
    return false
}

restartGameBtn2.onclick = function () {
    // 卸载沙盘元素
    for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
            if (blockMap[i][j][0]) {
                gameMap.removeChild(blockMap[i][j][1].gameBlock);
            }
        }
    }

    blockMap = [[[0, {}], [0, {}], [0, {}], [0, {}]],
    [[0, {}], [0, {}], [0, {}], [0, {}]],
    [[0, {}], [0, {}], [0, {}], [0, {}]],
    [[0, {}], [0, {}], [0, {}], [0, {}]]];

    totalScore = 0;
    scoreBox.innerText = totalScore;
    createBlock();
    restartGame.style.display = 'none';
    return false
}