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
    arcade: {
      gravity: { y: 1000 },
    },
  },
};

const game = new Phaser.Game(config);

let shooter, ball, court, cursors;
const keys = {};
let gameStarted = false;
let openingText;
const playerMovement = {
  jumpSpeed: 700,
  runSpeed: 350,
  slowdown: 50,
  bounce: 0,
};
const ballMovement = {
  bounce: 0.5,
  slowdown: 40,
};
let shooterPossession = true;

function preload() {
  this.load.image('ball', '../assets/images/ball.png');
  this.load.image('paddle', '../assets/images/paddle.png');
  this.load.image('court', '../assets/images/court.png');
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
    'paddle'
  );
  shooter.setCollideWorldBounds(true);
  shooter.setFrictionX(0.5);
  shooter.setBounce(playerMovement.bounce, playerMovement.bounce);

  ball = this.physics.add.sprite(0, 0, 'ball');
  const ballPos = getBallRelativeToShooter(ball, shooter);
  ball.body.x = ballPos.x;
  ball.body.y = ballPos.y;
  ball.setCollideWorldBounds(true);
  ball.setBounce(ballMovement.bounce, ballMovement.bounce);
  ball.setFrictionX(0.5);

  court = this.physics.add.sprite(
    this.physics.world.bounds.width / 2,
    this.physics.world.bounds.height - 80,
    'court'
  );
  court.setImmovable();
  court.setCollideWorldBounds(true);
  court.setFrictionX(1);

  cursors = this.input.keyboard.createCursorKeys();
  keys.w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  keys.s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

  this.physics.add.collider(ball, shooter, ballPlayerCollision);
  this.physics.add.collider(ball, court, courtBallCollision);
  this.physics.add.collider(shooter, court, playerCourtCollision);
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

function ballPlayerCollision(ball, player) {
  shooterPossession = true;
}
