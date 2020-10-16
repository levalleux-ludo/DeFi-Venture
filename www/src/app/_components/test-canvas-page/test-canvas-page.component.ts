import { TestCanvasComponent } from './../test-canvas/test-canvas.component';
import { Utils } from './../../_utils/utils';
import { Component, OnInit, ViewChild, AfterContentInit } from '@angular/core';

@Component({
  selector: 'app-test-canvas-page',
  templateUrl: './test-canvas-page.component.html',
  styleUrls: ['./test-canvas-page.component.scss']
})
export class TestCanvasPageComponent implements OnInit, AfterContentInit {

  spaceId = 0;
  nbSpaces = 12;
  targetAngle = 0;
  PI = Math.PI;
  computing = false;
  zoom;

  @ViewChild('canvas', {static: true})
  canvas: TestCanvasComponent;

  constructor() { }
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

}
