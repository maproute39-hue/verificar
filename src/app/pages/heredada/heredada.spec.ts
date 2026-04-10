import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Heredada } from './heredada';

describe('Heredada', () => {
  let component: Heredada;
  let fixture: ComponentFixture<Heredada>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Heredada]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Heredada);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
