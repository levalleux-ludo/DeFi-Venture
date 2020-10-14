import { ElementRef, ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { Utils } from 'src/app/_utils/utils';

export class Square {
  constructor(private ctx: CanvasRenderingContext2D) {}

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
    'assets/blocks/block_CitizenChain.png'
  ];
  avatars = [
    'assets/avatars/camel.png',
    undefined,
    'assets/avatars/crypto-chip.png',
    'assets/avatars/diamond.png',
    'assets/avatars/nobody.png',
    'assets/avatars/rocket.png'
  ];
  blocks_geometry = [];
  nbSteps = 0;
  private ctx: CanvasRenderingContext2D;

  constructor() { }

  ngOnInit(): void {
    this.ctx = this.canvas.nativeElement.getContext('2d');
    this.init_geometry();
    this.drawImages(this.nbSteps);
  }


  init_geometry() {
    const origin = {
      x: 400, // middle
      y: 50 // top
    };
    const increment = -Utils.Deg2Rad(30); // turn by this angle at each block
    const radius = 175;
    for (let i = 0; i < this.block_imgs.length; i++) {
      for (let g = 0; g < 6; g++) {
        const offsetX = radius * Math.sin((6*i + g) * increment/6);
        const offsetY = radius * (1 - Math.cos((6*i + g) * increment/6));
        this.blocks_geometry.push({
          x: origin.x + offsetX,
          y: origin.y + offsetY,
          angle: -(6*i + g) * increment/6
        });
      }
    }
  }

  drawImages(nbSteps: number) {
    this.ctx.clearRect(0,0,this.ctx.canvas.width, this.ctx.canvas.height);
    for (let i = 0; i < this.block_imgs.length; i++) {
      const g = 6*i + (nbSteps % this.blocks_geometry.length);
      const geom = this.blocks_geometry[g];
      console.log('draw index', i, 'g', g);
      this.drawImage(i, geom.x, geom.y, geom.angle);
    }
  }

  drawImage(index: number, posX: number, posY: number, angle_rad: number) {
    // create a new image
    const img = new Image();
    // declare a function to call once the image has loaded
    img.onload = () => {
      console.log('start draw image', index, posX, posY);
      // Save the current context
      this.ctx.save();
      // Translate to the center point of our image
      this.ctx.translate(posX, posY);
      this.ctx.rotate(-angle_rad);
      this.ctx.translate(-posX, -posY);
      // this.ctx.rotate(+angle_rad);
      this.ctx.drawImage(img, posX - 50, posY - 35, 105, 70);
      this.ctx.restore();
      console.log('end draw image', index);
    };
    // now set the image's src
    img.src = this.block_imgs[index];
    const avatar = new Image();
    // declare a function to call once the image has loaded
    avatar.onload = () => {
      console.log('start draw image', index, posX, posY);
      // Save the current context
      this.ctx.save();
      // Translate to the center point of our image
      this.ctx.translate(posX, posY);
      this.ctx.rotate(-angle_rad);
      this.ctx.translate(-posX, -posY);
      // this.ctx.rotate(+angle_rad);
      this.ctx.drawImage(avatar, posX - 18, posY - 35 - 18, 36, 36);
      this.ctx.restore();
      console.log('end draw image', index);
    };
    // now set the image's src
    avatar.src = this.avatars[index];
  }

  animate(): void {
    this.nbSteps ++;
    this.drawImages(this.nbSteps);
    // this.ctx.fillStyle = 'red';
    // const square = new Square(this.ctx);
    // square.draw(5, 1, 20);
  }

}
