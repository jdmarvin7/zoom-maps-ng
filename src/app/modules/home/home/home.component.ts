import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { GoogleMapsComponent } from '../google-maps/google-maps.component';

@Component({
    selector: 'app-home',
    standalone: false,
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent {}
