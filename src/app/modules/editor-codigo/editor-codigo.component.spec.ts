import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EditorCodigoComponent } from './editor-codigo.component';

describe('EditorCodigoComponent', () => {
  let component: EditorCodigoComponent;
  let fixture: ComponentFixture<EditorCodigoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EditorCodigoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EditorCodigoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
