import Phaser from 'phaser';
import ballImg from './assets/ball.png';
import playerImg from './assets/paddle.png';
import courtImg from './assets/court.png';
import backboardImg from './assets/backboard.png';
import rimImg from './assets/front-rim.png';

export default class Play extends Phaser.Scene {
  constructor() {
    super('gameplay');

    this.keys = {};
    this.playerMovement = {
      jumpSpeed: 700,
      ballJumpSpeed: 550,
      runSpeed: 350,
      slowdown: 50,
      bounce: 0,
      friction: 0.5,
      gravity: 1000,
    };

    this.ballMovement = {
      bounce: 0.5,
      slowdown: 40,
      gravity: 1000,
      dropSpeed: 50,
    };
    this.PLAYERS = {
      PLAYER1: 'player1',
      PLAYER2: 'player2',
    };

    this.player1;
    this.player2;
    this.ball;
    this.court;
    this.backboard;
    this.frontRim;
    this.backRim;
    this.player1ScoreText;
    this.player2ScoreText;

    this.gameState = {
      gameStarted: false,
      player1Possession: true,
      player2Possession: false,
      lastPossession: null,
      shooterPlayerNum: 0,
      score: [0, 0],
      justScored: false,
      wasAboveRim: false,
      wasAboveRimTimeout: null,
    };
  }

  preload() {
    this.load.image('ball', ballImg);
    this.load.image('player', playerImg);
    this.load.image('court', courtImg);
    this.load.image('backboard', backboardImg);
    this.load.image('solid-rim', rimImg);
  }

  create() {
    const player1Start = this.physics.world.bounds.width / 8;

    this.player1 = this.physics.add.sprite(
      player1Start,
      this.physics.world.bounds.height / 2,
      'player'
    );
    this.player1.setCollideWorldBounds(true);
    this.player1.setFrictionX(this.playerMovement.friction);
    this.player1.setBounce(
      this.playerMovement.bounce,
      this.playerMovement.bounce
    );
    this.player1.setGravityY(this.playerMovement.gravity);

    this.player2 = this.physics.add.sprite(
      this.physics.world.bounds.width * 0.75,
      this.physics.world.bounds.height / 2,
      'player'
    );
    this.player2.setCollideWorldBounds(true);
    this.player2.setFrictionX(this.playerMovement.friction);
    this.player2.setBounce(
      this.playerMovement.bounce,
      this.playerMovement.bounce
    );
    this.player2.setGravityY(this.playerMovement.gravity);

    this.ball = this.physics.add.sprite(0, 0, 'ball');
    const ballPos = this.getBallRelativeToShooter(this.ball, this.player1);
    this.ball.body.x = ballPos.x;
    this.ball.body.y = ballPos.y;
    this.ball.setCollideWorldBounds(true);
    this.ball.setBounce(this.ballMovement.bounce, this.ballMovement.bounce);
    this.ball.setFrictionX(0.5);
    this.ball.setGravityY(this.ballMovement.gravity);

    this.court = this.physics.add.sprite(
      this.physics.world.bounds.width / 2,
      this.physics.world.bounds.height - 50,
      'court'
    );
    this.court.setImmovable();
    this.court.setFrictionX(1);

    this.backboard = this.physics.add.sprite(
      this.physics.world.bounds.width * 0.95,
      this.physics.world.bounds.height * 0.5,
      'backboard'
    );
    this.backboard.setImmovable();
    this.frontRim = this.physics.add.sprite(
      this.physics.world.bounds.width * 0.95 - 90,
      this.physics.world.bounds.height * 0.55,
      'solid-rim'
    );
    this.frontRim.setImmovable();
    this.backRim = this.physics.add.sprite(
      this.physics.world.bounds.width * 0.95 - 10,
      this.physics.world.bounds.height * 0.55,
      'solid-rim'
    );
    this.backRim.setImmovable();

    this.keys = {
      ...this.input.keyboard.createCursorKeys(),
      w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    const halfcourt = this.physics.add.staticGroup();
    halfcourt.add(this.add.zone(400, 100, 1, 800));

    const halfcourtLine = new Phaser.Geom.Line(
      this.physics.world.bounds.width / 2,
      this.physics.world.bounds.height,
      this.physics.world.bounds.width / 2,
      this.physics.world.bounds.height - this.court.body.height
    );

    const halfcourtGraphics = this.add.graphics({
      lineStyle: { width: 2, color: 0xffffff },
    });

    halfcourtGraphics.strokeLineShape(halfcourtLine);

    const rimLine = new Phaser.Geom.Line(
      this.frontRim.x,
      this.frontRim.y,
      this.backRim.x,
      this.backRim.y
    );

    const rimGraphics = this.add.graphics({
      lineStyle: { width: this.frontRim.body.height, color: 0xf3af3d },
    });

    rimGraphics.strokeLineShape(rimLine);

    this.add.text(20, -100, 'Score', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });

    this.player1ScoreText = this.add.text(20, -70, 'Player 1: 0', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });

