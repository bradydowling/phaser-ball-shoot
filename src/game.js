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
      gravity: { y: 500 },
    },
  },
};

const game = new Phaser.Game(config);

let player, ball, cursors;
const keys = {};
let gameStarted = false;
let openingText;

function preload() {
  this.load.image('ball', '../assets/images/ball.png');
  this.load.image('paddle', '../assets/images/paddle.png');
}

function create() {
  ball = this.physics.add.sprite(
    this.physics.world.bounds.width / 2, // x position
    this.physics.world.bounds.height / 2, // y position
    'ball' // key of image for the sprite
  );
  ball.setVisible(false);

  player1 = this.physics.add.sprite(
    this.physics.world.bounds.width - (ball.body.width / 2 + 1), // x position
    this.physics.world.bounds.height / 2, // y position
    'paddle' // key of image for the sprite
  );

  cursors = this.input.keyboard.createCursorKeys();
  keys.w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  keys.s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

  player1.setCollideWorldBounds(true);
  ball.setCollideWorldBounds(true);
  ball.setBounce(0.9, 0.9);
  player1.setImmovable(false);
  this.physics.add.collider(ball, player1, null, null, this);

  openingText = this.add.text(
    this.physics.world.bounds.width / 2,
    this.physics.world.bounds.height / 2,
    'Press SPACE to Start',
    {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '50px',
      fill: '#fff',
    }
  );

  openingText.setOrigin(0.5);
}

function update() {
  player1.body.setVelocityY(0);
  player1.body.setVelocityX(0);

  if (cursors.up.isDown) {
    player1.body.setVelocityY(-350);
  } else if (cursors.down.isDown) {
    player1.body.setVelocityY(350);
  } else if (cursors.left.isDown) {
    player1.body.setVelocityX(-350);
  } else if (cursors.right.isDown) {
    player1.body.setVelocityX(350);
  }

  if (!gameStarted) {
    if (cursors.space.isDown) {
      ball.setVisible(true);
      gameStarted = true;
      openingText.setVisible(false);
    }
  }
}

function hitPlayer(ball, player) {
  // custom logic for changing ball x or y velocity
}
