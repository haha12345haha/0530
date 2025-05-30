// 認字高手 - 改良版 sketch.js

let video;
let handpose;
let hands = [];

let wordBank = [
  {
    english: "analyze",
    correct: "分析",
    options: ["觀察", "比較", "分析"]
  },
  {
    english: "design",
    correct: "設計",
    options: ["計畫", "發明", "設計"]
  },
  {
    english: "development",
    correct: "發展",
    options: ["培養", "創新", "發展"]
  },
  {
    english: "implement",
    correct: "實施",
    options: ["規劃", "執行", "實施"]
  },
  {
    english: "evaluate",
    correct: "評鑑",
    options: ["審查", "調查", "評鑑"]
  }
];

let currentQuestion;
let optionBoxes = [];
let score = 0;
let isAnswered = false;
let answerCooldown = 0;
let questionIndex = 0;
let timer = 10 * 60; // 10 秒換算成 frame
let gameOver = false;

function setup() {
  createCanvas(640, 480);
  video = createCapture(VIDEO);
  video.size(width, height);
  video.hide();
  handpose = ml5.handpose(video, modelReady);
}

function modelReady() {
  console.log("✅ Handpose 模型已載入");
  handpose.on("predict", gotHands);
  pickNextQuestion();
}

function gotHands(results) {
  hands = results;
}

function draw() {
  // 翻轉鏡頭畫面
  push();
  translate(width, 0);
  scale(-1, 1);
  image(video, 0, 0);
  pop();

  if (gameOver) {
    // 遊戲結束畫面
    fill(0, 150);
    rect(0, 0, width, height);
    fill(255);
    textSize(48);
    textAlign(CENTER, CENTER);
    textFont("標楷體");
    text("🎉 遊戲結束 🎉", width / 2, height / 2 - 50);
    text(`🏆 總分: ${score} / ${wordBank.length} 🏆`, width / 2, height / 2 + 20);
    text("👏 謝謝遊玩！👏", width / 2, height / 2 + 90);
    return;
  }

  drawHandKeypoints();

  // 顯示題目文字框
  fill(255);
  stroke(0);
  strokeWeight(2);
  rectMode(CENTER);
  rect(width / 2, 50, 300, 50, 10);
  fill(0);
  noStroke();
  textSize(30);
  textAlign(CENTER, CENTER);
  textFont("標楷體");
  if (currentQuestion) {
    text(currentQuestion.english, width / 2, 50);
  }

  // 顯示倒數計時文字框
  fill(255);
  stroke(0);
  strokeWeight(2);
  rectMode(CENTER);
  rect(width / 2, 120, 300, 50, 10);
  fill(0);
  noStroke();
  textSize(24);
  textAlign(CENTER, CENTER);
  textFont("標楷體");
  text(`⏱️ ${(timer / 60).toFixed(0)} 秒`, width / 2, 120);

  // 顯示選項
  for (let box of optionBoxes) {
    box.show();
  }

  // 偵測食指點擊
  if (!isAnswered && hands.length > 0) {
    let hand = hands[0];
    if (hand.annotations && hand.annotations.indexFinger) {
      let indexTip = hand.annotations.indexFinger[3];
      let flippedX = width - indexTip[0];
      let flippedY = indexTip[1];
      for (let box of optionBoxes) {
        if (box.contains(flippedX, flippedY)) {
          box.checkAnswer();
          isAnswered = true;
          answerCooldown = 60;
          break;
        }
      }
    }
  }

  // 顯示分數
  fill(255);
  stroke(0);
  strokeWeight(2);
  rectMode(CORNER);
  rect(10, height - 50, 150, 40, 10);
  fill(0);
  noStroke();
  textSize(28);
  textAlign(LEFT, CENTER);
  textFont("標楷體");
  text(`分數: ${score}`, 20, height - 30);

  // 倒數計時與下一題
  if (!isAnswered) {
    timer--;
    if (timer <= 0) {
      isAnswered = true;
      answerCooldown = 60;
    }
  } else {
    answerCooldown--;
    if (answerCooldown <= 0) {
      nextQuestion();
    }
  }
}

function drawHandKeypoints() {
  for (let hand of hands) {
    if (hand.landmarks) {
      for (let i = 0; i < hand.landmarks.length; i++) {
        let [x, y] = hand.landmarks[i];
        let flippedX = width - x;
        fill(0, 255, 255);
        noStroke();
        circle(flippedX, y, 10);
      }
    }
  }
}

function pickNextQuestion() {
  currentQuestion = wordBank[questionIndex];
  let shuffledOptions = shuffle([...currentQuestion.options]);
  optionBoxes = [];

  let spacing = width / shuffledOptions.length;
  for (let i = 0; i < shuffledOptions.length; i++) {
    let label = shuffledOptions[i];
    let x = spacing / 2 + i * spacing;
    let y = height / 2 + 80;
    optionBoxes.push(new OptionBox(x, y, label, label === currentQuestion.correct));
  }
  timer = 10 * 60;
}

function nextQuestion() {
  questionIndex++;
  if (questionIndex >= wordBank.length) {
    gameOver = true;
  } else {
    isAnswered = false;
    pickNextQuestion();
  }
}

class OptionBox {
  constructor(x, y, label, isCorrect) {
    this.x = x;
    this.y = y;
    this.label = label;
    this.isCorrect = isCorrect;
    this.w = 120;
    this.h = 80;
    this.color = color(255);
  }

  show() {
    fill(this.color);
    stroke(0);
    strokeWeight(2);
    rectMode(CENTER);
    rect(this.x, this.y, this.w, this.h, 12);
    fill(0);
    noStroke();
    textSize(24);
    textAlign(CENTER, CENTER);
    textFont("標楷體");
    text(this.label, this.x, this.y);
  }

  contains(px, py) {
    return (
      px > this.x - this.w / 2 &&
      px < this.x + this.w / 2 &&
      py > this.y - this.h / 2 &&
      py < this.y + this.h / 2
    );
  }

  checkAnswer() {
    if (this.isCorrect) {
      this.color = color(0, 255, 0);
      score++;
    } else {
      this.color = color(255, 0, 0);
    }
  }
}