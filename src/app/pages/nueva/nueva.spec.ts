import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Nueva } from './nueva';

describe('Nueva', () => {
  let component: Nueva;
  let fixture: ComponentFixture<Nueva>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Nueva]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Nueva);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
