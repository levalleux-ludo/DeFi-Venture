import { Injectable } from '@angular/core';
import chancesJSON from '../../assets/chances.json';

export enum eChanceImpl {
  move_n_spaces = 'move_n_spaces',
  go_to_space = 'go_to_space',
  go_to_quarantine = 'go_to_quarantine',
  covid_immunity = 'covid_immunity',
  pay_amount = 'pay_amount',
  receive_amount = 'receive_amount',
  pay_amount_per_company = 'pay_amount_per_company',
  pay_amount_per_mining_farm = 'pay_amount_per_mining_farm',
  pay_amount_per_bakery = 'pay_amount_per_bakery'
}

export interface IChance {
  text: string;
  impl: string;
  params: {
    amount?: number;
    nb?: number;
    space?: number;
  };
}
@Injectable({
  providedIn: 'root'
})
export class ChancesLibraryService {

  constructor() { }

  public get nbChances(): number {
    return chancesJSON.chances.length;
  }

  public getChanceFromId(chanceId: number): IChance | undefined {
    return chancesJSON.chances[chanceId];
  }

  public readChance(chanceId: number) {
    const chance = this.getChanceFromId(chanceId);
    if (chance) {
      let text = chance.text;
      if (chance.params.amount !== undefined) {
        text = text.replace('%AMOUNT%', chance.params.amount.toString());
      }
      if (chance.params.nb !== undefined) {
        text = text.replace('%NB%', chance.params.nb.toString());
      }
      if (chance.params.space !== undefined) {
        text = text.replace('%SPACE%', chance.params.space.toString());
      }
      return text;
    }
    return `unknown chance #${chanceId}`;
  }
}
