import { eSpaceType, IGameData } from './../../_services/game-master-contract.service';
import { ElementRef, Input, NgZone, ViewChild } from '@angular/core';
import { Component, OnInit } from '@angular/core';
import { ISpace } from 'src/app/_services/game-master-contract.service';
import { Utils } from 'src/app/_utils/utils';
import startups from '../../../assets/startups.json';

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

  @Input()
  set width(value: number) {
    this.canvas.nativeElement.width = value;
    // this._zoom = 1.2 + 1.2 * value / 2000;
    this._zoom = 0.8 + value / 2000;
    this.origin = {
      x: value / 2, // middle
      y: 50 // top
    };
    if (this.ctx) {
      this.draw(this._currentAngle);
    }
  }

  @Input()
  set height(value: number) {
    this.canvas.nativeElement.height = value;
    if (this.ctx) {
      this.draw(this._currentAngle);
    }
  }

  @Input()
  set playground(value: ISpace[]) {
    this.block_imgs = [];
    for (const space of value) {
      let image;
      if (space.type < eSpaceType.ASSET_CLASS_1) {
        const type = eSpaceType[space.type];
        image = this.images[type];
      } else {
        const startup = startups.startups[space.assetId];
        image = startup.image;
      }
      this.block_imgs.push(`assets/blocks/block_${image}`);
      if (space.type === eSpaceType.QUARANTINE) {
        this.indexQuarantine = this.block_imgs.length - 1;
      }
    }
    if (this.ctx) {
      this.load_images().then(() => {
        this.draw(this._currentAngle);
      });
    }
  }

  @Input()
  public set gameData(gameData: IGameData) {
    if (gameData) {
      gameData.players.forEach((aplayer, playerAddress) => {
        this.setPlayerStatus(aplayer.avatar, aplayer.hasLost, aplayer.inQuarantine);
      })
      gameData.playersPosition.forEach((position, player) => {
        const avatar = gameData.players.get(player).avatar as any;
        this.setPlayerPosition(avatar, position);
      });
    }
  }

  images = {
    CHANCE: 'chance.png',
    GENESIS: 'genesis.png',
    COVID: 'Covid.png',
    QUARANTINE: 'Quarantine.png'
  };

  block_imgs = [];
  avatars = [
    'assets/avatars/nobody.png',
    'assets/avatars/camel.png',
    'assets/avatars/crypto-chip.png',
    'assets/avatars/diamond.png',
    'assets/avatars/rocket.png',
    'assets/avatars/r1d1.png',
    'assets/avatars/r2d2.png',
    'assets/avatars/r3d3.png',
    'assets/avatars/r4d4.png',
    'assets/avatars/r5d5.png'
  ];
  face_cover = 'assets/avatars/face_cover.png';
  indexQuarantine = -1;
  avatarsPosition = new Map<number, number[]>();
  owners = new Map<number, number>();
  playersInQuarantine = new Map<number, boolean>();
  lostPlayers = new Map<number, boolean>();
  blocks_geometry = [];
  nbSteps = 0;
  private ctx: CanvasRenderingContext2D;
  _zoom = 2.5;
  public get zoom() {
    return this._zoom;
  }
  public set zoom(value: number) {
    this._zoom = value;
    this.draw(this._currentAngle);
  }
  loaded_images = [];
  loaded_avatars = [];
  img_face_cover;
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
    // this._zoom = this.ctx.canvas.width / (32 * this.block_imgs.length);
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

  public get nbBlocks() {
    return this.block_imgs.length;
  }

  public async setTargetAngle(value: number, velocity: number) {
    this._increment_deg = - (this.block_imgs.length * velocity * 2 / 5 + 3 / 5);
    return new Promise((resolve, reject) => {
      if (this._animateEnd !== undefined) {
        reject(); // animation already in progress
        return;
      }
      console.log('old targetAngle', Utils.Rad2Deg( this._targetAngle));
      console.log('new targetAngle', Utils.Rad2Deg(value));
      this._targetAngle = value;
      if (this._currentAngle !== this._targetAngle) {
        this._animateEnd = resolve;
        this.ngZone.runOutsideAngular(() => this.animate());
      } else {
        resolve();
      }
    });
  }

  public clearOwners() {
    this.owners = new Map<number, number>();
    if (this.ctx) {
      this.draw(this._currentAngle);
    }
  }

  public setOwner(player: number, position: number) {
    const avatarId = player - 1; // avatar 0 does not exist
    this.owners.set(position, avatarId);
    if (this.ctx) {
      this.draw(this._currentAngle);
    }
  }

  public setPlayerStatus(player: number, hasLost: boolean, inQuarantine: boolean) {
    const avatarId = player - 1; // avatar 0 does not exist
    this.lostPlayers.set(avatarId, hasLost);
    // if (hasLost) {
    //   // remove avatar from any positions
    //   this.setPlayerPosition(avatarId, -1);
    // }
    this.playersInQuarantine.set(avatarId, inQuarantine);
  }

  public setPlayerPosition(player: number, newPosition, animate = false) {
    const avatarId = player - 1; // avatar 0 does not exist
    const oldPosition = this.getOldPosition(avatarId);
    if (oldPosition === newPosition) {
      return;
    }
    if (!animate) {
      this.movePlayerOnBoard(avatarId, oldPosition, newPosition);
    } else {
      let currentPos = oldPosition;
      const velocity =
       ((newPosition >= oldPosition) ? newPosition - oldPosition : newPosition + this.nbBlocks - oldPosition) / this.nbBlocks;
      console.log('velocity', velocity, 300 * (1 - velocity));
      const interval = setInterval(() => {
        if (currentPos === newPosition) {
          clearInterval(interval);
        } else {
          currentPos = this.movePlayerOnBoard(avatarId, currentPos, (currentPos + 1) % this.nbBlocks);
        }
      }, 300 * (1 - velocity));
    }
  }

  private movePlayerOnBoard(avatarId: number, oldPosition: number, newPosition: number): number {
    const oldTab = this.avatarsPosition.get(oldPosition);
    let newTab = this.avatarsPosition.get(newPosition);
    if (oldTab) {
      this.avatarsPosition.set(oldPosition, oldTab.filter((avatar) => avatar !== avatarId));
    }
    if (!newTab) {
      newTab = [];
      this.avatarsPosition.set(newPosition, newTab);
    }
    if (!newTab.includes(avatarId)) {
      newTab.push(avatarId);
    }

    if (this.ctx) {
      this.draw(this._currentAngle);
    }

    return newPosition;
  }

  private getOldPosition(avatar: number): number {
    for (const position of this.avatarsPosition.keys()) {
      const tab = this.avatarsPosition.get(position);
      if (tab.includes(avatar)) {
        return position;
      }
    }
    return -1;
  }

  lockedAvatar = undefined;

  public lockAvatar(player: number) {
    const avatarId = player - 1; // avatar 0 does not exist
    console.log('lock avatar', avatarId);
    this.lockedAvatar = avatarId;
  }

  public unlockAvatar(player: number, newPosition?: number) {
    const avatarId = player - 1; // avatar 0 does not exist
    console.log('unlock avatar', avatarId, newPosition);
    if (this.lockedAvatar === avatarId) {
      this.lockedAvatar = undefined;
      if (newPosition !== undefined) {
        this.setPlayerPosition(player, newPosition, false);
      }
      if (this.ctx) {
        this.draw(this._currentAngle);
      }
    }
  }

  private async load_images() {
    const promises = [];
    this.loaded_images = [];
    for (let i = 0; i < this.block_imgs.length; i++) {
      // this.avatarsPosition.set(i, []);
      const img = new Image();
      img.src = this.block_imgs[i];
      this.loaded_images.push(img);
      promises.push(new Promise((resolve) => {
        img.onload = () => {
          resolve();
        };
      }));
    }
    this.loaded_avatars = [];
    for (let i = 0; i < this.avatars.length; i++) {

      // this.avatarsPosition.get(0).push(i); // Everybody on the space 0
      const img = new Image();
      img.src = this.avatars[i];
      this.loaded_avatars.push(img);
      promises.push(new Promise((resolve) => {
        img.onload = () => {
          resolve();
        };
      }));
    }
    this.img_face_cover = new Image();
    this.img_face_cover.src = this.face_cover;
    promises.push(new Promise((resolve) => {
      this.img_face_cover.onload = () => {
        resolve();
      };
    }));
    await Promise.all(promises);
  }


  private drawImage(index: number, posX: number, posY: number, angle_rad: number) {
    // create a new image
    const img = this.loaded_images[index];
    const isQuarantine = (index === this.indexQuarantine);
    // declare a function to call once the image has loaded
    if (img.complete) {
      // Save the current context
      this.ctx.save();
      // Translate to the center point of our image
      this.ctx.translate(posX, posY);
      this.ctx.rotate(-angle_rad);
      this.ctx.translate(-posX, -posY);
      this.ctx.drawImage(img, posX - (50 * this.zoom), posY - (30 * this.zoom), 105*this.zoom, 70*this.zoom);
      // this.ctx.font = '48px serif';
      // this.ctx.textAlign = 'center';
      // this.ctx.fillStyle = 'orange';
      // this.ctx.fillText(index.toString(), posX - (0 * this.zoom), posY + (60 * this.zoom));
      if (this.avatarsPosition.has(index)) {
        const avatars = this.avatarsPosition.get(index);
        for (let i = 0; i < avatars.length; i++) {
          const avatar = avatars[i];
          if ((avatar !== this.lockedAvatar) && !this.lostPlayers.get(avatar)) {
            const offsetX = (15 * i - 5 * avatars.length) * this.zoom;
            const offsetY = this.playersInQuarantine.get(avatar) ? 55*this.zoom : 0;
            // this.ctx.drawImage(this.loaded_avatars[avatar], offsetX + posX - 10*this.zoom, posY - 50*this.zoom, 30*this.zoom, 30*this.zoom);
            this.drawAvatar(avatar, offsetX + posX, posY + offsetY, isQuarantine);
          }
        }
      }
      if (this.owners.has(index)) {
        const avatar = this.owners.get(index);
        this.ctx.beginPath();
        this.ctx.arc(posX + 0 * this.zoom, posY + 36*this.zoom, 15*this.zoom, 0, 2 * Math.PI);
        this.ctx.fillStyle = 'rgba(255, 255, 255, 0.75)';
        this.ctx.fill();
        this.ctx.strokeStyle = 'rgba(0, 0, 0, 0.5)';
        this.ctx.stroke();
        this.ctx.drawImage(this.loaded_avatars[avatar], posX - (12 * this.zoom), posY + 24*this.zoom, 24*this.zoom, 24*this.zoom);
      }
      this.ctx.restore();
    }
  }

  private drawAvatar(avatar: number, posX, posY, isQuarantine = false) {
    const img = this.loaded_avatars[avatar];
    if (img.complete) {
      // this.ctx.save();
      // Translate to the center point of our image
      // this.ctx.translate(posX, posY);
      // this.ctx.translate(-posX, -posY);
      this.ctx.drawImage(img, posX - 10*this.zoom, posY - 50*this.zoom, 30*this.zoom, 30*this.zoom);
      // this.ctx.restore();
    }
    if (isQuarantine) {
      if (this.img_face_cover.complete) {
        this.ctx.drawImage(this.img_face_cover, posX - 10*this.zoom, posY - 42*this.zoom, 30*this.zoom, 14*this.zoom);
      }
    }
  }

  public animate(): void {
    const increment = Utils.Deg2Rad(this._increment_deg);
    // increment currentAngle
    this._currentAngle = this._currentAngle + increment;
    if (this._currentAngle >= 2 * Math.PI) {
      this._currentAngle = 0;
    }
    if (this._currentAngle <= 0) {
      this._currentAngle = 2 * Math.PI;
    }
    if (Math.abs(this._currentAngle - this._targetAngle) < Math.abs(increment)) {
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
    if (this.lockedAvatar !== undefined) {
      const offsetX = radius * Math.sin(angle);
      const offsetY = radius * (1 - Math.cos(angle));
      this.drawAvatar(
        this.lockedAvatar,
        this.origin.x - 10*this.zoom,
        this.origin.y * this.zoom - 30*this.zoom
      );
    }

  }





}
