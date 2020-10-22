import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DefiFormData {

}

export interface DefiResultData {

}

@Component({
  selector: 'app-defi-form',
  templateUrl: './defi-form.component.html',
  styleUrls: ['./defi-form.component.scss']
})
export class DefiFormComponent implements OnInit {
  public static showModal(dialog: MatDialog): Promise<DefiResultData> {
    const dialogRef = dialog.open(DefiFormComponent, {
      width: '850px',
      height: '600px',
      disableClose: false,
      data: {message: 'Hell World!'}
    });
    return new Promise((resolve, reject) => {
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          console.log('The DefiFormComponent dialog was closed', result);
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
    public dialogRef: MatDialogRef<DefiFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DefiFormData
  ) { }

  ngOnInit(): void {
  }

  close() {
    this.dialogRef.close({});
  }

}
