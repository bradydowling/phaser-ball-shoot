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

let player, ball, court, cursors;
const keys = {};
let gameStarted = false;
let openingText;
const playerMovement = {
  jumpSpeed: 3000,
  runSpeed: 350,
  slowdown: 50,
  bounce: 0.2,
};
const ballMovement = {
  bounce: 0.5,
};

function preload() {
  this.load.image('ball', '../assets/images/ball.png');
  this.load.image('paddle', '../assets/images/paddle.png');
  this.load.image('court', '../assets/images/court.png');
}

function create() {
  ball = this.physics.add.sprite(
    this.physics.world.bounds.width / 2, // x position
    this.physics.world.bounds.height / 10, // y position
    'ball' // key of image for the sprite
  );

  player1 = this.physics.add.sprite(
    this.physics.world.bounds.width - (ball.body.width / 2 + 1), // x position
    this.physics.world.bounds.height / 2, // y position
    'paddle' // key of image for the sprite
  );

  court = this.physics.add.sprite(
    this.physics.world.bounds.width / 2,
    this.physics.world.bounds.height - 80,
    'court'
  );
  court.setImmovable(true);
  court.setCollideWorldBounds(true);
  court.setFrictionX(1);

  cursors = this.input.keyboard.createCursorKeys();
  keys.w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  keys.s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

  player1.setCollideWorldBounds(true);
  player1.setFrictionX(0.5);
  ball.setCollideWorldBounds(true);
  ball.setBounce(ballMovement.bounce, ballMovement.bounce);
  player1.setBounce(playerMovement.bounce, playerMovement.bounce);
  this.physics.add.collider(ball, player1, null, null, this);
  this.physics.add.collider(ball, court, null, null, this);
  this.physics.add.collider(player1, court, playerCourtCollision, null, this);

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
    player1.body.setVelocityX(-playerMovement.runSpeed);
  } else if (cursors.right.isDown) {
    player1.body.setVelocityX(playerMovement.runSpeed);
  } else if (Phaser.Input.Keyboard.JustDown(cursors.up)) {
    if (player1.body.touching.down) {
      player1.body.setVelocityY(playerMovement.jumpSpeed);
    }
  }
}

function playerCourtCollision(court, player) {
  // console.log(court, player);
}
