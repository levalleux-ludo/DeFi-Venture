import { InvestFormComponent } from './../invest-form/invest-form.component';
import { ChanceDetailFormComponent } from './../chance-detail-form/chance-detail-form.component';
import { MatDialog } from '@angular/material/dialog';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-test-page',
  templateUrl: './test-page.component.html',
  styleUrls: ['./test-page.component.scss']
})
export class TestPageComponent implements OnInit {

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
  }

  showChance(chanceId) {
    ChanceDetailFormComponent.showModal(this.dialog, {chanceId}).then(() => {});
  }

  invest(assetId) {
    InvestFormComponent.showModal(this.dialog, {assetId, assetName: '#' + assetId}).then(() => {});
  }

}
