import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GoogleMapsTokenComponent } from './google-maps-token.component';

describe('GoogleMapsTokenComponent', () => {
  let component: GoogleMapsTokenComponent;
  let fixture: ComponentFixture<GoogleMapsTokenComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GoogleMapsTokenComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(GoogleMapsTokenComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
