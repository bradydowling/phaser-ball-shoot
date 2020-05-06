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
      gravity: false,
    },
  },
};

const game = new Phaser.Game(config);

let player, ball, cursors;
const keys = {};
let gameStarted = false;
let openingText, player1VictoryText, player2VictoryText;

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

  player2 = this.physics.add.sprite(
    ball.body.width / 2 + 1, // x position
    this.physics.world.bounds.height / 2, // y position
    'paddle' // key of image for the sprite
  );

  cursors = this.input.keyboard.createCursorKeys();
  keys.w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
  keys.s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);

  player1.setCollideWorldBounds(true);
  player2.setCollideWorldBounds(true);
  ball.setCollideWorldBounds(true);
  ball.setBounce(1, 1);
  player1.setImmovable(true);
  player2.setImmovable(true);
  this.physics.add.collider(ball, player1, null, null, this);
  this.physics.add.collider(ball, player2, null, null, this);

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

  // Create player 1 victory text
  player1VictoryText = this.add.text(
    this.physics.world.bounds.width / 2,
    this.physics.world.bounds.height / 2,
    'Point for player 1!',
    {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '50px',
      fill: '#fff',
    }
  );

  player1VictoryText.setOrigin(0.5);

  // Make it invisible until the player loses
  player1VictoryText.setVisible(false);

  // Create the game won text
  player2VictoryText = this.add.text(
    this.physics.world.bounds.width / 2,
    this.physics.world.bounds.height / 2,
    'Point for player 2!',
    {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '50px',
      fill: '#fff',
    }
  );

  player2VictoryText.setOrigin(0.5);

  // Make it invisible until the player wins
  player2VictoryText.setVisible(false);
}

function update() {
  if (isPlayer1Point()) {
    player1VictoryText.setVisible(true);
    ball.disableBody(true, true);
    return;
  }
  if (isPlayer2Point()) {
    player2VictoryText.setVisible(true);
    ball.disableBody(true, true);
    return;
  }

  player1.body.setVelocityY(0);
  player2.body.setVelocityY(0);

  if (cursors.up.isDown) {
    player1.body.setVelocityY(-350);
  } else if (cursors.down.isDown) {
    player1.body.setVelocityY(350);
  }
  // TODO: Allow player to move forward

  if (keys.w.isDown) {
    player2.body.setVelocityY(-350);
  } else if (keys.s.isDown) {
    player2.body.setVelocityY(350);
  }
  // TODO: Allow player to move forward

  if (!gameStarted) {
    if (cursors.space.isDown) {
      ball.setVisible(true);
      gameStarted = true;
      const initialXSpeed = Math.random() * 200 + 50;
      const initialYSpeed = Math.random() * 200 + 50;
      ball.setVelocityX(initialXSpeed);
      ball.setVelocityY(initialYSpeed);
      openingText.setVisible(false);
    }
  }
}

function isPlayer1Point() {
  return ball.body.x < player2.body.x;
}

function isPlayer2Point() {
  return ball.body.x > player1.body.x;
}

function hitPlayer(ball, player) {
  // custom logic for changing ball x or y velocity
}
