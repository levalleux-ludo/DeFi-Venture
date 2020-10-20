import { MyAssetsComponent } from './_components/my-assets/my-assets.component';
import { TestCanvasPageComponent } from './_components/test-canvas-page/test-canvas-page.component';
import { TestCanvasComponent } from './_components/test-canvas/test-canvas.component';
import { GameConnectComponent } from './_components/game-connect/game-connect.component';
import { GamesListComponent } from './_components/games-list/games-list.component';
import { PoolAccessPageComponent } from './_components/pool-access-page/pool-access-page.component';
import { PortisL1PageComponent } from './_components/portis-l1-page/portis-l1-page.component';
import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './_components/dashboard/dashboard.component';
import { NotFoundComponent } from './_components/not-found/not-found.component';


const routes: Routes = [
  {path: 'test-canvas', component: TestCanvasPageComponent, runGuardsAndResolvers: 'always'},
  {path: 'pool', component: PoolAccessPageComponent, runGuardsAndResolvers: 'always'},
  {path: 'games', component: GamesListComponent, runGuardsAndResolvers: 'always'},
  {path: 'game/:id', component: GameConnectComponent, runGuardsAndResolvers: 'always'},
  {path: 'dashboard', component: DashboardComponent, runGuardsAndResolvers: 'always'},
  {path: 'test/assets', component: MyAssetsComponent, runGuardsAndResolvers: 'always'},
  {path: 'portis1', component: PortisL1PageComponent},
  { path: '404', component: NotFoundComponent},
  // { path: '', pathMatch: 'full' },
  { path: '**', redirectTo: '/404', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes, {onSameUrlNavigation: 'reload'})],
  exports: [RouterModule]
})
export class AppRoutingModule { }
