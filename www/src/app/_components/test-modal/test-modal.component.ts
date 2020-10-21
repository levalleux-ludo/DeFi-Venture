import { Component, Inject, OnInit } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

export interface DialogData {
  message: string;
}

@Component({
  selector: 'app-test-modal',
  templateUrl: './test-modal.component.html',
  styleUrls: ['./test-modal.component.scss']
})
export class TestModalComponent implements OnInit {

  username;
  selectedAvatar;

  constructor(
    public dialogRef: MatDialogRef<TestModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DialogData
  ) { }

  ngOnInit(): void {
  }

  get canValidate(): boolean {
    return (this.username && (this.username !== '') && (this.selectAvatar !== undefined));
  }

  selectAvatar(avatar: string) {
    this.selectedAvatar = avatar;
  }

  validate() {
    this.dialogRef.close({username: this.username});
  }

}
