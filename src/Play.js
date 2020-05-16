import Phaser from 'phaser';
import ballImg from './assets/ball.png';
import playerImg from './assets/paddle.png';
import courtImg from './assets/court.png';
import backboardImg from './assets/backboard.png';
import rimImg from './assets/front-rim.png';

export default class Play extends Phaser.Scene {
  constructor() {
    super('play');

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
      SHOOTER: 'shooter',
      REBOUNDER: 'rebounder',
    };

    this.shooter;
    this.rebounder;
    this.ball;
    this.court;
    this.backboard;
    this.frontRim;
    this.backRim;
    this.player1ScoreText;
    this.player2ScoreText;

    this.gameState = {
      gameStarted: false,
      shooterPossession: true,
      rebounderPossession: false,
      lastPossession: null,
      shooterPlayerNum: 0,
      score: [0, 0],
      justScored: false,
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
    const shooterStart = this.physics.world.bounds.width / 8;

    this.shooter = this.physics.add.sprite(
      shooterStart,
      this.physics.world.bounds.height / 2,
      'player'
    );
    this.shooter.setCollideWorldBounds(true);
    this.shooter.setFrictionX(this.playerMovement.friction);
    this.shooter.setBounce(
      this.playerMovement.bounce,
      this.playerMovement.bounce
    );
    this.shooter.setGravityY(this.playerMovement.gravity);

    this.rebounder = this.physics.add.sprite(
      this.physics.world.bounds.width * 0.75,
      this.physics.world.bounds.height / 2,
      'player'
    );
    this.rebounder.setCollideWorldBounds(true);
    this.rebounder.setFrictionX(this.playerMovement.friction);
    this.rebounder.setBounce(
      this.playerMovement.bounce,
      this.playerMovement.bounce
    );
    this.rebounder.setGravityY(this.playerMovement.gravity);

    this.ball = this.physics.add.sprite(0, 0, 'ball');
    const ballPos = this.getBallRelativeToShooter(this.ball, this.shooter);
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

    const cursors = this.input.keyboard.createCursorKeys();
    this.keys = { ...cursors };
    this.keys.w = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W);
    this.keys.a = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A);
    this.keys.s = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S);
    this.keys.d = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D);

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

    this.add.text(20, -80, 'Score', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });

    this.player1ScoreText = this.add.text(20, -50, 'Player 1: 0', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });

    this.player2ScoreText = this.add.text(20, -20, 'Player 2: 0', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });

    this.physics.add.collider(
      this.ball,
      this.shooter,
      this.ballShooterCollision.bind(this)
    );
    this.physics.add.collider(
      this.ball,
      this.court,
      this.courtBallCollision.bind(this)
    );
    this.physics.add.collider(
      this.shooter,
      this.court,
      this.playerCourtCollision.bind(this)
    );
    this.physics.add.collider(
      this.rebounder,
      this.court,
      this.playerCourtCollision.bind(this)
    );
    this.physics.add.collider(
      this.ball,
      this.rebounder,
      this.ballRebounderCollision.bind(this)
    );
    this.physics.add.collider(this.ball, this.backboard);
    this.physics.add.collider(this.rebounder, this.frontRim);
    this.physics.add.collider(this.ball, this.frontRim);
    this.physics.add.collider(this.ball, this.backRim);
    this.physics.add.collider(this.shooter, this.backboard);
    // this.physics.add.collider(this.shooter, this.halfcourt);
  }

  update() {
    this.shooter.body.setVelocityX(0);
    if (this.keys.a.isDown) {
      this.shooter.body.setVelocityX(-this.playerMovement.runSpeed);
    } else if (this.keys.d.isDown) {
      this.shooter.body.setVelocityX(this.playerMovement.runSpeed);
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

    if (this.keys.w.isDown && this.shooter.body.touching.down) {
      if (this.gameState.shooterPossession) {
        this.shooter.body.setVelocityY(-this.playerMovement.ballJumpSpeed);
      } else {
        this.shooter.body.setVelocityY(-this.playerMovement.jumpSpeed);
      }
    } else if (this.keys.s.isDown && this.gameState.shooterPossession) {
      this.gameState.shooterPossession = false;
      this.ball.body.setVelocityX(this.getDropSpeed(this.shooter).x);
      this.ball.body.setVelocityY(this.getDropSpeed(this.shooter).y);
    }
    if (this.keys.space.isDown && this.gameState.shooterPossession) {
      this.gameState.shooterPossession = false;
      this.ball.body.setVelocityX(this.getShotSpeed(this.shooter).x);
      this.ball.body.setVelocityY(this.getShotSpeed(this.shooter).y);
    }

    this.rebounder.body.setVelocityX(0);
    if (this.keys.left.isDown) {
      this.rebounder.body.setVelocityX(-this.playerMovement.runSpeed);
    } else if (this.keys.right.isDown) {
      this.rebounder.body.setVelocityX(this.playerMovement.runSpeed);
    }

    if (this.keys.up.isDown && this.rebounder.body.touching.down) {
      this.rebounder.body.setVelocityY(-this.playerMovement.ballJumpSpeed);
    } else if (this.keys.down.isDown && this.gameState.rebounderPossession) {
      this.gameState.rebounderPossession = false;
      this.ball.body.setVelocityX(this.getDropSpeed(this.rebounder).x);
      this.ball.body.setVelocityY(this.getDropSpeed(this.rebounder).y);
    }
    if (this.keys.shift.isDown && this.gameState.rebounderPossession) {
      this.gameState.rebounderPossession = false;
      this.ball.body.setVelocityX(this.getShotSpeed(this.rebounder).x);
      this.ball.body.setVelocityY(this.getShotSpeed(this.rebounder).y);
    }

    if (this.gameState.shooterPossession) {
      const ballPos = this.getBallRelativeToShooter(this.ball, this.shooter);
      this.ball.body.x = ballPos.x;
      this.ball.body.y = ballPos.y;
    } else if (this.gameState.rebounderPossession) {
      const ballPos = this.getBallRelativeToShooter(this.ball, this.rebounder);
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
    const pointScored =
      this.ball.body.velocity.y > 0 &&
      this.ball.body.x > this.frontRim.body.x &&
      this.ball.body.x < this.backRim.body.x &&
      this.ball.body.y > this.frontRim.body.y &&
      this.ball.body.y < this.frontRim.body.y + this.frontRim.body.height / 2 &&
      !this.gameState.shooterPossession &&
      !this.gameState.rebounderPossession;
    if (!pointScored) {
      return;
    }

    this.gameState.justScored = true;
    setTimeout(() => {
      this.gameState.justScored = false;
    }, 500);

    if (
      (this.gameState.lastPossession === this.PLAYERS.SHOOTER &&
        this.gameState.shooterPlayerNum === 0) ||
      (this.gameState.lastPossession !== this.PLAYERS.SHOOTER &&
        this.gameState.shooterPlayerNum !== 0)
    ) {
      return 0;
    } else {
      return 1;
    }
  }

  playerCourtCollision(player, court) {}

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

  ballShooterCollision(ball, player) {
    this.gameState.shooterPossession = true;
    this.gameState.lastPossession = this.PLAYERS.SHOOTER;
    this.gameState.rebounderPossession = false;
  }

  ballRebounderCollision(ball, player) {
    this.gameState.rebounderPossession = true;
    this.gameState.lastPossession = this.PLAYERS.REBOUNDER;
    this.gameState.shooterPossession = false;
  }
}
