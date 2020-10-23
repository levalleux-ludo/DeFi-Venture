import { Component, Inject, Input, OnInit } from '@angular/core';
import chancesJSON from '../../../assets/chances.json';

@Component({
  selector: 'app-chance-detail',
  templateUrl: './chance-detail.component.html',
  styleUrls: ['./chance-detail.component.scss']
})
export class ChanceDetailComponent implements OnInit {

  text;

  @Input()
  set chanceId(value: number) {
    const chance = chancesJSON.chances[value % chancesJSON.chances.length];
    this.text = this.readChance(chance);
  }

  constructor() { }

  ngOnInit(): void {
  }

  readChance(chance) {
    let text = chance.text;
    if (chance.amount) {
      text = text.replace('%AMOUNT%', chance.amount);
    }
    if (chance.nb) {
      text = text.replace('%NB%', chance.nb);
    }
    return text;
  }

}
