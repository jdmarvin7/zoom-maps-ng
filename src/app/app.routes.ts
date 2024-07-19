import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./modules/home/home-routing.module').then(m => m.HomeRoutingModule),
  },
  {
    path: 'home',
    loadComponent: () => import('./modules/home/google-maps/google-maps.component').then(m => m.GoogleMapsComponent)
  }
];