    this.player2ScoreText = this.add.text(20, -40, 'Player 2: 0', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });

    this.physics.add.collider(
      this.ball,
      this.player1,
      this.ballPlayer1Collision.bind(this)
    );
    this.physics.add.collider(
      this.ball,
      this.court,
      this.courtBallCollision.bind(this)
    );
    this.physics.add.collider(
      this.player1,
      this.court,
      this.playerCourtCollision.bind(this)
    );
    this.physics.add.collider(
      this.player2,
      this.court,
      this.playerCourtCollision.bind(this)
    );
    this.physics.add.collider(
      this.ball,
      this.player2,
      this.ballPlayer2Collision.bind(this)
    );
    this.physics.add.collider(this.ball, this.backboard);
    this.physics.add.collider(this.player2, this.frontRim);
    this.physics.add.collider(this.ball, this.frontRim);
    this.physics.add.collider(this.ball, this.backRim);
    this.physics.add.collider(this.player1, this.backboard);
    // this.physics.add.collider(this.player1, this.halfcourt);
  }

  update() {
    this.player1.body.setVelocityX(0);
    if (this.keys.a.isDown) {
      this.player1.body.setVelocityX(-this.playerMovement.runSpeed);
    } else if (this.keys.d.isDown) {
      this.player1.body.setVelocityX(this.playerMovement.runSpeed);
    }

    if (!this.gameState.justScored) {
      const scorer = this.getScorer();
      if (scorer === 0) {
        this.gameState.score[0] = this.gameState.score[0] + 1;
        this.player1ScoreText.text = this.getPlayerScoreText(0);
      } else if (scorer === 1) {
        this.gameState.score[1] = this.gameState.score[1] + 1;
        this.player2ScoreText.text = this.getPlayerScoreText(1);
      }
    }

    if (this.keys.w.isDown && this.player1.body.touching.down) {
      if (this.gameState.player1Possession) {
        this.player1.body.setVelocityY(-this.playerMovement.ballJumpSpeed);
      } else {
        this.player1.body.setVelocityY(-this.playerMovement.jumpSpeed);
      }
    } else if (this.keys.s.isDown && this.gameState.player1Possession) {
      this.gameState.player1Possession = false;
      this.ball.body.setVelocityX(this.getDropSpeed(this.player1).x);
      this.ball.body.setVelocityY(this.getDropSpeed(this.player1).y);
    }
    if (this.keys.space.isDown && this.gameState.player1Possession) {
      this.gameState.player1Possession = false;
      this.ball.body.setVelocityX(this.getShotSpeed(this.player1).x);
      this.ball.body.setVelocityY(this.getShotSpeed(this.player1).y);
    }

    this.player2.body.setVelocityX(0);
    if (this.keys.left.isDown) {
      this.player2.body.setVelocityX(-this.playerMovement.runSpeed);
    } else if (this.keys.right.isDown) {
      this.player2.body.setVelocityX(this.playerMovement.runSpeed);
    }

    if (this.keys.up.isDown && this.player2.body.touching.down) {
      this.player2.body.setVelocityY(-this.playerMovement.ballJumpSpeed);
    } else if (this.keys.down.isDown && this.gameState.player2Possession) {
      this.gameState.player2Possession = false;
      this.ball.body.setVelocityX(this.getDropSpeed(this.player2).x);
      this.ball.body.setVelocityY(this.getDropSpeed(this.player2).y);
    }
    if (this.keys.shift.isDown && this.gameState.player2Possession) {
      this.gameState.player2Possession = false;
      this.ball.body.setVelocityX(this.getShotSpeed(this.player2).x);
      this.ball.body.setVelocityY(this.getShotSpeed(this.player2).y);
    }

    if (this.gameState.player1Possession) {
      const ballPos = this.getBallRelativeToShooter(this.ball, this.player1);
      this.ball.body.x = ballPos.x;
      this.ball.body.y = ballPos.y;
    } else if (this.gameState.player2Possession) {
      const ballPos = this.getBallRelativeToShooter(this.ball, this.player2);
      this.ball.body.x = ballPos.x;
      this.ball.body.y = ballPos.y;
    }
  }

  getBallRelativeToShooter(ball, player) {
    return {
      x: player.body.x + player.body.width / 2 + this.ball.body.width / 2 + 1,
      y: player.body.y,
    };
  }

  getShotSpeed(player) {
    const shotSpeedBaseX = 400;
    const shotSpeedBaseY = 500;
    return {
      x: Math.max(player.body.velocity.x, 0) + shotSpeedBaseX,
      y: Math.min(player.body.velocity.y, 0) - shotSpeedBaseY,
    };
  }

  getDropSpeed(player) {
    const dropSpeedBase = 20;
    return {
      x: Math.max(player.body.velocity.x, 0) + 2 * dropSpeedBase,
      y: Math.min(player.body.velocity.y, 0) - dropSpeedBase,
    };
  }

  getPlayerScoreText(playerNum) {
    if (playerNum < 0 || playerNum > 1) {
      return 'Player score: 💔';
    }
    return `Player ${playerNum + 1}: ${this.gameState.score[playerNum]}`;
  }

  getScorer() {
    const isAboveTheRim = this.ball.body.y < this.frontRim.body.y;
    if (isAboveTheRim) {
      this.wasAboveRim = true;

      if (this.wasAboveRimTimeout) {
        clearTimeout(this.wasAboveRimTimeout);
      }

      this.wasAboveRimTimeout = setTimeout(() => {
        this.wasAboveRim = false;
      }, 200);

      return;
    }

    const noOneHasPossession =
      !this.gameState.player1Possession && !this.gameState.player2Possession;
    const isBallInTheCylinder =
      this.ball.body.x > this.frontRim.body.x &&
      this.ball.body.x < this.backRim.body.x;
    const isGoingDown = this.ball.body.velocity.y > 0;
    const isAboveBackboardBottom =
      this.ball.body.y <
      this.backRim.body.y + this.backRim.body.height + this.ball.body.height;

    const pointScored =
      isBallInTheCylinder &&
      noOneHasPossession &&
      isGoingDown &&
      this.wasAboveRim &&
      isAboveBackboardBottom;

    if (!pointScored) {
      return;
    }

    this.gameState.justScored = true;
    setTimeout(() => {
      this.gameState.justScored = false;
    }, 500);

    if (this.gameState.lastPossession === this.PLAYERS.PLAYER1) {
      return 0;
    } else {
      return 1;
    }
  }

  playerCourtCollision(player, court) {
    if (player.body.y > this.court.body.y - player.body.height / 2) {
      player.body.y = this.court.body.y - player.body.height;
    }
  }

  courtBallCollision(court, ball) {
    // Ball friction on court
    if (ball.body.velocity.x > 0) {
      ball.body.setVelocityX(
        Math.max(ball.body.velocity.x - this.ballMovement.slowdown, 0)
      );
    } else if (ball.body.velocity.x < 0) {
      ball.body.setVelocityX(
        Math.min(ball.body.velocity.x + this.ballMovement.slowdown, 0)
      );
    }
  }

  ballPlayer1Collision(ball, player) {
    this.gameState.player1Possession = true;
    this.gameState.lastPossession = this.PLAYERS.PLAYER1;
    this.gameState.player2Possession = false;
  }

  ballPlayer2Collision(ball, player) {
    this.gameState.player2Possession = true;
    this.gameState.lastPossession = this.PLAYERS.PLAYER2;
    this.gameState.player1Possession = false;
  }
}
