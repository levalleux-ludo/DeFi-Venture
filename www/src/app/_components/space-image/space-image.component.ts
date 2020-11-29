import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { eOption, eSpaceType, ISpace } from 'src/app/_services/game-master-contract.service';
import startups from '../../../assets/startups.json';

@Component({
  selector: 'app-space-image',
  templateUrl: './space-image.component.html',
  styleUrls: ['./space-image.component.scss']
})
export class SpaceImageComponent implements OnInit {
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

  @Input()
  chanceCardId: number;

  @Input()
  owner: string;

  @Input()
  ownerAvatar: number;

  avatars = [
    undefined,
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


  // tslint:disable-next-line: no-output-on-prefix
  @Output()
  onValidate = new EventEmitter<number>();

  spaceDetail: {name: string, detail: string, image: string, price: number};

  name;
  detail;
  image;
  price;
  productPrice;

  getOptionValue(optionStr: string) {
    return eOption[optionStr];
  }

  constructor() { }

  ngOnInit(): void {
  }

  async refreshSpaceDetails() {
    if (this._playground && this._spaceId) {
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
}
