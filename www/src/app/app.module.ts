import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { HttpClientModule } from "@angular/common/http";

import { FlexLayoutModule } from '@angular/flex-layout';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { MatSliderModule } from '@angular/material/slider';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatCardModule } from '@angular/material/card';
import { MatMenuModule } from '@angular/material/menu';
import { MatTreeModule } from '@angular/material/tree';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import {MatInputModule} from '@angular/material/input';
import {MatSelectModule} from '@angular/material/select';

import { NavigationComponent } from './_components/navigation/navigation.component';
import { DashboardComponent } from './_components/dashboard/dashboard.component';
import { PlayersTreeComponent } from './_components/players-tree/players-tree.component';
import { ToolbarComponent } from './_components/toolbar/toolbar.component';
import { NotFoundComponent } from './_components/not-found/not-found.component';
import { ConnectionComponent } from './_components/connection/connection.component';
import { EthereumConnectComponent } from './_components/ethereum-connect/ethereum-connect.component';
import { WEB3PROVIDER } from './_services/ethereum.service';
import { GameConnectComponent } from './_components/game-connect/game-connect.component';
import { ContractGameMasterComponent } from './_components/contract-game-master/contract-game-master.component';
import { PlayersTableComponent } from './_components/players-table/players-table.component';
import { ContractUsdcComponent } from './_components/contract-usdc/contract-usdc.component';
import { EventsLogComponent } from './_components/events-log/events-log.component';
import { TestCanvasComponent } from './_components/test-canvas/test-canvas.component';

export function enableWeb3Provider(provider) {
  return () => {
    provider.enable();  // Ask the user to enable MetaMask at load time.
  };
}

@NgModule({
  declarations: [
    AppComponent,
    NavigationComponent,
    DashboardComponent,
    PlayersTreeComponent,
    ToolbarComponent,
    NotFoundComponent,
    ConnectionComponent,
    EthereumConnectComponent,
    GameConnectComponent,
    ContractGameMasterComponent,
    PlayersTableComponent,
    ContractUsdcComponent,
    EventsLogComponent,
    TestCanvasComponent
  ],
  imports: [
    BrowserModule,
    AppRoutingModule,
    BrowserAnimationsModule,
    MatSliderModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatGridListModule,
    MatCardModule,
    MatMenuModule,
    MatTreeModule,
    MatProgressBarModule,
    MatInputModule,
    MatSelectModule,
    FlexLayoutModule,
    HttpClientModule
  ],
  providers: [
    {
      provide: APP_INITIALIZER,
      useFactory: enableWeb3Provider,
      deps: [WEB3PROVIDER],
      multi: true
    }
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
