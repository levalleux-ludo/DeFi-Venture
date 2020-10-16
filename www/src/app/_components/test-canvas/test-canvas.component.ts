import { ElementRef, NgZone, ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { Utils } from 'src/app/_utils/utils';

export class Square {
  constructor(
    private ctx: CanvasRenderingContext2D
  ) {}

  draw(x: number, y: number, z: number) {
    this.ctx.fillRect(z * x, z * y, z, z);
  }
}

@Component({
  selector: 'app-test-canvas',
  templateUrl: './test-canvas.component.html',
  styleUrls: ['./test-canvas.component.scss']
})
export class TestCanvasComponent implements OnInit {

  @ViewChild('canvas', { static: true })
  canvas: ElementRef<HTMLCanvasElement>;

  block_imgs = [
    'assets/blocks/block_12DoozerArmy.png',
    'assets/blocks/block_AntForceOne.png',
    'assets/blocks/block_bakery.png',
    'assets/blocks/block_BoilerRoom.png',
    'assets/blocks/block_chance.png',
    'assets/blocks/block_CitizenChain.png',
    'assets/blocks/block_12DoozerArmy.png',
    'assets/blocks/block_AntForceOne.png',
    // 'assets/blocks/block_bakery.png',
    // 'assets/blocks/block_BoilerRoom.png',
    // 'assets/blocks/block_chance.png',
    // 'assets/blocks/block_12DoozerArmy.png',
    // 'assets/blocks/block_AntForceOne.png',
    'assets/blocks/block_bakery.png',
    'assets/blocks/block_BoilerRoom.png',
    'assets/blocks/block_chance.png',
    'assets/blocks/block_CitizenChain.png',
    'assets/blocks/block_12DoozerArmy.png',
    'assets/blocks/block_AntForceOne.png',
    'assets/blocks/block_bakery.png',
    'assets/blocks/block_BoilerRoom.png',
    'assets/blocks/block_chance.png',
    'assets/blocks/block_CitizenChain.png'
  ];
  avatars = [
    'assets/avatars/camel.png',
    'assets/avatars/crypto-chip.png',
    'assets/avatars/diamond.png',
    'assets/avatars/nobody.png',
    'assets/avatars/rocket.png'
  ];
  avatarsPosition = new Map<number, number[]>();
  blocks_geometry = [];
  nbSteps = 0;
  private ctx: CanvasRenderingContext2D;
  _zoom;
  public get zoom() {
    return this._zoom;
  }
  public set zoom(value: number) {
    this._zoom = value;
    this.draw(this._currentAngle);
  }
  loaded_images = [];
  loaded_avatars = [];
  _currentAngle = 0;
  _targetAngle = 0;
  _increment_deg = 1;
  _animateEnd;
  origin;

  constructor(
    private ngZone: NgZone
  ) { }

  ngOnInit(): void {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this._zoom = this.ctx.canvas.width / (32 * this.block_imgs.length);
    this.origin = {
      x: this.ctx.canvas.width / 2, // middle
      y: 50 // top
    };
    this.load_images().then(() => {
      this.draw(this._currentAngle);
    });
  }

  public get currentAngle() {
    return this._currentAngle;
  }

  public async setTargetAngle(value: number, velocity: number) {
    this._increment_deg = this.block_imgs.length * velocity * 2 / 5 + 3 / 5;
    return new Promise((resolve, reject) => {
      if (this._animateEnd !== undefined) {
        reject(); // animation already in progress
        return;
      }
      this._targetAngle = value;
      if (this._currentAngle !== this._targetAngle) {
        this._animateEnd = resolve;
        this.ngZone.runOutsideAngular(() => this.animate());
      } else {
        resolve();
      }
    });
  }

  public setPlayerPosition(player: number, oldPosition: number, newPosition) {
    const oldTab = this.avatarsPosition.get(oldPosition);
    const newTab = this.avatarsPosition.get(newPosition);
    this.avatarsPosition.set(oldPosition, oldTab.filter((avatar) => avatar !== player));
    if (!newTab.includes(player)) {
      newTab.push(player);
    }
  }

  private async load_images() {
    const promises = [];
    for (let i = 0; i < this.block_imgs.length; i++) {
      this.avatarsPosition.set(i, []);
      const img = new Image();
      img.src = this.block_imgs[i];
      this.loaded_images.push(img);
      promises.push(new Promise((resolve) => {
        img.onload = () => {
          resolve();
        };
      }));
    }
    for (let i = 0; i < this.avatars.length; i++) {

      this.avatarsPosition.get(0).push(i); // Everybody on the space 0
      const img = new Image();
      img.src = this.avatars[i];
      this.loaded_avatars.push(img);
      promises.push(new Promise((resolve) => {
        img.onload = () => {
          resolve();
        };
      }));
    }
    await Promise.all(promises);
  }


  private drawImage(index: number, posX: number, posY: number, angle_rad: number) {
    // create a new image
    const img = this.loaded_images[index];
    // declare a function to call once the image has loaded
    if (img.complete) {
      // Save the current context
      this.ctx.save();
      // Translate to the center point of our image
      this.ctx.translate(posX, posY);
      this.ctx.rotate(-angle_rad);
      this.ctx.translate(-posX, -posY);
      this.ctx.drawImage(img, posX - (50 * this.zoom), posY - (30 * this.zoom), 105*this.zoom, 70*this.zoom);
      const avatars = this.avatarsPosition.get(index);
      for (let i = 0; i < avatars.length; i++) {
        const avatar = avatars[i];
        const offsetX = (15 * i - 5 * avatars.length) * this.zoom;
        this.ctx.drawImage(this.loaded_avatars[avatar], offsetX + posX - 10*this.zoom, posY - 40*this.zoom, 20*this.zoom, 20*this.zoom);
      }
      this.ctx.restore();
    }
  }

  public animate(): void {
    const increment = Utils.Deg2Rad(this._increment_deg);
    // increment currentAngle
    this._currentAngle = this._currentAngle + increment;
    if (this._currentAngle >= 2 * Math.PI) {
      this._currentAngle = 0;
    }
    if (Math.abs(this._currentAngle - this._targetAngle) < increment) {
      this._currentAngle = this._targetAngle;
    }
    // draw
    this.draw(this._currentAngle);
    if (this._currentAngle !== this._targetAngle) {
      requestAnimationFrame(this.animate.bind(this));
    } else {
      this._animateEnd();
      this._animateEnd = undefined;
    }
  }

  private draw(angle: number) {
    const nbImgs = this.block_imgs.length;
    const radius = (90 * nbImgs / (2 * Math.PI)) * this.zoom;
    this.ctx.clearRect(0,0,this.ctx.canvas.width, this.ctx.canvas.height);
    for (let index = 0; index < nbImgs; index++) {
      const block_angle = 2 * Math.PI * index / nbImgs;
      const offsetX = radius * Math.sin(angle + block_angle);
      const offsetY = radius * (1 - Math.cos(angle + block_angle));
      this.drawImage(
        index,
        this.origin.x + offsetX,
        this.origin.y * this.zoom + offsetY,
        -(angle + block_angle)
      );
    }
  }





}
