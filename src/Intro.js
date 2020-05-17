import Phaser from 'phaser';

export default class Play extends Phaser.Scene {
  constructor() {
    super('intro');

    this.enterKey;
  }

  preload() {}

  create() {
    this.enterKey = this.input.keyboard.addKey(
      Phaser.Input.Keyboard.KeyCodes.ENTER
    );

    this.add.text(230, 170, 'Press ENTER to start gameplay', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '20px',
      fill: '#fff',
    });
  }

  update() {
    if (this.enterKey.isDown) {
      this.scene.start('gameplay');
    }
  }
}
