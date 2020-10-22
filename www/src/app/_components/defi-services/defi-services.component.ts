import { MatDialog } from '@angular/material/dialog';
import { DefiFormComponent } from './../defi-form/defi-form.component';
import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'app-defi-services',
  templateUrl: './defi-services.component.html',
  styleUrls: ['./defi-services.component.scss']
})
export class DefiServicesComponent implements OnInit {

  constructor(private dialog: MatDialog) { }

  ngOnInit(): void {
  }

    showDialog() {
    DefiFormComponent.showModal(this.dialog).then((result) => {

    }).catch(() => {

    });
  }

}
