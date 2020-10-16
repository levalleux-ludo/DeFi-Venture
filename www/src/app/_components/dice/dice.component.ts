import { Component, Input, NgZone, OnInit } from '@angular/core';

@Component({
  selector: 'app-dice',
  templateUrl: './dice.component.html',
  styleUrls: ['./dice.component.scss']
})
export class DiceComponent implements OnInit {

  @Input() name = '';
  @Input() imagesList = [];
  @Input() value: number;
  @Input() set target(value: number) {
    this.animateDice(value);
  }

  constructor(
    private ngZone: NgZone,

  ) { }

  ngOnInit(): void {
  }

  getImage() {
    return this.imagesList[this.value - 1];
  }

  async animateDice(target: number) {
    return new Promise((resolve, reject) => {
      let countdown = 15;
      let progress = 15 - countdown;
      const interval = setInterval(() => {
        let dice;
        if (--countdown <= 0) {
          clearInterval(interval);
          // this.rolling = false; // no need to set rolling to false because the progress bat fades out by itself
          dice = target;
          resolve();
        } else {
          dice = Math.floor(1 + 6 * Math.random());
        }
        this.ngZone.run(() => {
            progress = 15 - countdown;
            this.value = dice;
        });
      }, 250);
    });
  }
}
