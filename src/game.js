const config = {
  type: Phaser.AUTO,
  parent: 'game',
  width: 800,
  height: 640,
  scale: {
    mode: Phaser.Scale.RESIZE,
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: {
    preload,
    create,
    update,
  },
  physics: {
    default: 'arcade',
  },
};

const game = new Phaser.Game(config);

const keys = {};
const playerMovement = {
  jumpSpeed: 700,
  ballJumpSpeed: 550,
  runSpeed: 350,
  slowdown: 50,
  bounce: 0,
  friction: 0.5,
  gravity: 1000,
};

const ballMovement = {
  bounce: 0.5,
  slowdown: 40,
  gravity: 1000,
  dropSpeed: 50,
};
const PLAYERS = {
  SHOOTER: 'shooter',
  REBOUNDER: 'rebounder',
};

let shooter, rebounder, ball, court, cursors, backboard, frontRim, backRim;
let player1ScoreText, player2ScoreText;

const gameState = {
  gameStarted: false,
  shooterPossession: true,
  rebounderPossession: false,
  lastPossession: null,
  shooterPlayerNum: 0,
  score: [0, 0],
  justScored: false,
};

function preload() {
  this.load.image('ball', '../assets/ball.png');
  this.load.image('player', '../assets/paddle.png');
  this.load.image('court', '../assets/court.png');
  this.load.image('backboard', '../assets/backboard.png');
  this.load.image('solid-rim', '../assets/front-rim.png');
}
function getBallRelativeToShooter(ball, shooter) {
  return {
    x: shooter.body.x + shooter.body.width / 2 + ball.body.width / 2 + 1,
    y: shooter.body.y,
  };
}

function getShotSpeed(shooter) {
  const shotSpeedBaseX = 400;
  const shotSpeedBaseY = 500;
  return {
    x: Math.max(shooter.body.velocity.x, 0) + shotSpeedBaseX,
    y: Math.min(shooter.body.velocity.y, 0) - shotSpeedBaseY,
  };
}

function getDropSpeed(shooter) {
  const dropSpeedBase = 20;
  return {
    x: Math.max(shooter.body.velocity.x, 0) + 2 * dropSpeedBase,
    y: Math.min(shooter.body.velocity.y, 0) - dropSpeedBase,
  };
}

function getPlayerScoreText(playerNum) {
  if (playerNum < 0 || playerNum > 1) {
    return 'Player score: 💔';
  }
  return `Player ${playerNum + 1}: ${gameState.score[playerNum]}`;
}

function create() {
  const shooterStart = this.physics.world.bounds.width / 8;

  shooter = this.physics.add.sprite(
    shooterStart,
    this.physics.world.bounds.height / 2,
    'player'
  );
  shooter.setCollideWorldBounds(true);
  shooter.setFrictionX(playerMovement.friction);
  shooter.setBounce(playerMovement.bounce, playerMovement.bounce);
  shooter.setGravityY(playerMovement.gravity);

  rebounder = this.physics.add.sprite(
    this.physics.world.bounds.width * 0.75,
    this.physics.world.bounds.height / 2,
    'player'
  );
  rebounder.setCollideWorldBounds(true);
  rebounder.setFrictionX(playerMovement.friction);
  rebounder.setBounce(playerMovement.bounce, playerMovement.bounce);
  rebounder.setGravityY(playerMovement.gravity);

  ball = this.physics.add.sprite(0, 0, 'ball');
  const ballPos = getBallRelativeToShooter(ball, shooter);
  ball.body.x = ballPos.x;
  ball.body.y = ballPos.y;
  ball.setCollideWorldBounds(true);
  ball.setBounce(ballMovement.bounce, ballMovement.bounce);
  ball.setFrictionX(0.5);
  ball.setGravityY(ballMovement.gravity);

  court = this.physics.add.sprite(
    this.physics.world.bounds.width / 2,
    this.physics.world.bounds.height - 50,
    'court'
  );
  court.setImmovable();
  court.setFrictionX(1);

  backboard = this.physics.add.sprite(
    this.physics.world.bounds.width * 0.95,
    this.physics.world.bounds.height * 0.5,
    'backboard'
  );
  backboard.setImmovable();
  frontRim = this.physics.add.sprite(
    this.physics.world.bounds.width * 0.95 - 90,
    this.physics.world.bounds.height * 0.55,
    'solid-rim'
  );
  frontRim.setImmovable();
  backRim = this.physics.add.sprite(
    this.physics.world.bounds.width * 0.95 - 10,
    this.physics.world.bounds.height * 0.55,
    'solid-rim'
  );
  backRim.setImmovable();

  cursors = this.input.keyboard.createCursorKeys();
  keys.w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  keys.a = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
  keys.s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
  keys.d = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

  const halfcourt = this.physics.add.staticGroup();
  halfcourt.add(this.add.zone(400, 100, 1, 800));

  const halfcourtLine = new Phaser.Geom.Line(
    this.physics.world.bounds.width / 2,
    this.physics.world.bounds.height,
    this.physics.world.bounds.width / 2,
    this.physics.world.bounds.height - court.body.height
  );

  const halfcourtGraphics = this.add.graphics({
    lineStyle: { width: 2, color: 0xffffff },
  });

  halfcourtGraphics.strokeLineShape(halfcourtLine);

  const rimLine = new Phaser.Geom.Line(
    frontRim.x,
    frontRim.y,
    backRim.x,
    backRim.y
  );

  const rimGraphics = this.add.graphics({
    lineStyle: { width: frontRim.body.height, color: 0xf3af3d },
  });

  rimGraphics.strokeLineShape(rimLine);

  scoreHeadingText = this.add.text(20, -80, 'Score', {
    fontFamily: 'Monaco, Courier, monospace',
    fontSize: '20px',
    fill: '#fff',
  });

  player1ScoreText = this.add.text(20, -50, 'Player 1: 0', {
    fontFamily: 'Monaco, Courier, monospace',
    fontSize: '20px',
    fill: '#fff',
  });

  player2ScoreText = this.add.text(20, -20, 'Player 2: 0', {
    fontFamily: 'Monaco, Courier, monospace',
    fontSize: '20px',
    fill: '#fff',
  });

  this.physics.add.collider(ball, shooter, ballShooterCollision);
  this.physics.add.collider(ball, court, courtBallCollision);
  this.physics.add.collider(shooter, court, playerCourtCollision);
  this.physics.add.collider(rebounder, court, playerCourtCollision);
  this.physics.add.collider(ball, rebounder, ballRebounderCollision);
  this.physics.add.collider(ball, backboard);
  this.physics.add.collider(rebounder, frontRim);
  this.physics.add.collider(ball, frontRim);
  this.physics.add.collider(ball, backRim);
  this.physics.add.collider(shooter, backboard);
  // this.physics.add.collider(shooter, halfcourt);
}

function getScorer() {
  const pointScored =
    ball.body.velocity.y > 0 &&
    ball.body.x > frontRim.body.x &&
    ball.body.x < backRim.body.x &&
    ball.body.y > frontRim.body.y &&
    ball.body.y < frontRim.body.y + frontRim.body.height / 2 &&
    !gameState.shooterPossession &&
    !gameState.rebounderPossession;
  if (!pointScored) {
    return;
  }

  gameState.justScored = true;
  setTimeout(() => {
    gameState.justScored = false;
  }, 500);

  if (
    (gameState.lastPossession === PLAYERS.SHOOTER &&
      gameState.shooterPlayerNum === 0) ||
    (gameState.lastPossession !== PLAYERS.SHOOTER &&
      gameState.shooterPlayerNum !== 0)
  ) {
    return 0;
  } else {
    return 1;
  }
}

function update() {
  shooter.body.setVelocityX(0);
  if (keys.a.isDown) {
    shooter.body.setVelocityX(-playerMovement.runSpeed);
  } else if (keys.d.isDown) {
    shooter.body.setVelocityX(playerMovement.runSpeed);
  }

  if (!gameState.justScored) {
    const scorer = getScorer();
    if (scorer === 0) {
      gameState.score[0] = gameState.score[0] + 1;
      player1ScoreText.text = getPlayerScoreText(0);
    } else if (scorer === 1) {
      gameState.score[1] = gameState.score[1] + 1;
      player2ScoreText.text = getPlayerScoreText(1);
    }
  }

  if (keys.w.isDown && shooter.body.touching.down) {
    if (gameState.shooterPossession) {
      shooter.body.setVelocityY(-playerMovement.ballJumpSpeed);
    } else {
      shooter.body.setVelocityY(-playerMovement.jumpSpeed);
    }
  } else if (keys.s.isDown && gameState.shooterPossession) {
    gameState.shooterPossession = false;
    ball.body.setVelocityX(getDropSpeed(shooter).x);
    ball.body.setVelocityY(getDropSpeed(shooter).y);
  }
  if (cursors.space.isDown && gameState.shooterPossession) {
    gameState.shooterPossession = false;
    ball.body.setVelocityX(getShotSpeed(shooter).x);
    ball.body.setVelocityY(getShotSpeed(shooter).y);
  }

  rebounder.body.setVelocityX(0);
  if (cursors.left.isDown) {
    rebounder.body.setVelocityX(-playerMovement.runSpeed);
  } else if (cursors.right.isDown) {
    rebounder.body.setVelocityX(playerMovement.runSpeed);
  }

  if (cursors.up.isDown && rebounder.body.touching.down) {
    rebounder.body.setVelocityY(-playerMovement.ballJumpSpeed);
  } else if (cursors.down.isDown && gameState.rebounderPossession) {
    gameState.rebounderPossession = false;
    ball.body.setVelocityX(getDropSpeed(rebounder).x);
    ball.body.setVelocityY(getDropSpeed(rebounder).y);
  }
  if (cursors.shift.isDown && gameState.rebounderPossession) {
    gameState.rebounderPossession = false;
    ball.body.setVelocityX(getShotSpeed(rebounder).x);
    ball.body.setVelocityY(getShotSpeed(rebounder).y);
  }

  if (gameState.shooterPossession) {
    const ballPos = getBallRelativeToShooter(ball, shooter);
    ball.body.x = ballPos.x;
    ball.body.y = ballPos.y;
  } else if (gameState.rebounderPossession) {
    const ballPos = getBallRelativeToShooter(ball, rebounder);
    ball.body.x = ballPos.x;
    ball.body.y = ballPos.y;
  }
}

function playerCourtCollision(player, court) {}

function courtBallCollision(court, ball) {
  // Ball friction on court
  if (ball.body.velocity.x > 0) {
    ball.body.setVelocityX(
      Math.max(ball.body.velocity.x - ballMovement.slowdown, 0)
    );
  } else if (ball.body.velocity.x < 0) {
    ball.body.setVelocityX(
      Math.min(ball.body.velocity.x + ballMovement.slowdown, 0)
    );
  }
}

function ballShooterCollision(ball, player) {
  gameState.shooterPossession = true;
  gameState.lastPossession = PLAYERS.SHOOTER;
  gameState.rebounderPossession = false;
}

function ballRebounderCollision(ball, player) {
  gameState.rebounderPossession = true;
  gameState.lastPossession = PLAYERS.REBOUNDER;
  gameState.shooterPossession = false;
}
