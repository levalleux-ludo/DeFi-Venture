import { TestCanvasComponent } from './../test-canvas/test-canvas.component';
import { Utils } from './../../_utils/utils';
import { Component, OnInit, ViewChild, AfterContentInit, AfterViewInit } from '@angular/core';
import { eSpaceType } from 'src/app/_services/game-master-contract.service';
import { Stats } from 'fs';

@Component({
  selector: 'app-test-canvas-page',
  templateUrl: './test-canvas-page.component.html',
  styleUrls: ['./test-canvas-page.component.scss']
})
export class TestCanvasPageComponent implements OnInit, AfterContentInit, AfterViewInit {

  spaceId = 0;
  nbSpaces = 12;
  targetAngle = 0;
  PI = Math.PI;
  computing = false;
  zoom;
  lockedAvatar = undefined;

  @ViewChild('canvas', {static: true})
  canvas: TestCanvasComponent;

  constructor() { }

  ngAfterViewInit(): void {
    this.canvas.playground = [
      {
        type: eSpaceType.GENESIS,
        assetId: 0,
        assetPrice: 50,
        productPrice: 12,
        owner: ''
      },
      {
        type: eSpaceType.ASSET_CLASS_1,
        assetId: 0,
        assetPrice: 50,
        productPrice: 12,
        owner: ''
      },
      {
        type: eSpaceType.ASSET_CLASS_1,
        assetId: 1,
        assetPrice: 50,
        productPrice: 12,
        owner: ''
      },
      {
        type: eSpaceType.CHANCE,
        assetId: 0,
        assetPrice: 50,
        productPrice: 12,
        owner: ''
      },
      {
        type: eSpaceType.ASSET_CLASS_1,
        assetId: 2,
        assetPrice: 50,
        productPrice: 12,
        owner: ''
      },
      {
        type: eSpaceType.ASSET_CLASS_1,
        assetId: 3,
        assetPrice: 50,
        productPrice: 12,
        owner: ''
      },
      {
        type: eSpaceType.ASSET_CLASS_1,
        assetId: 4,
        assetPrice: 50,
        productPrice: 12,
        owner: ''
      },
    ];

    this.canvas.gameData = {
      gameMaster: '0xaaaaaaaaaaaaa',
      players: new Map([
        ['aaaaaaa', {address: 'aaaaaaa', avatar: 1, username: 'toto', hasLost: false, hasWon: false}],
        ['bbbbbbb', {address: 'bbbbbbb', avatar: 2, username: 'titi', hasLost: false, hasWon: false}],
        ['ccccccc', {address: 'ccccccc', avatar: 3, username: 'tata', hasLost: false, hasWon: false}],
      ]),
      playersPosition: new Map([
        ['aaaaaaa', 0],
        ['bbbbbbb', 3],
        ['ccccccc', 2]
      ]),
      status: '',
      nextPlayer: '',
      currentPlayer: '',
      currentOptions: 0,
      chanceCardId: 0,
      tokenAddress: '',
      assetsAddress: '',
      playground: []
    };

  }

  ngAfterContentInit(): void {
    // this.zoom = this.canvas.zoom;
  }

  ngOnInit(): void {
    setTimeout(() => {
      this.zoom = this.canvas.zoom;
    }, 1000);
  }

  setSpaceId(value: number) {
    this.computing = true;
    let offset = value - this.spaceId;
    if (offset < 0) {
      offset += this.nbSpaces;
    }
    this.spaceId = value;
    this.spaceId = this.spaceId % this.nbSpaces;
    this.targetAngle = this.spaceId * 2 * Math.PI / this.nbSpaces;
    this.canvas.setTargetAngle(this.targetAngle, offset/this.nbSpaces).then(() => {
      this.computing = false;
    });
    // setTimeout(() => {
    //   this.computing = false;
    // }, 5000);
  }

  rad2Deg(rad: number): number {
    return Utils.Rad2Deg(rad);
  }

  changeZoom(zoom: number) {
    this.zoom = zoom;
    this.canvas.zoom = zoom;
  }

  changeCanvasSize() {
    this.canvas.width = 250;
  }

  lockAvatar() {
    if (this.lockedAvatar) {
      this.canvas.unlockAvatar(this.lockedAvatar);
      this.lockedAvatar = undefined;
    } else {
      this.lockedAvatar = 1;
      this.canvas.lockAvatar(this.lockedAvatar);
    }
  }

}
