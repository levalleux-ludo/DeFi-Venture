import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { Component, Inject, OnInit } from '@angular/core';

export interface MarketplaceFormData {

}

export interface MarketplaceResultData {

}

@Component({
  selector: 'app-marketplace-form',
  templateUrl: './marketplace-form.component.html',
  styleUrls: ['./marketplace-form.component.scss']
})
export class MarketplaceFormComponent implements OnInit {

  public static showModal(dialog: MatDialog): Promise<MarketplaceResultData> {
    const dialogRef = dialog.open(MarketplaceFormComponent, {
      width: '850px',
      height: '640px',
      disableClose: false,
      data: {message: 'Hell World!'}
    });
    return new Promise((resolve, reject) => {
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          console.log('The MarketplaceFormComponent dialog was closed', result);
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
    public dialogRef: MatDialogRef<MarketplaceFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: MarketplaceFormData
  ) { }

  ngOnInit(): void {
  }

  close() {
    this.dialogRef.close({});
  }

}
