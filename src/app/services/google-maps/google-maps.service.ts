import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
    providedIn: 'root'
})
export class GoogleMapsService {
    private geoJson$ = new BehaviorSubject<any>({
        "type": "FeatureCollection",
        "features": []
      });
    private geoJsonSubject = this.geoJson$.asObservable();

    constructor() {}

    pegarGeoJson(): Observable<string> {
        return this.geoJsonSubject;
    }

    setarGeoJson(content: string): void {
        console.log("Começou a inserir")
        this.geoJson$.next(content);
    }
}
