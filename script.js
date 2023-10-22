'use strict'
window.addEventListener('load', () => {

    // Получение страниц
    const gameover = document.querySelector('.gameover'),
        points = document.querySelector('.points'),
        restart = document.querySelector('.restart'),
        save = document.querySelector('.save'),
        wrapper = document.querySelector('.wrapper'),
        play = document.querySelector('.play'),
        records = document.querySelector('.records'),
        back = document.querySelector('.back_button'),
        mainPage = document.querySelector('.main'),
        tablePage = document.querySelector('.table'),
        mainMenuSound = document.querySelector('#audioMain'),
        exit = document.querySelector('.exit'),
        tableRecords = document.querySelector('.tableRecords');


    // Переменные для вывода результатов
    let saveScore = 0,
        saveName = '',
        timerRequestAnimation,
        timerId;

    // Запуск музыки
    mainMenuSound.src = 'audio/main_menu.mp3';
    const playMainTheme = (() => {
        mainMenuSound.play();
    })();

    // Запуск игры
    play.addEventListener('click', () => {
        mainMenuSound.pause();
        mainMenuSound.currentTime = 0.0;
        mainPage.style.display = 'none';
        wrapper.style.display = 'flex';
        startGame();
    })

    // Открытие таблицы рекордов
    records.addEventListener('click', () => {
        if (localStorage.saveResultsArr) {
            let textTableRecords = '';
            const getlocalStorageData = JSON.parse(localStorage.saveResultsArr);

            const compareScore = (a, b) => {
                return b.saveScore - a.saveScore;
            }
            const saveArrSort = getlocalStorageData.sort(compareScore);

            for (let i = 0; i < saveArrSort.length; i++) {
                const h3 = document.createElement('h3');
                h3.textContent = `${i + 1} место - ${saveArrSort[i].saveName} (${saveArrSort[i].saveScore})` + '<br>';
                textTableRecords += h3.textContent;
            }

            tableRecords.innerHTML = textTableRecords;

            mainPage.style.display = 'none';
            tablePage.style.display = 'flex';
        } else {
            mainPage.style.display = 'none';
            tablePage.style.display = 'flex';
        }
    })

    // Закрытие таблицы рекордов
    back.addEventListener('click', () => {
        tablePage.style.display = 'none';
        gameover.style.display = 'none';
        mainPage.style.display = 'flex';
    })

    // Перезагрузка игры
    restart.addEventListener('click', () => {
        // остановка и перезапуск игрового цикла
        cancelAnimationFrame(timerRequestAnimation);
        if (timerId) {
            clearInterval(timerId);
        }
        gameover.style.display = 'none';
        wrapper.style.display = 'flex';
        startGame();
    })

    // Сохранение результатов
    save.addEventListener('click', () => {
        while (saveName === '') {
            saveName = prompt('Введите ваше имя', '');
        }

        if (saveName === null) {
            saveName = '';
            return;
        } else if (localStorage.saveResultsArr) {
            const localStorageData = JSON.parse(localStorage.saveResultsArr);

            localStorageData.push({
                saveName, saveScore
            });

            localStorage['saveResultsArr'] = JSON.stringify(localStorageData);
            saveName = '';
        } else {
            const saveResultsArr = [];
            saveResultsArr.push({
                saveName, saveScore
            });
            localStorage['saveResultsArr'] = JSON.stringify(saveResultsArr);
            saveName = '';
        }
    })

    //Возврат к главному меню 
    exit.addEventListener('click', () => {
        // Остановка игрового цикла
        cancelAnimationFrame(timerRequestAnimation);
        if (timerId) {
            clearInterval(timerId);
        }
        gameover.style.display = 'none';
        wrapper.style.display = 'none';
        mainPage.style.display = 'flex';
        mainMenuSound.play();
    })

    // Страница проигрыша
    const gameOverPage = (score) => {
        window.navigator.vibrate(1000);
        gameover.style.display = 'flex';
        points.innerHTML = `Ваш результат: ${score}`;
        saveScore = score;
    }

    // Функция игры
    const startGame = () => {

        //движение труб
        let runPipes = 2.5;

        // Получение контекста и задание размеров канвас
        const canvas = document.querySelector("#myCanvas"),
            context = canvas.getContext("2d");

        if (window.innerWidth < 900 && window.innerHeight < 500) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        } else if (window.innerWidth < window.innerHeight) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight / 2;
        } else {
            canvas.width = window.innerWidth / 1.5;
            canvas.height = window.innerHeight / 1.2;
            runPipes = 3.5;
        }


        // Изменение размеров экрана
        window.addEventListener('resize', () => {
            if (window.innerWidth < 900 && window.innerHeight < 500) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
            } else if (window.innerWidth < window.innerHeight) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight / 2;
            } else {
                canvas.width = window.innerWidth / 1.5;
                canvas.height = window.innerHeight / 1.2;
                runPipes = 3.5;
            }
        })


        // Загрузка изоражений
        const gameBack = new Image(),
            pipeUp = new Image(),
            pipeBottom = new Image(),
            block = new Image(),
            bird = new Image(),
            bomb = new Image();

        gameBack.src = 'image/back1.png';
        pipeUp.src = 'image/pipeUp.png';
        pipeBottom.src = 'image/pipeBottom.png';
        block.src = 'image/block.png';
        bird.src = 'image/bird.png';
        bomb.src = 'image/fire.png';


        // Загрузка аудио файлов
        const fireSound = new Audio(),
            flying = new Audio(),
            mainMenu = new Audio(),
            playGame = new Audio(),
            scoreSound = new Audio();

        fireSound.src = 'audio/boom.mp3';
        flying.src = 'audio/flying.mp3';
        mainMenu.src = 'audio/main_menu.mp3';
        playGame.src = 'audio/play_game.mp3';
        scoreSound.src = 'audio/score.mp3';


        // Игровые настройки карты и объектов
        let w = canvas.width,
            h = canvas.height,
            birdWidth = w * 0.10,
            birdHeight = h / 7,
            blockHeight = h / 6,
            pipeUpWidth = w / 11,
            pipeUpHeight = h * 0.45,
            pipeBottomWidth = w / 11,
            pipeBottomHeight = h / 1.3;


        // Величина просвета труб
        let hole = h * 0.2;


        // Массив труб
        const pipes = [];
        pipes[0] = {
            x: w / 1,
            y: 0,
        }


        // Позиции труб x и y
        let pipePositionX = 0,
            pipePositionY = 0;


        // Позиция птицы
        let birdPosX = w * 0.3,
            birdPosY = h * 0.3;


        // Сила притяжения
        let gravitation = 1;


        // Контроль сложности игры
        let gameHard = 0;


        // Время анимации и кадры спрайта птицы
        let timeAnimation = 0,
            birdSpraitPositionX = 12,
            birdFrame = 0,
            flyFrame = true;


        // Время анимации и кадры спрайта взрыва
        let timeAnimationBomb = 0,
            bombSpraitPositionX = 205,
            bombFrame = 0;


        // Музыка игры вкл и выкл
        let gameOpen = false;


        // Звук взрыва вкл и выкл
        let fireSoundOpen = false,
            fireSoundPaused = true;


        // Игра проиграна
        let gameOver = false,
            birdImage = true,
            openGameOverPage = false,
            pageOpen = true;


        // Подсчет очков
        let score = 0;


        // Слушитель на пробел
        document.addEventListener('keydown', (event) => {
            if (event.keyCode === 32) {
                if (flyFrame) {
                    flying.play();
                    birdPosY -= 33;
                    flyAnimation();
                }
            }
        })


        // Слушатель на мышь
        document.addEventListener('mousedown', () => {
            if (flyFrame) {
                flying.play();
                birdPosY -= 33;
                flyAnimation();
            }
        })


        // Воспроизведение игры после полной загрузки
        bomb.onload = () => {
            gameOpen = true;
            game();
        };


        // Запуск игры
        const game = () => {
            if (gameOpen) {
                playGame.play();
            } else {
                playGame.pause();
                playGame.currentTime = 0.0;
                fireSoundOpen = true;
            }

            if (fireSoundOpen && fireSoundPaused) {
                fireSound.play();
                fireSoundOpen = false;
                fireSoundPaused = false;
            }
            render();
            update();
            timerRequestAnimation = requestAnimationFrame(game) ||
                webkitRequestAnimationFrame(game) ||
                mozRequestAnimationFrame(game) ||
                oRequestAnimationFrame(game) ||
                msRequestAnimationFrame(game) ||
                function (callback) {
                    timerId = window.setTimeout(callback, 1000 / 60);
                };
        }


        // Условия касаний
        const update = () => {
            if (openGameOverPage && pageOpen) {
                pageOpen = false;
                gameOverPage(score);
            }

            if (birdPosX + (birdWidth / 1.3) >= pipePositionX && birdPosX <= pipePositionX + pipeUpWidth &&
                (birdPosY + (birdHeight / 2.6) <= pipePositionY + pipeUpHeight ||
                    (birdPosY + birdHeight / 1.3) >= pipePositionY + pipeUpHeight + hole) ||
                (birdPosY + birdHeight / 1.3) >= h - blockHeight) {
                runPipes = 0;
                birdPosY = birdPosY;
                gameOver = true;
                flyFrame = false;
                bombAnimation();
            } else {
                birdPosY += gravitation;
            }

            if (birdPosX + (birdWidth / 2) > pipePositionX + pipeUpWidth || birdPosX + (birdWidth / 2) > pipePositionX + pipeBottomWidth) {
                scoreSound.play();
                pipes.push({
                    x: w,
                    y: Math.floor(Math.random() * pipeUpHeight) - pipeUpHeight
                })
                score++;
                gameHard++;
                if (gameHard === 3) {
                    gravitation += 0.2;
                    runPipes += 0.5;
                    gameHard = 0;
                }
            }

            if (pipes.length === 5) {
                pipes.splice(0, 1);
            }
        }


        // Анимация птицы
        const flyAnimation = () => {
            if (timeAnimation > 1 && birdFrame < 5) {
                birdSpraitPositionX += 75;
                context.drawImage(bird, birdSpraitPositionX, 6, 62, 75, birdPosX, birdPosY, birdWidth, birdHeight);
                birdFrame++;
                timeAnimation = 0;
                requestAnimationFrame(flyAnimation);
            } else if (timeAnimation > 1 && birdFrame === 5) {
                birdSpraitPositionX = 12;
                context.drawImage(bird, birdSpraitPositionX, 6, 62, 75, birdPosX, birdPosY, birdWidth, birdHeight);
                birdFrame = 0;
                timeAnimation = 0;
                cancelAnimationFrame(flyAnimation);
            } else if (timeAnimation <= 1) {
                birdPosY -= 1;
                timeAnimation += 1;
                requestAnimationFrame(flyAnimation);
            }
        }


        //Анимация взрыва 
        const bombAnimation = () => {
            if (timeAnimationBomb > 14 && bombFrame < 9) {
                context.drawImage(bomb, bombSpraitPositionX, 17, 54, 51, birdPosX, birdPosY, birdWidth, birdHeight);
                bombSpraitPositionX += 55;
                bombFrame++;
                timeAnimationBomb = 0;
                requestAnimationFrame(bombAnimation);
            } else if (timeAnimationBomb > 14 && bombFrame === 9) {
                bombFrame = 0;
                timeAnimationBomb = 0;
                gameOver = false;
                birdImage = false;
                gameOpen = false;
                openGameOverPage = true;
                cancelAnimationFrame(bombAnimation);
            } else if (timeAnimationBomb <= 14) {
                context.drawImage(bomb, bombSpraitPositionX, 17, 54, 51, birdPosX, birdPosY, birdWidth, birdHeight);
                timeAnimationBomb += 1;
                requestAnimationFrame(bombAnimation);
            }
        }


        // Отрисовка
        const render = () => {
            context.clearRect(0, 0, w, h);
            context.drawImage(gameBack, 0, 0, w, h);
            for (let i = 0; i < pipes.length; i++) {
                pipePositionX = pipes[i].x;
                pipePositionY = pipes[i].y;
                context.drawImage(pipeUp, pipes[i].x, pipes[i].y, pipeUpWidth, pipeUpHeight);
                context.drawImage(pipeBottom, pipes[i].x, pipes[i].y + pipeUpHeight + hole, pipeBottomWidth, pipeBottomHeight);
                pipes[i].x -= runPipes;
            }
            context.drawImage(block, 164, 49, 512, 54, 0, h - blockHeight, w, blockHeight);
            if (!gameOver && birdImage) {
                context.drawImage(bird, birdSpraitPositionX, 6, 62, 75, birdPosX, birdPosY, birdWidth, birdHeight);
            }

            context.fillStyle = '#000';
            context.font = '24px Verdana';
            context.fillText('Счёт: ' + score, 0, h / 12);
        }
    }
})