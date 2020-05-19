import Phaser from 'phaser';
import ballImg from './assets/ball.png';
import playerImg from './assets/paddle.png';
import player2Img from './assets/paddle-2.png';
import courtImg from './assets/court.png';
import backboardImg from './assets/backboard.png';
import rimImg from './assets/front-rim.png';
import rimBounceSound from './assets/rim-bounce.m4a';
import ballBounceSound from './assets/ball-bounce.m4a';

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
    this.playerScoreText = [];
    this.shootingSpots = [0, 0, 0];
    this.soundEffects = {};

    this.gameState = {
      gameStarted: false,
      player1Possession: true,
      player2Possession: false,
      lastPossession: null,
      score: [0, 0],
      justScored: false,
      wasAboveRim: false,
      wasAboveRimTimeout: null,
      shootingSpotNum: 0,
      shotNum: 0,
      gameOver: false,
      canRebounderScore: true,
    };
  }

  preload() {
    this.load.image('ball', ballImg);
    this.load.image('player', playerImg);
    this.load.image('player2', player2Img);
    this.load.image('court', courtImg);
    this.load.image('backboard', backboardImg);
    this.load.image('solid-rim', rimImg);
    this.load.audio('rim-bounce', rimBounceSound);
    this.load.audio('ball-bounce', ballBounceSound);
  }

  create() {
    const shootingSpotBase = this.physics.world.bounds.width / 8;
    this.shootingSpots = this.shootingSpots.map((spot, i, spots) => {
      return shootingSpotBase * (spots.length - i);
    });

    this.player1 = this.physics.add.sprite(
      this.shootingSpots[0],
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
    this.player1.isShooter = true;
    this.player1.playerNum = 1;

    this.rebounderPosition = this.physics.world.bounds.width * 0.75;
    this.player2 = this.physics.add.sprite(
      this.rebounderPosition,
      this.physics.world.bounds.height / 2,
      'player2'
    );
    this.player2.setCollideWorldBounds(true);
    this.player2.setFrictionX(this.playerMovement.friction);
    this.player2.setBounce(
      this.playerMovement.bounce,
      this.playerMovement.bounce
    );
    this.player2.setGravityY(this.playerMovement.gravity);
    this.player2.playerNum = 2;

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

    this.shootingSpots.forEach((spot, i) => {
      const shootingSpotLine = new Phaser.Geom.Line(
        this.shootingSpots[i] + this.player1.body.width / 2,
        this.physics.world.bounds.height - this.court.body.height,
        this.shootingSpots[i] + this.player1.body.width / 2,
        this.physics.world.bounds.height - this.court.body.height + 20
      );

      const shootingSpotGraphics = this.add.graphics({
        lineStyle: { width: 4, color: 0xffffff },
      });

      shootingSpotGraphics.strokeLineShape(shootingSpotLine);
    });

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

    this.add.text(20, 40, 'Score', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });

    this.playerScoreText[0] = this.add.text(20, 70, 'Player 1: 0 🏀', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });

    this.brokenAnkleText = this.add.text(500, 100, 'Broke ya ankles!!!', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });
    this.brokenAnkleText.setVisible(false);

    this.playerScoreText[1] = this.add.text(20, 95, 'Player 2: 0', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });

    this.gameOverText = this.add.text(
      this.physics.world.bounds.width * 0.5,
      this.physics.world.bounds.height * 0.4,
      "Game over...it's a tie!",
      {
        fontFamily: 'Monaco, Courier, monospace',
        fontSize: '30px',
        fill: '#fff',
      }
    );
    this.gameOverText.setVisible(false);
    this.gameOverText.setOrigin(0.5);

    this.physics.add.collider(
      this.ball,
      this.player1,
      this.givePlayer1Possession.bind(this)
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
      this.givePlayer2Possession.bind(this)
    );
    this.physics.add.collider(this.ball, this.backboard);
    this.physics.add.collider(this.player2, this.frontRim);
    this.physics.add.collider(
      this.ball,
      this.frontRim,
      this.ballRimCollision.bind(this)
    );
    this.physics.add.collider(this.ball, this.backRim);
    this.physics.add.collider(this.player1, this.backboard);
    // this.physics.add.collider(this.player1, this.halfcourt);

    // First shooter is player1
    this.givePlayer1Possession();

    this.soundEffects.rimBounce = this.sound.add('rim-bounce');
    this.soundEffects.ballBounce = this.sound.add('ball-bounce');
  }

  update() {
    if (!this.gameState.justScored) {
      const scorer = this.getScorer();
      if (scorer) {
        const scorerIndex = scorer - 1;
        const playerKey = Object.values(this.PLAYERS)[scorerIndex];
        const pointsScored = this.gameState.shotNum === 0 ? 2 : 1;
        this.gameState.score[scorerIndex] =
          this.gameState.score[scorerIndex] + pointsScored;
        this.playerScoreText[scorerIndex].text = this.getPlayerScoreText(
          this[playerKey]
        );
      }
    }

    this.player1.body.setVelocityX(0);
    if (
      this.keys.a.isDown &&
      !this.player1.isShooter &&
      this.player1.x > this.physics.world.bounds.width / 2
    ) {
      this.player1.body.setVelocityX(-this.playerMovement.runSpeed);
    } else if (this.keys.d.isDown && !this.player1.isShooter) {
      this.player1.body.setVelocityX(this.playerMovement.runSpeed);
    }

    if (this.keys.w.isDown && this.player1.body.touching.down) {
      this.player1.body.setVelocityY(-this.playerMovement.ballJumpSpeed);
    } else if (this.keys.s.isDown && this.gameState.player1Possession) {
      this.gameState.player1Possession = false;
      this.ball.body.setVelocityX(this.getDropSpeed(this.player1).x);
      this.ball.body.setVelocityY(this.getDropSpeed(this.player1).y);
    }
    if (this.keys.space.isDown && this.gameState.player1Possession) {
      this.gameState.player1Possession = false;
      this.ball.body.setVelocityX(this.getShotSpeed(this.player1).x);
      this.ball.body.setVelocityY(this.getShotSpeed(this.player1).y);

      if (this.player1.isShooter) {
        // Each of these cases should set a 1 or 2 second timeout and then reset ball location or show final score/money ball status
        if (this.gameState.shotNum < 2) {
          // Next shot
          this.gameState.shotNum = this.gameState.shotNum + 1;
        } else if (this.gameState.shootingSpotNum < 2) {
          // Next rack
          this.gameState.shootingSpotNum = this.gameState.shootingSpotNum + 1;
          this.gameState.shotNum = 0;
        } else if (this.player1.isShooter) {
          // Next shooter
          this.player1.isShooter = false;
          this.player2.isShooter = true;
          this.gameState.shootingSpotNum = 0;
          this.gameState.shotNum = 0;
        }
        setTimeout(() => {
          this.endShot();
        }, 2500);
      }
    }

    this.player2.body.setVelocityX(0);
    if (
      this.keys.left.isDown &&
      !this.player2.isShooter &&
      this.player2.x > this.physics.world.bounds.width / 2
    ) {
      this.player2.body.setVelocityX(-this.playerMovement.runSpeed);
    } else if (this.keys.right.isDown && !this.player2.isShooter) {
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

      if (this.player2.isShooter) {
        if (this.gameState.shotNum < 2) {
          // Next shot
          this.gameState.shotNum = this.gameState.shotNum + 1;
        } else if (this.gameState.shootingSpotNum < 2) {
          // Next rack
          this.gameState.shootingSpotNum = this.gameState.shootingSpotNum + 1;
          this.gameState.shotNum = 0;
        } else {
          this.gameState.gameOver = true;
        }
        setTimeout(() => {
          this.endShot();
        }, 2000);
      }
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

  endShot() {
    this.gameState.player1Possession = false;
    this.gameState.player2Possession = false;

    if (this.player1.isShooter) {
      this.givePlayer1Possession();
      this.player1.x = this.shootingSpots[this.gameState.shootingSpotNum];
      this.player2.x = this.rebounderPosition;
    }
    if (this.player2.isShooter) {
      this.givePlayer2Possession();
      this.player2.x = this.shootingSpots[this.gameState.shootingSpotNum];
      this.player1.x = this.rebounderPosition;
    }
    this.gameState.justScored = false;

    if (!this.gameState.gameOver) {
      return;
    }

    if (this.gameState.score[0] > this.gameState.score[1]) {
      this.gameOverText.text = 'Player 1 wins!!';
    } else if (this.gameState.score[1] > this.gameState.score[0]) {
      this.gameOverText.text = 'Player 2 wins!!';
    }
    this.gameOverText.setVisible(true);
  }

  getBallRelativeToShooter(ball, player) {
    return {
      x: player.x + player.body.width / 2 + 5,
      y: player.y - player.body.height / 2,
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

  getPlayerScoreText(player) {
    const possessionSymbol = player.isShooter ? '🏀' : '';
    return `Player ${player.playerNum}: ${
      this.gameState.score[player.playerNum - 1]
    } ${possessionSymbol}`;
  }

  getScorer() {
    if (this.gameState.gameOver) {
      return false;
    }

    const isAboveTheRim = this.ball.body.y < this.frontRim.body.y;
    if (isAboveTheRim) {
      this.wasAboveRim = true;

      if (this.wasAboveRimTimeout) {
        clearTimeout(this.wasAboveRimTimeout);
      }

      this.wasAboveRimTimeout = setTimeout(() => {
        this.wasAboveRim = false;
      }, 200);

      return false;
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
      return false;
    }

    this.gameState.justScored = this.gameState.lastPossession;
    const scorerPlayerNum = this[this.gameState.lastPossession].playerNum;
    return scorerPlayerNum;
  }

  playerCourtCollision(player, court) {
    if (player.body.y > this.court.body.y - player.body.height / 2) {
      player.body.y = this.court.body.y - player.body.height;
      this.brokenAnkleText.setVisible(true);
      setTimeout(() => {
        this.brokenAnkleText.setVisible(false);
      }, 1500);
    }
  }

  courtBallCollision(court, ball) {
    const isAtGroundHeight =
      this.ball.x >
      this.court.y - this.court.body.halfHeight - this.player1.body.halfHeight;
    const ballBounced =
      !this.ball.body.wasTouching.down &&
      this.ball.body.touching.down &&
      isAtGroundHeight &&
      !this.gameState.player1Possession &&
      !this.gameState.player2Possession;
    if (ballBounced) {
      this.soundEffects.ballBounce.play();
    }
    // Ball friction on court
    if (this.ball.body.velocity.x > 0) {
      this.ball.body.setVelocityX(
        Math.max(this.ball.body.velocity.x - this.ballMovement.slowdown, 0)
      );
    } else if (this.ball.body.velocity.x < 0) {
      this.ball.body.setVelocityX(
        Math.min(this.ball.body.velocity.x + this.ballMovement.slowdown, 0)
      );
    }
  }

  givePlayer1Possession(ball, player) {
    this.gameState.player1Possession = true;
    this.gameState.lastPossession = this.PLAYERS.PLAYER1;
    this.gameState.player2Possession = false;
  }

  givePlayer2Possession(ball, player) {
    this.gameState.player2Possession = true;
    this.gameState.lastPossession = this.PLAYERS.PLAYER2;
    this.gameState.player1Possession = false;
  }

  ballRimCollision() {
    this.soundEffects.rimBounce.play();
  }
}
