import Phaser from 'phaser';
import Play from './Play';

const config = {
  type: Phaser.AUTO,
  width: 800,
  height: 640,
  scale: {
    autoCenter: Phaser.Scale.CENTER_BOTH,
  },
  scene: Play,
  physics: {
    default: 'arcade',
  },
};

const game = new Phaser.Game(config);
