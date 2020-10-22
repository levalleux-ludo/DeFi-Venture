import { GameTokenContractService } from './../../_services/game-token-contract.service';
import { Component, EventEmitter, Input, OnInit, Output } from '@angular/core';
import { GameMasterContractService } from 'src/app/_services/game-master-contract.service';
import { PortisL1Service } from 'src/app/_services/portis-l1.service';

@Component({
  selector: 'app-defi-lend-cash',
  templateUrl: './defi-lend-cash.component.html',
  styleUrls: ['./defi-lend-cash.component.scss']
})
export class DefiLendCashComponent implements OnInit {

  stakeAmount = 0;

  @Input()
  cash = 0;

  playground;
  @Output()
  validate = new EventEmitter<{
    stakeAmount: number
  }>();

  constructor(
    private portisService: PortisL1Service,
    private gameMasterContractService: GameMasterContractService,
    private gameTokenContractService: GameTokenContractService
  ) { }

  ngOnInit(): void {
    this.portisService.onConnect.subscribe(({network, account}) => {
      this.gameMasterContractService.onUpdate.subscribe((gameData) => {
        if (gameData) {
          this.playground = gameData.playground;
          this.refresh();
        }
      });
      this.gameTokenContractService.onUpdate.subscribe((tokenData) => {
        if (tokenData) {
          if (tokenData.balances.has(account)) {
            this.cash = tokenData.balances.get(account).toNumber();
            this.refresh();
          }
        }
      });
    });
  }

  refresh() {

  }

  apply() {
    this.validate.emit({
      stakeAmount: this.stakeAmount
    })
  }

}
