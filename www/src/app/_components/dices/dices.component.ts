import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-dices',
  templateUrl: './dices.component.html',
  styleUrls: ['./dices.component.scss']
})
export class DicesComponent implements OnInit {

  imagesDicePOW = [
    'assets/dices/dice_1_1.png',
    'assets/dices/dice_1_2.png',
    'assets/dices/dice_1_3.png',
    'assets/dices/dice_1_4.png',
    'assets/dices/dice_1_5.png',
    'assets/dices/dice_1_6.png',
  ];
  imagesDicePOS = [
    'assets/dices/dice_2_1.png',
    'assets/dices/dice_2_2.png',
    'assets/dices/dice_2_3.png',
    'assets/dices/dice_2_4.png',
    'assets/dices/dice_2_5.png',
    'assets/dices/dice_2_6.png',
  ];

  @Input()
  dicePOWValue = Math.floor(1 + 6 * Math.random());
  @Input()
  dicePOSValue = Math.floor(1 + 6 * Math.random());

  _animation;

  constructor() { }

  ngOnInit(): void {
  }

  public animate() {
    this._animation = setInterval(() => {
      this.dicePOWValue = Math.floor(1 + 6 * Math.random());
      this.dicePOSValue = Math.floor(1 + 6 * Math.random());
    }, 300);
  }

  public stopAnimation(dice1, dice2) {
    if (this._animation) {
      clearInterval(this._animation);
      this.dicePOWValue = dice1;
      this.dicePOSValue = dice2;
    }
  }

}
