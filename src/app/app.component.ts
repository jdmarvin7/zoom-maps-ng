import { environment } from './environments/environments';
import { DOCUMENT } from '@angular/common';
import { Component, Inject, OnInit, Renderer2, isDevMode } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { environment as prd } from './environments/environment.prod';

@Component({
    selector: 'app-root',
    standalone: true,
    imports: [RouterOutlet],
    template: '<router-outlet></router-outlet>'
})
export class AppComponent implements OnInit {
    token: string = ''
    constructor(
        private renderer: Renderer2,
        @Inject(DOCUMENT) private document: Document,
    ) {}

    ngOnInit(): void {
        if (isDevMode()) {
            console.log("Tamo na dev");
            this.token = environment.googleApiKey;
        } else {
            this.token = prd.googleApiKey;
        }
        const script = this.document.createElement('script');
        script.type = 'text/javascript';
        script.src = `https://maps.googleapis.com/maps/api/js?key=${this.token}&libraries=drawing`;
        script.async = true;
        this.renderer.appendChild(this.document.head, script);
    }
}
