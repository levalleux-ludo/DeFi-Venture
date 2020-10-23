import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, Input, OnInit } from '@angular/core';
import { GameMasterContractService } from 'src/app/_services/game-master-contract.service';
import { GameTokenContractService } from 'src/app/_services/game-token-contract.service';
import { PortisL1Service } from 'src/app/_services/portis-l1.service';

export interface InvestFormData {
  assetId: number;
  assetName: string;
}

export interface InvestResultData {

}

@Component({
  selector: 'app-invest-form',
  templateUrl: './invest-form.component.html',
  styleUrls: ['./invest-form.component.scss']
})
export class InvestFormComponent implements OnInit {

  public static showModal(dialog: MatDialog, data: InvestFormData): Promise<InvestResultData> {
    const dialogRef = dialog.open(InvestFormComponent, {
      width: '640px',
      height: '300px',
      disableClose: false,
      data
    });
    return new Promise((resolve, reject) => {
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          console.log('The InvestFormComponent dialog was closed', result);
          resolve(result);
        } else {
          reject(undefined);
        }
      }, error => {
        reject(error);
      });
    });
  }

  @Input()
  cash = 0;

  playground;

  investAmount = 0;;

  constructor(
    public dialogRef: MatDialogRef<InvestFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: InvestFormData,
    private portisService: PortisL1Service,
    private gameMasterContractService: GameMasterContractService,
    private gameTokenContractService: GameTokenContractService

  ) { }

  ngOnInit(): void {
    this.portisService.onConnect.subscribe(({network, account}) => {
      this.gameMasterContractService.onUpdate.subscribe((gameData) => {
        if (gameData) {
          this.playground = gameData.playground;
        }
      });
      this.gameTokenContractService.onUpdate.subscribe((tokenData) => {
        if (tokenData) {
          if (tokenData.balances.has(account)) {
            this.cash = tokenData.balances.get(account).toNumber();
          }
        }
      });
    });
   }

  close() {
    this.dialogRef.close({});
  }

}
