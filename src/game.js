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

let shooter, rebounder, ball, court, cursors, backboard, frontRim, backRim;
const keys = {};
let gameStarted = false;
let openingText;
const playerMovement = {
  jumpSpeed: 700,
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
};
let shooterPossession = true;
let rebounderPossession = false;

function preload() {
  this.load.image('ball', '../assets/images/ball.png');
  this.load.image('player', '../assets/images/paddle.png');
  this.load.image('court', '../assets/images/court.png');
  this.load.image('backboard', '../assets/images/backboard.png');
  this.load.image('solid-rim', '../assets/images/front-rim.png');
}
function getBallRelativeToShooter(ball, shooter) {
  return {
    x: shooter.body.x + shooter.body.width / 2 + ball.body.width / 2 + 1,
    y: shooter.body.y,
  };
}

function getShotSpeed(shooter) {
  return {
    x: Math.max(shooter.body.velocity.x, 0) + 400,
    y: Math.min(shooter.body.velocity.y, 0) - 500,
  };
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
  keys.s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

  this.physics.add.collider(ball, shooter, ballShooterCollision);
  this.physics.add.collider(ball, court, courtBallCollision);
  this.physics.add.collider(shooter, court, playerCourtCollision);
  this.physics.add.collider(rebounder, court, playerCourtCollision);
  this.physics.add.collider(ball, rebounder, ballRebounderCollision);
  this.physics.add.collider(ball, backboard);
  this.physics.add.collider(ball, frontRim);
  this.physics.add.collider(ball, backRim);
  this.physics.add.collider(shooter, backboard);

  const halfcourtLine = new Phaser.Geom.Line(
    this.physics.world.bounds.width / 2,
    this.physics.world.bounds.height - court.body.height,
    this.physics.world.bounds.width / 2,
    0
  );

  const halfcourtGraphics = this.add.graphics({
    lineStyle: { width: 2, color: 0xaaaaaa },
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
}

function update() {
  shooter.body.setVelocityX(0);
  if (cursors.left.isDown) {
    shooter.body.setVelocityX(-playerMovement.runSpeed);
  } else if (cursors.right.isDown) {
    shooter.body.setVelocityX(playerMovement.runSpeed);
  }

  if (cursors.up.isDown && shooter.body.touching.down) {
    if (shooterPossession) {
      shooter.body.setVelocityY(-(playerMovement.jumpSpeed - 150));
    } else {
      shooter.body.setVelocityY(-playerMovement.jumpSpeed);
    }
  }
  if (cursors.space.isDown && shooterPossession) {
    shooterPossession = false;
    ball.body.setVelocityX(getShotSpeed(shooter).x);
    ball.body.setVelocityY(getShotSpeed(shooter).y);
  }

  if (shooterPossession) {
    const ballPos = getBallRelativeToShooter(ball, shooter);
    ball.body.x = ballPos.x;
    ball.body.y = ballPos.y;
  } else if (rebounderPossession) {
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
  shooterPossession = true;
  rebounderPossession = false;
}

function ballRebounderCollision(ball, player) {
  rebounderPossession = true;
  shooterPossession = false;
}
