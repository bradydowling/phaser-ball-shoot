import Phaser from 'phaser';
import ballImg from './assets/ball.png';
import playerImg from './assets/paddle.png';
import player2Img from './assets/paddle-2.png';
import courtImg from './assets/court.png';
import backboardImg from './assets/backboard.png';
import rimImg from './assets/front-rim.png';
import netImg from './assets/net.png';
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

    this.player1;
    this.player2;
    this.players = [];
    this.ball;
    this.court;
    this.backboard;
    this.frontRim;
    this.backRim;
    this.shootingSpots = [0, 0, 0];
    this.soundEffects = {};
    this.debouncingSoundToggle = false;

    this.texts = {
      shotState: null,
      playerScore: [],
    };

    this.timeouts = {
      wasAboveRim: null,
      changedPossession: null,
    };

    this.gameState = {
      gameStarted: false,
      lastPossession: null,
      score: [0, 0],
      wasAboveRim: false,
      justScored: false,
      shotReleased: false,
      ballHitGround: false,
      hasRebounded: false,
      shootingSpotNum: 0,
      shotNum: 0,
      gameOver: false,
      canRebounderScore: true,
      soundOn: true,
      canScore: true,
      rebounderGrounded: false,
      hasBallTouchedRimOrRebounder: false,
    };
  }

  preload() {
    this.load.image('ball', ballImg);
    this.load.image('player', playerImg);
    this.load.image('player2', player2Img);
    this.load.image('court', courtImg);
    this.load.image('backboard', backboardImg);
    this.load.image('solid-rim', rimImg);
    this.load.image('net', netImg);
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
    this.player1.setDataEnabled();
    this.player1.setName('player1');
    this.player1.data.set('isShooter', true);
    this.player1.data.set('playerNum', 1);
    this.player1.data.set('hasPossession', true);
    this.player1.data.set('shotChart', []);
    this.players.push(this.player1);

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
    this.player2.setDataEnabled();
    this.player2.setName('player2');
    this.player2.data.set('playerNum', 2);
    this.player2.data.set('hasPossession', false);
    this.player2.data.set('shotChart', []);
    this.players.push(this.player2);

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
    this.frontRim.setCircle(this.frontRim.width / 2);

    this.backRim = this.physics.add.sprite(
      this.physics.world.bounds.width * 0.95 - 10,
      this.physics.world.bounds.height * 0.55,
      'solid-rim'
    );
    this.backRim.setImmovable();

    this.net = this.physics.add.sprite(
      this.physics.world.bounds.width * 0.95 - 50,
      this.physics.world.bounds.height * 0.585,
      'net'
    );
    this.net.setImmovable();

    this.keys = {
      ...this.input.keyboard.createCursorKeys(),
      w: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      a: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      s: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      d: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.D),
      o: this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.O),
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

    this.add.text(20, 20, 'Score', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });

    this.texts.playerScore[0] = this.add.text(20, 50, '🏀 Player 1: 0', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });

    this.texts.playerScore[1] = this.add.text(20, 75, '🙌 Player 2: 0', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });

    this.soundButton = this.add.text(
      this.physics.world.bounds.width - 10,
      20,
      'Sound FX: 💯',
      {
        fontFamily: 'Monaco, Courier, monospace',
        fontSize: '20px',
        fill: '#fff',
      }
    );
    this.soundButton.setOrigin(1, 0);

    this.toggleSoundText = this.add.text(
      this.physics.world.bounds.width - 10,
      45,
      'on/off: [o]',
      {
        fontFamily: 'Monaco, Courier, monospace',
        fontSize: '20px',
        fill: '#fff',
      }
    );
    this.toggleSoundText.setOrigin(1, 0);

    this.brokenAnkleText = this.add.text(500, 100, 'Broke ya ankles!!!', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });
    this.brokenAnkleText.setVisible(false);

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

    this.texts.shotState = this.add.text(
      this.physics.world.bounds.width * 0.5,
      this.physics.world.bounds.height * 0.4,
      'Shot over!',
      {
        fontFamily: 'Monaco, Courier, monospace',
        fontSize: '20px',
        fill: '#fff',
      }
    );
    this.texts.shotState.setVisible(false);
    this.texts.shotState.setOrigin(0.5);

    this.physics.add.collider(
      this.player1,
      this.ball,
      this.setPlayerPossession.bind(this)
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
      this.player2,
      this.ball,
      this.setPlayerPossession.bind(this)
    );
    this.physics.add.collider(this.ball, this.backboard);
    this.physics.add.collider(this.player2, this.frontRim);
    this.physics.add.collider(
      this.ball,
      this.frontRim,
      this.ballRimCollision.bind(this)
    );
    this.physics.add.collider(
      this.ball,
      this.backRim,
      this.ballRimCollision.bind(this)
    );
    this.physics.add.collider(this.player1, this.backboard);
    // this.physics.add.collider(this.player1, this.halfcourt);

    // First shooter is player1
    this.setPlayerPossession(this.player1);

    this.soundEffects.rimBounce = this.sound.add('rim-bounce');
    this.soundEffects.ballBounce = this.sound.add('ball-bounce');
  }

  update() {
    if (this.keys.o.isDown) {
      this.toggleSound();
    }

    if (this.gameState.shotReleased && this.gameState.ballHitGround) {
      this.startShotEnd();
    }

    const scorer = this.getScorer();
    if (scorer) {
      const scorerIndex = this.getPlayerIndex(scorer);
      const pointsScored = this.getPointsScored(scorer);
      this.gameState.score[scorerIndex] =
        this.gameState.score[scorerIndex] + pointsScored;
      this.startShotEnd();
    }

    // Ball placement (possession)
    if (this.player1.data.get('hasPossession')) {
      const ballPos = this.getBallRelativeToShooter(this.ball, this.player1);
      this.ball.body.x = ballPos.x;
      this.ball.body.y = ballPos.y;
    } else if (this.player2.data.get('hasPossession')) {
      const ballPos = this.getBallRelativeToShooter(this.ball, this.player2);
      this.ball.body.x = ballPos.x;
      this.ball.body.y = ballPos.y;
    }

    // Player movement
    this.player1.body.setVelocityX(0);
    if (
      this.keys.a.isDown &&
      !this.player1.data.get('isShooter') &&
      this.player1.x > this.physics.world.bounds.width / 2
    ) {
      this.player1.body.setVelocityX(-this.playerMovement.runSpeed);
    } else if (this.keys.d.isDown && !this.player1.data.get('isShooter')) {
      this.player1.body.setVelocityX(this.playerMovement.runSpeed);
    }

    if (this.keys.w.isDown && this.player1.body.touching.down) {
      this.player1.body.setVelocityY(-this.playerMovement.ballJumpSpeed);
    } else if (this.keys.s.isDown && this.player1.data.get('hasPossession')) {
      this.drop(this.player1);
    }
    if (this.keys.space.isDown && this.player1.data.get('hasPossession')) {
      this.shoot(this.player1);
    }

    this.player2.body.setVelocityX(0);
    if (
      this.keys.left.isDown &&
      !this.player2.data.get('isShooter') &&
      this.player2.x > this.physics.world.bounds.width / 2
    ) {
      this.player2.body.setVelocityX(-this.playerMovement.runSpeed);
    } else if (this.keys.right.isDown && !this.player2.data.get('isShooter')) {
      this.player2.body.setVelocityX(this.playerMovement.runSpeed);
    }

    if (this.keys.up.isDown && this.player2.body.touching.down) {
      this.player2.body.setVelocityY(-this.playerMovement.ballJumpSpeed);
    } else if (
      this.keys.down.isDown &&
      this.player2.data.get('hasPossession')
    ) {
      this.drop(this.player2);
    }
    if (this.keys.shift.isDown && this.player2.data.get('hasPossession')) {
      this.shoot(this.player2);
    }
  }

  getPointsScored(scorer) {
    const isMoneyBall = this.gameState.shotNum === 2;
    if (scorer.data.get('isShooter') && isMoneyBall) {
      return 2;
    }
    return 1;
  }

  shoot(player) {
    player.data.set('hasPossession', false);
    this.gameState.shotReleased = true;
    this.ball.body.setVelocityX(this.getShotSpeed(player).x);
    this.ball.body.setVelocityY(this.getShotSpeed(player).y);
  }

  drop(player) {
    player.data.set('hasPossession', false);
    this.gameState.shotReleased = true;
    this.ball.body.setVelocityX(this.getDropSpeed(player).x);
    this.ball.body.setVelocityY(this.getDropSpeed(player).y);
  }

  getShooter() {
    if (this.player1.data.get('isShooter')) {
      return this.player1;
    } else if (this.player2.data.get('isShooter')) {
      return this.player2;
    } else {
      console.log('No shooter');
    }
  }

  getRebounder() {
    if (this.player1.data.get('isShooter')) {
      return this.player2;
    } else if (this.player2.data.get('isShooter')) {
      return this.player1;
    } else {
      console.log('No rebounder');
    }
  }

  getPlayerIndex(player) {
    return player.data.get('playerNum') - 1;
  }

  startShotEnd() {
    if (!this.gameState.canScore) {
      return;
    }
    console.log('beginning of the end');

    this.updateScoreboard();

    if (this.gameState.shotNum < 2) {
      // Next shot
      this.gameState.shotNum = this.gameState.shotNum + 1;
    } else if (this.gameState.shootingSpotNum < 2) {
      // Next rack
      this.gameState.shootingSpotNum = this.gameState.shootingSpotNum + 1;
      this.gameState.shotNum = 0;
    } else if (this.player1.data.get('isShooter')) {
      // Next shooter
      this.player1.data.set('isShooter', false);
      this.player2.data.set('isShooter', true);
      this.gameState.shootingSpotNum = 0;
      this.gameState.shotNum = 0;
    } else {
      this.gameState.gameOver = true;
    }

    this.gameState.canScore = false;
    this.texts.shotState.setVisible(true);
    setTimeout(() => {
      this.endShot();
    }, 1000);
  }

  updateScoreboard() {
    const shooter = this.getShooter();
    const shooterScored =
      this.gameState.lastPossession === shooter.name &&
      this.gameState.justScored;

    const updatedShotChart = [...shooter.data.get('shotChart')];
    updatedShotChart.push(shooterScored ? true : false);
    shooter.data.set('shotChart', updatedShotChart);
    this.texts.playerScore[0].text = this.getPlayerScoreText(this.player1);
    this.texts.playerScore[1].text = this.getPlayerScoreText(this.player2);
  }

  endShot() {
    console.log('the end');
    this.texts.shotState.setVisible(false);
    this.texts.shotState.text = 'Shot over!';

    const shooter = this.getShooter();
    const rebounder = this.getRebounder();
    this.setPlayerPossession(shooter);
    shooter.x = this.shootingSpots[this.gameState.shootingSpotNum];
    rebounder.x = this.rebounderPosition;

    this.resetShotState();

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

  resetShotState() {
    this.gameState.justScored = false;
    this.gameState.shotReleased = false;
    this.gameState.ballHitGround = false;
    this.gameState.hasRebounded = false;
    this.gameState.canScore = true;
    this.gameState.rebounderGrounded = false;
    this.gameState.hasBallTouchedRimOrRebounder = false;
    this.gameState.isGoaltending = false;
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
    const possessionSymbol = player.data.get('isShooter') ? '🏀' : '🙌';
    const shotChart = player.data.get('shotChart').reduce((chart, shot, i) => {
      const isMoneyBall = (i + 1) % 3 === 0;
      const ballSymbol = isMoneyBall ? '🏐' : '🏀';
      const thisShot = shot ? ballSymbol : '❌';
      const rackDivider = i === 3 || i === 6 ? '|' : '';
      return `${chart}${rackDivider}${thisShot}`;
    }, '');
    return `${possessionSymbol} Player ${player.data.get('playerNum')}: ${
      this.gameState.score[player.data.get('playerNum') - 1]
    } ${shotChart}`;
  }

  getScorer() {
    if (this.gameState.gameOver || !this.gameState.canScore) {
      return false;
    }

    const isAboveTheRim = this.ball.body.y < this.frontRim.body.y;
    if (isAboveTheRim) {
      this.wasAboveRim = true;

      if (this.timeouts.wasAboveRim) {
        clearTimeout(this.timeouts.wasAboveRim);
      }

      this.timeouts.wasAboveRim = setTimeout(() => {
        this.wasAboveRim = false;
      }, 200);

      return false;
    }

    if (this.gameState.isGoaltending) {
      const scorer = this.getShooter();
      this.gameState.justScored = scorer.name;
      return scorer;
    }

    const noOneHasPossession =
      !this.player1.data.get('hasPossession') &&
      !this.player2.data.get('hasPossession');
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
    const scorer = this[this.gameState.lastPossession];
    if (scorer.data.get('isShooter')) {
      this.texts.shotState.text = 'Get buckets!';
    } else {
      this.texts.shotState.text = 'Nice tip!';
    }
    return scorer;
  }

  playerCourtCollision(player, court) {
    if (!player.data.get('isShooter') && this.gameState.hasRebounded) {
      this.gameState.rebounderGrounded = true;
    }

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
      this.ball.y >
      this.court.y - this.court.body.halfHeight - this.player1.body.halfHeight;

    const ballBounced =
      !this.ball.body.wasTouching.down &&
      this.ball.body.touching.down &&
      isAtGroundHeight &&
      !this.player1.data.get('hasPossession') &&
      !this.player2.data.get('hasPossession');

    if (!ballBounced) {
      return;
    }

    if (this.gameState.soundOn) {
      this.soundEffects.ballBounce.play();
    }

    if (this.gameState.shotReleased && !this.gameState.ballHitGround) {
      this.gameState.ballHitGround = true;
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

  isGoaltending() {
    const isBallComingDown = this.ball.body.velocity.y < 0;
    const isBallAboveRim = this.ball.body.y < this.frontRim.body.y;
    const isGoaltending =
      !this.gameState.hasBallTouchedRimOrRebounder &&
      isBallAboveRim &&
      isBallComingDown;
    const isBlockedShot =
      !this.gameState.hasBallTouchedRimOrRebounder &&
      isBallComingDown &&
      this.ball.body.x < this.physics.world.bounds.width * 0.6;
    return isBlockedShot || isGoaltending;
  }

  setPlayerPossession(player) {
    console.log(player.name);
    if (!player) {
      this.player1.data.set('hasPossession', false);
      this.player2.data.set('hasPossession', false);
      this.gameState.lastPossession = null;
      return;
    }

    if (this.isGoaltending()) {
      this.gameState.isGoaltending = true;
      this.texts.shotState.text = 'Goaltending!';
      this.texts.shotState.setVisible(true);
      return;
    }

    const didReboundTwice =
      this.gameState.hasRebounded && !player.data.get('hasPossession');

    if (didReboundTwice || this.gameState.rebounderGrounded) {
      this.startShotEnd();
    }

    if (!player.data.get('isShooter')) {
      this.gameState.hasRebounded = true;
    }

    player.data.set('hasPossession', true);
    this.gameState.lastPossession = player.name;
    const otherPlayer = this.getOtherPlayer(player);
    otherPlayer.data.set('hasPossession', false);
  }

  getOtherPlayer(player) {
    if (player.name === 'player1') return this.player2;
    if (player.name === 'player2') return this.player1;
  }

  ballRimCollision() {
    this.gameState.hasBallTouchedRimOrRebounder = true;
    if (!this.gameState.soundOn) {
      return;
    }
    this.soundEffects.rimBounce.play();
  }

  toggleSound() {
    if (this.debouncingSoundToggle) {
      return;
    }
    this.debouncingSoundToggle = true;
    this.gameState.soundOn = !this.gameState.soundOn;
    this.soundButton.text = `Sound FX: ${this.gameState.soundOn ? '💯' : '❌'}`;
    setTimeout(() => {
      this.debouncingSoundToggle = false;
    }, 100);
  }
}
