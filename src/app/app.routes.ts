import { Routes } from '@angular/router';
export const routes: Routes = [
    {
        path: '',
        redirectTo: 'login',
        pathMatch: 'full',
    },
    {
        path: 'home',
        loadComponent: () => import('./pages/home/home').then((c) => c.Home),
        title: 'Verificar',
        data: {
            description: 'Verificar ',
            canonical: '/',
        },
    },
    {
        path: 'nueva',
        loadComponent: () => import('./pages/nueva/nueva').then((c) => c.Nueva),
        title: 'Nueva',
        data: {
            description: 'Verificar ',
            canonical: '/',
        },
    },
    {
        path: 'heredada',
        loadComponent: () => import('./pages/heredada/heredada').then((m) => m.Heredada),
        title: 'Nueva inspección heredada',
    },
    {
        path: 'login',
        loadComponent: () => import('./pages/login/login').then((c) => c.Login),
        title: 'Login',
        data: {
            description: 'Verificar ',
            canonical: '/',
        },
    },
    {
        path: 'inspections',
        loadComponent: () => import('./pages/inspections/inspections').then((c) => c.Inspections),
        title: 'Inspecciones',
        data: {
            description: 'Verificar ',
            canonical: '/',
        },
    },
    {
        path: 'detail/:id',
        loadComponent: () => import('./pages/detail/detail').then((m) => m.Detail),
        title: 'Detalle de Inspección',
        data: {
            description: 'Detalle de la inspección',
        },
    },
];
