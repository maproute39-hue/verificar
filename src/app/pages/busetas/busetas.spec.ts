import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Busetas } from './busetas';

describe('Busetas', () => {
  let component: Busetas;
  let fixture: ComponentFixture<Busetas>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Busetas]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Busetas);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
