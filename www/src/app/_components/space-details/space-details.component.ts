import { ChanceDetailFormComponent } from './../chance-detail-form/chance-detail-form.component';
import { MatDialog } from '@angular/material/dialog';
import { eOption, ISpace } from './../../_services/game-master-contract.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { eSpaceType } from 'src/app/_services/game-master-contract.service';
import startups from '../../../assets/startups.json';

@Component({
  selector: 'app-space-details',
  templateUrl: './space-details.component.html',
  styleUrls: ['./space-details.component.scss']
})
export class SpaceDetailsComponent implements OnInit {

  _spaceId;
  @Input()
  set spaceId(value: number) {
    this._spaceId = value;
    this.refreshSpaceDetails();
  }
  get spaceId(): number {
    return this._spaceId;
  }

  _playground
  @Input()
  set playground(value: ISpace[]) {
    this._playground = value;
    this.refreshSpaceDetails();
  }
  get playground(): ISpace[] {
    return this._playground;
  }

  @Input()
  canValidate: boolean;

  _options: number;
  @Input()
  public set options(value: number) {
    this._options = value;
    if (
      (this._options === eOption.NOTHING)
      || (this._options === eOption.CHANCE)
      || (this._options === eOption.PAY_BILL)
      || (this._options === eOption.QUARANTINE)
    ) {
      // Only one option possible
      this.selectedOption = this._options;
    }
  }
  public get options() {
    return this._options;
  }

  @Input()
  chanceCardId: number;

  @Input()
  owner: string;

  // tslint:disable-next-line: no-output-on-prefix
  @Output()
  onValidate = new EventEmitter<number>();

  spaceDetail: {name: string, detail: string, image: string, price: number};

  name;
  detail;
  image;
  price;
  productPrice;
  selectedOption: number;

  getOptionValue(optionStr: string) {
    return eOption[optionStr];
  }

  constructor(
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
  }

  async refreshSpaceDetails() {
    if (this._playground && (this._spaceId !== undefined)) {
      const space = this._playground[this._spaceId];
      // TODO: get options from contract return (RolledDices event)
      switch (space.type) {
        case eSpaceType.GENESIS: {
          this.name = 'Genesis Block';
          this.detail = 'Each time you land or pass this block, you receive the Universal Basic Income (UBI)';
          this.image = 'assets/blocks/block_genesis.png';
          // this.options = [eOption.NOTHING];
          break;
        }
        case eSpaceType.QUARANTINE: {
          this.name = 'Quarantine Block';
          this.detail = "Please wear a face covering in this area";
          this.image = 'assets/blocks/block_Quarantine.png'; // TODO: replace with Liquidation block
          // this.options = [eOption.NOTHING];
          break;
        }
        case eSpaceType.COVID: {
          this.name = 'COVID';
          this.detail = "You've caught COVID-19. You need to lock on quarantine and you miss you next turn";
          this.image = 'assets/blocks/block_Covid.png';
          // this.options = [eOption.QUARANTINE];
          break;
        }
        case eSpaceType.CHANCE: {
          this.name = 'CHANCE';
          this.detail = "Take a Chance Card, and performs the instructions";
          this.image = 'assets/blocks/block_chance.png';
          // this.options = [eOption.CHANCE];
          // this.chanceCardId = 0; // TODO: get the cardId from the last RolledDices event
          break;
        }
        default: { // ASSET
          const asset = startups.startups[space.assetId];
          this.name = asset.name;
          this.detail = asset.detail;
          this.price = space.assetPrice;
          this.productPrice = space.productPrice;
          this.image = `assets/blocks/block_${asset.image}`;
          // this.options = [eOption.NOTHING, eOption.BUY_ASSET]; // TODO: check the asset is owned. If so, option = [eOption.Pay_BILL]
          break;
        }
      }
    }
  }

  isOptionValid(option: eOption): boolean {
    // tslint:disable-next-line: no-bitwise
    return this.options && ((this.options & option) !== 0);
  }

  validate() {
    this.onValidate.emit(this.selectedOption);
  }

  viewChance(chanceId: number) {
    ChanceDetailFormComponent.showModal(this.dialog, {chanceId}).then(() => {});
  }

}
