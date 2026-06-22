import { Component, signal } from '@angular/core';
import { Router, RouterOutlet } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Header } from './components/header/header';
import { Sidebar } from './components/sidebar/sidebar';
import { Footer } from './components/footer/footer';
@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet, Header, Sidebar, Footer, CommonModule],
    templateUrl: './app.html',
    styleUrl: './app.scss',
})
export class App {
    protected readonly title = signal('verificar');
    constructor(public router: Router) { }
    shouldHideLayout(): boolean {
        const currentRoute = this.router.url;
        return ['/login', '/register', ''].includes(currentRoute);
    }
}
