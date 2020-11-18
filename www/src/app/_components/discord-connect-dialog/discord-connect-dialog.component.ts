import { PortisL1Service } from './../../_services/portis-l1.service';
import { DiscordService } from './../../_services/discord.service';
import { AfterViewInit, Component, ElementRef, Inject, OnInit, ViewChild } from '@angular/core';
import { MatDialog, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';

// tslint:disable-next-line: no-empty-interface
export interface DiscordConnectFormData {}

// tslint:disable-next-line: no-empty-interface
export interface DiscordConnectResultData {}

@Component({
  selector: 'app-discord-connect-dialog',
  templateUrl: './discord-connect-dialog.component.html',
  styleUrls: ['./discord-connect-dialog.component.scss']
})
export class DiscordConnectDialogComponent implements OnInit, AfterViewInit {

  constructor(
    public dialogRef: MatDialogRef<DiscordConnectDialogComponent>,
    @Inject(MAT_DIALOG_DATA) public data: DiscordConnectFormData,
    private discord: DiscordService,
    private elementRef: ElementRef,
    private portisL1Service: PortisL1Service
  ) { }

  public static showModal(dialog: MatDialog): Promise<DiscordConnectResultData> {
    const dialogRef = dialog.open(DiscordConnectDialogComponent, {
      width: '410px',
      data: {},
      disableClose: true
    });
    return new Promise((resolve, reject) => {
      dialogRef.afterClosed().subscribe(result => {
        if (result) {
          console.log('The DiscordConnectDialogComponent dialog was closed', result);
          resolve(result);
        } else {
          reject(undefined);
        }
      }, error => {
        reject(error);
      });
    });
  }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
  }

  connect() {
    this.discord.jumpToLogin(this.portisL1Service.accounts[0])
    .then((userId) => {
      console.log('User successfully logged on Discord', userId);
    })
    .catch((e) => {
      console.error(e);
    })
    .finally(() => {
      // TODO: close the popup
      this.dialogRef.close({});
    });
  }

  close() {
    this.dialogRef.close({});
  }

}
