import { MarketplaceFormComponent } from './../marketplace-form/marketplace-form.component';
import { MatDialog } from '@angular/material/dialog';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-marketplace',
  templateUrl: './marketplace.component.html',
  styleUrls: ['./marketplace.component.scss']
})
export class MarketplaceComponent implements OnInit {

  constructor(
    private dialog: MatDialog
  ) { }

  ngOnInit(): void {
  }

  showDialog() {
    MarketplaceFormComponent.showModal(this.dialog).then((result) => {

    }).catch(() => {

    });
  }

}
