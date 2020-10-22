import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DefiLendCashComponent } from './defi-lend-cash.component';

describe('DefiLendCashComponent', () => {
  let component: DefiLendCashComponent;
  let fixture: ComponentFixture<DefiLendCashComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DefiLendCashComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefiLendCashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
