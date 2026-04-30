import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ForecastPage } from './forecast-page';

describe('ForecastPage', () => {
  let component: ForecastPage;
  let fixture: ComponentFixture<ForecastPage>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ForecastPage],
    }).compileComponents();

    fixture = TestBed.createComponent(ForecastPage);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
