import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, Input, OnInit } from '@angular/core';
import chancesJSON from '../../../assets/chances.json';

export interface ChanceFormData {
  chanceId: number
}

export interface ChanceResultData {

}

@Component({
  selector: 'app-chance-detail-form',
  templateUrl: './chance-detail-form.component.html',
  styleUrls: ['./chance-detail-form.component.scss']
})
export class ChanceDetailFormComponent implements OnInit {

  public static showModal(dialog: MatDialog, data: ChanceFormData): Promise<ChanceResultData> {
    const dialogRef = dialog.open(ChanceDetailFormComponent, {
      width: '850px',
      height: '640px',
      disableClose: false,
      data
    });
    return new Promise((resolve, reject) => {
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          console.log('The ChanceDetailFormComponent dialog was closed', result);
          resolve(result);
        } else {
          reject(undefined);
        }
      }, error => {
        reject(error);
      });
    });
  }

  constructor(
    public dialogRef: MatDialogRef<ChanceDetailFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: ChanceFormData
  ) { }

  ngOnInit(): void {
  }

  close() {
    this.dialogRef.close({});
  }

}

