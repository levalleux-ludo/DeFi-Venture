import { ConnectionService } from './_services/connection.service';
import { AfterContentInit, Component, OnDestroy, OnInit } from '@angular/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit, OnDestroy, AfterContentInit {
  title = 'DeFi-Venture';
  isAuthenticated = false;
  constructor(private connectService: ConnectionService) {

  }
  ngOnInit(): void {
    this.connectService.connected.subscribe((connectionData) => {
      this.isAuthenticated = (connectionData != null);
    })
  }
  ngOnDestroy(): void {
  }
  ngAfterContentInit(): void {
  }
}
