import { BrowserModule } from '@angular/platform-browser';
import { APP_INITIALIZER, NgModule } from '@angular/core';
import { HttpClientModule } from "@angular/common/http";

import { FlexLayoutModule } from '@angular/flex-layout';
import {FormsModule} from '@angular/forms';

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
import {MatProgressSpinnerModule} from '@angular/material/progress-spinner';
import {MatRadioModule} from '@angular/material/radio';
import {MatSnackBarModule} from '@angular/material/snack-bar';
import {MatTableModule} from '@angular/material/table';
import {MatTooltipModule} from '@angular/material/tooltip';
import {MatDialogModule} from '@angular/material/dialog';
import {MatTabsModule} from '@angular/material/tabs';
import {MatSlideToggleModule} from '@angular/material/slide-toggle';
import { MatInputCounterModule } from '@angular-material-extensions/input-counter';

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
import { PortisL1PageComponent } from './_components/portis-l1-page/portis-l1-page.component';
import { MatFormFieldModule } from '@angular/material/form-field';
import { GameFactoryComponent } from './_components/game-factory/game-factory.component';
import { PoolAccessPageComponent } from './_components/pool-access-page/pool-access-page.component';
import { GamesListComponent } from './_components/games-list/games-list.component';
import { BlockchainLinkComponent } from './_components/blockchain-link/blockchain-link.component';
import { DicesComponent } from './_components/dices/dices.component';
import { DiceComponent } from './_components/dice/dice.component';
import { TestCanvasPageComponent } from './_components/test-canvas-page/test-canvas-page.component';
import { SpaceDetailsComponent } from './_components/space-details/space-details.component';
import { MyAssetsComponent } from './_components/my-assets/my-assets.component';
import { MyCashComponent } from './_components/my-cash/my-cash.component';
import { TestPageComponent } from './_components/test-page/test-page.component';
import { OtherPlayersComponent } from './_components/other-players/other-players.component';
import { MarketplaceComponent } from './_components/marketplace/marketplace.component';
import { DefiServicesComponent } from './_components/defi-services/defi-services.component';
import { TestShowModalPageComponent } from './_components/test-show-modal-page/test-show-modal-page.component';
import { TestModalComponent } from './_components/test-modal/test-modal.component';
import { RegisterFormComponent } from './_components/register-form/register-form.component';
import { SpaceImageComponent } from './_components/space-image/space-image.component';
import { MarketplaceFormComponent } from './_components/marketplace-form/marketplace-form.component';
import { SellAssetsComponent } from './_components/sell-assets/sell-assets.component';
import { BuyAssetsComponent } from './_components/buy-assets/buy-assets.component';
import { DefiFormComponent } from './_components/defi-form/defi-form.component';
import { DefiLendCashComponent } from './_components/defi-lend-cash/defi-lend-cash.component';
import { DefiBorrowCashComponent } from './_components/defi-borrow-cash/defi-borrow-cash.component';
import { DefiIcoComponent } from './_components/defi-ico/defi-ico.component';
import { ChanceDetailFormComponent } from './_components/chance-detail-form/chance-detail-form.component';
import { ChanceDetailComponent } from './_components/chance-detail/chance-detail.component';
import { InvestFormComponent } from './_components/invest-form/invest-form.component';
import { DiscordTestComponent } from './_components/discord-test/discord-test.component';
import { DiscordConnectDialogComponent } from './_components/discord-connect-dialog/discord-connect-dialog.component';
import { DiscordWidgetbotComponent } from './_components/discord-widgetbot/discord-widgetbot.component';

export function enableWeb3Provider(provider) {
  return () => {
    // provider.enable();  // Ask the user to enable MetaMask at load time.
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
    TestCanvasComponent,
    PortisL1PageComponent,
    GameFactoryComponent,
    PoolAccessPageComponent,
    GamesListComponent,
    BlockchainLinkComponent,
    DicesComponent,
    DiceComponent,
    TestCanvasPageComponent,
    SpaceDetailsComponent,
    MyAssetsComponent,
    MyCashComponent,
    TestPageComponent,
    OtherPlayersComponent,
    MarketplaceComponent,
    DefiServicesComponent,
    TestShowModalPageComponent,
    TestModalComponent,
    RegisterFormComponent,
    SpaceImageComponent,
    MarketplaceFormComponent,
    SellAssetsComponent,
    BuyAssetsComponent,
    DefiFormComponent,
    DefiLendCashComponent,
    DefiBorrowCashComponent,
    DefiIcoComponent,
    ChanceDetailFormComponent,
    ChanceDetailComponent,
    InvestFormComponent,
    DiscordTestComponent,
    DiscordConnectDialogComponent,
    DiscordWidgetbotComponent
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
    HttpClientModule,
    MatFormFieldModule,
    FormsModule,
    MatProgressSpinnerModule,
    MatRadioModule,
    MatSnackBarModule,
    MatTableModule,
    MatTooltipModule,
    MatDialogModule,
    MatTabsModule,
    MatSlideToggleModule,
    MatInputCounterModule
  ],
  providers: [
    // {
    //   provide: APP_INITIALIZER,
    //   useFactory: enableWeb3Provider,
    //   deps: [WEB3PROVIDER],
    //   multi: true
    // }
  ],
  bootstrap: [AppComponent],
  entryComponents: [
    TestModalComponent,
    MarketplaceFormComponent
  ]
})
export class AppModule { }
