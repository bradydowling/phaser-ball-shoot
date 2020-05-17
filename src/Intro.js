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

    const middleX = this.physics.world.bounds.width / 2;
    const titleText = this.add.text(middleX, 0, 'Tip Dunk Shootout', {
      fontFamily: 'Monaco, Courier, monospace',
      fontSize: '40px',
      fill: '#fff',
    });
    titleText.setOrigin(0.5);

    const middleY = this.physics.world.bounds.height / 2;
    const welcomeText = this.add.text(
      middleX,
      middleY,
      'Press ENTER to start gameplay',
      {
        fontFamily: 'Monaco, Courier, monospace',
        fontSize: '20px',
        fill: '#fff',
      }
    );
    welcomeText.setOrigin(0.5);
  }

  update() {
    if (this.enterKey.isDown) {
      this.scene.start('gameplay');
    }
  }
}
