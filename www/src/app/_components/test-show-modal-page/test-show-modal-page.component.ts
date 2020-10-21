import { TestModalComponent } from './../test-modal/test-modal.component';
import { Component, OnInit } from '@angular/core';
import {MatDialog, MatDialogRef, MAT_DIALOG_DATA} from '@angular/material/dialog';

@Component({
  selector: 'app-test-show-modal-page',
  templateUrl: './test-show-modal-page.component.html',
  styleUrls: ['./test-show-modal-page.component.scss']
})
export class TestShowModalPageComponent implements OnInit {

  constructor(public dialog: MatDialog) { }

  ngOnInit(): void {
  }

  showModal() {
    const dialogRef = this.dialog.open(TestModalComponent, {
      width: '850px',
      data: {message: 'Hell World!'}
    });

    dialogRef.afterClosed().subscribe(result => {
      console.log('The dialog was closed', result);
    });
  }

}
