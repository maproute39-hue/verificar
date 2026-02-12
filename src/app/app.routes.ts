import { Routes } from '@angular/router';
export const routes: Routes = [
      {
    path: '',
    redirectTo: 'login',
    pathMatch: 'full'
  },
  {
    path: 'home',
    loadComponent: () =>
      import('./pages/home/home').then(c => c.Home),
    title: 'Verificar',
    data: {
      description: 'Verificar ',
      canonical: '/',
/*       canActivate: [authGuard],
 */    },
  },
  {
    path: 'nueva',
    loadComponent: () => import('./pages/nueva/nueva').then(m => m.Nueva)
  },

  {
    path: 'nueva',
    loadComponent: () =>
      import('./pages/nueva/nueva').then(c => c.Nueva),
    title: 'Nueva',
    data: {
      description: 'Verificar ',
      canonical: '/',
/*       canActivate: [authGuard],
 */    },
  },
  {
    path: 'busetas',
    loadComponent: () =>
      import('./pages/busetas/busetas').then(c => c.Busetas),
    title: 'Busetas',
    data: {
      description: 'Verificar ',
      canonical: '/',
/*       canActivate: [authGuard],
 */    },
  },
  {
    path: 'login',
    loadComponent: () =>
      import('./pages/login/login').then(c => c.Login),
    title: 'Login',
    data: {
      description: 'Verificar ',
      canonical: '/',
/*       canActivate: [authGuard],
 */    },
  },
  {
    path: 'inspections',
    loadComponent: () =>
      import('./pages/inspections/inspections').then(c => c.Inspections),
    title: 'Inspecciones',
    data: {
      description: 'Verificar ',
      canonical: '/',
/*       canActivate: [authGuard],
 */    },
  },
  {
  path: 'detail/:id',
  loadComponent: () => import('./pages/detail/detail').then(m => m.Detail),
  title: 'Detalle de Inspección',
  data: {
    description: 'Detalle de la inspección',
  },
},
];

