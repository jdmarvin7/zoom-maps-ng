import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'maps',
    pathMatch: 'full'
  },
  {
    path: 'maps',
    loadComponent: () => import('./modules/home/google-maps/google-maps.component').then(c => c.GoogleMapsComponent)
  },
  {
    path: '**',
    redirectTo: 'maps',
    pathMatch: 'full'
  }
];
