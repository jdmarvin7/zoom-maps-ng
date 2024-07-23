import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadChildren: () => import('./modules/home/home-routing.module').then(m => m.HomeRoutingModule),
  },
  {
    path: 'maps',
    loadComponent: () => import('./modules/home/google-maps/google-maps.component').then(c => c.GoogleMapsComponent)
  },
  {
    path: '**',
    loadChildren: () => import('./modules/home/google-maps/google-maps.component').then(c => c.GoogleMapsComponent)
  }
];
