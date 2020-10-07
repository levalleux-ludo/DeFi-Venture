import { NgModule } from '@angular/core';
import { Routes, RouterModule } from '@angular/router';
import { DashboardComponent } from './_components/dashboard/dashboard.component';
import { NotFoundComponent } from './_components/not-found/not-found.component';


const routes: Routes = [
  {path: 'dashboard', component: DashboardComponent},
  { path: '404', component: NotFoundComponent},
  // { path: '', pathMatch: 'full' },
  { path: '**', redirectTo: '/404', pathMatch: 'full'}
];

@NgModule({
  imports: [RouterModule.forRoot(routes)],
  exports: [RouterModule]
})
export class AppRoutingModule { }
