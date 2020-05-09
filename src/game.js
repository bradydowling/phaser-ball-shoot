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
  jumpSpeed: 500,
  runSpeed: 350,
  slowdown: 50,
  bounce: 0.2,
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
    y: shooter.body.y + ball.body.height / 2,
  };
}

function create() {
  const shooterStart = this.physics.world.bounds.width / 8;

  shooter = this.physics.add.sprite(
    shooterStart, // x position
    this.physics.world.bounds.height / 2, // y position
    'paddle' // key of image for the sprite
  );

  ball = this.physics.add.sprite(
    0, // x position
    0, // y position
    'ball' // key of image for the sprite
  );
  const ballPos = getBallRelativeToShooter(ball, shooter);
  ball.body.x = ballPos.x;
  ball.body.y = ballPos.y;

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

  shooter.setCollideWorldBounds(true);
  shooter.setFrictionX(0.5);
  ball.setCollideWorldBounds(true);
  ball.setBounce(ballMovement.bounce, ballMovement.bounce);
  ball.setFrictionX(0.5);
  shooter.setBounce(playerMovement.bounce, playerMovement.bounce);
  this.physics.add.collider(ball, shooter, ballPlayerCollision);
  this.physics.add.collider(ball, court, courtBallCollision);
  this.physics.add.collider(shooter, court, playerCourtCollision);

  // openingText = this.add.text(
  //   this.physics.world.bounds.width / 2,
  //   this.physics.world.bounds.height / 2,
  //   'Press SPACE to Start',
  //   {
  //     fontFamily: 'Monaco, Courier, monospace',
  //     fontSize: '50px',
  //     fill: '#fff',
  //   }
  // );

  // openingText.setOrigin(0.5);
}

function update() {
  // if (!gameStarted) {
  //   ball.setVisible(false);
  //   if (cursors.space.isDown) {
  //     ball.setVisible(true);
  //     gameStarted = true;
  //     openingText.setVisible(false);
  //   }
  // }

  if (cursors.left.isDown) {
    shooter.body.setVelocityX(-playerMovement.runSpeed);
  } else if (cursors.right.isDown) {
    shooter.body.setVelocityX(playerMovement.runSpeed);
  }

  if (cursors.up.isDown && shooter.body.touching.down) {
    shooter.body.setVelocityY(-playerMovement.jumpSpeed);
  }

  if (shooterPossession) {
    const ballPos = getBallRelativeToShooter(ball, shooter);
    ball.body.x = ballPos.x;
    ball.body.y = ballPos.y;
  }
}

function playerCourtCollision(player, court) {
  if (player.body.velocity.x > 0) {
    player.body.velocity.x = Math.max(
      player.body.velocity.x - playerMovement.slowdown,
      0
    );
  } else if (player.body.velocity.x < 0) {
    player.body.velocity.x = Math.min(
      player.body.velocity.x + playerMovement.slowdown,
      0
    );
  }
}

function courtBallCollision(court, ball) {
  // console.log(court, player);
  if (ball.body.velocity.x > 0) {
    ball.body.velocity.x = Math.max(
      ball.body.velocity.x - ballMovement.slowdown,
      0
    );
  } else if (ball.body.velocity.x < 0) {
    ball.body.velocity.x = Math.min(
      ball.body.velocity.x + ballMovement.slowdown,
      0
    );
  }
}

function ballPlayerCollision(ball, player) {
  // console.log(court, player);
}
