import { ChancesLibraryService } from './../../_services/chances-library.service';
import { Component, Inject, Input, OnInit } from '@angular/core';
// import chancesJSON from '../../../assets/chances.json';

@Component({
  selector: 'app-chance-detail',
  templateUrl: './chance-detail.component.html',
  styleUrls: ['./chance-detail.component.scss']
})
export class ChanceDetailComponent implements OnInit {

  text;

  @Input()
  set chanceId(value: number) {
    // const chance = chancesJSON.chances[value % chancesJSON.chances.length];
    const chanceId = value % this.chancesLibrary.nbChances;
    this.text = this.chancesLibrary.readChance(chanceId);
  }

  constructor(
    private chancesLibrary: ChancesLibraryService
  ) { }

  ngOnInit(): void {
  }

  // readChance(chance) {
  //   return this.chancesLibrary.readChance(chance);
  // }

}
