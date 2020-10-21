import { eAvatar } from './../../_services/game-master-contract.service';
import { Component, Inject, OnInit } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface RegisterFormData {
  message: string;
}

export interface RegisterResultData {
  username: string;
  avatar: number;
}

@Component({
  selector: 'app-register-form',
  templateUrl: './register-form.component.html',
  styleUrls: ['./register-form.component.scss']
})
export class RegisterFormComponent implements OnInit {

  username;
  selectedAvatar = 0;
  avatars = [
    {id: eAvatar.Nobody, name: 'nobody'},
    {id: eAvatar.Camel, name: 'camel'},
    {id: eAvatar.Microchip, name: 'crypto-chip'},
    {id: eAvatar.Diamond, name: 'diamond'},
    {id: eAvatar.Rocket, name: 'rocket'}
  ];

  public static showModal(dialog: MatDialog): Promise<RegisterResultData> {
    const dialogRef = dialog.open(RegisterFormComponent, {
      width: '850px',
      data: {message: 'Hell World!'}
    });
    return new Promise((resolve, reject) => {
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          console.log('The RegisterFormComponent dialog was closed', result);
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
    public dialogRef: MatDialogRef<RegisterFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: RegisterFormData
  ) { }

  ngOnInit(): void {
  }

  get canValidate(): boolean {
    return (this.username && (this.username !== '') && (this.selectedAvatar !== 0));
  }

  selectAvatar(avatar: number) {
    this.selectedAvatar = avatar;
  }

  validate() {
    this.dialogRef.close({username: this.username, avatar: this.selectedAvatar});
  }

}
