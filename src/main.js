import Phaser from 'phaser';
import Intro from './Intro';
import Gameplay from './Gameplay';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 640,
  scale: {
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: [Intro, Gameplay],
  physics: {
    default: 'arcade',
  },
};

const game = new Phaser.Game(config);
