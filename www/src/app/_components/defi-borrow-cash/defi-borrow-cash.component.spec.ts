import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DefiBorrowCashComponent } from './defi-borrow-cash.component';

describe('DefiBorrowCashComponent', () => {
  let component: DefiBorrowCashComponent;
  let fixture: ComponentFixture<DefiBorrowCashComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DefiBorrowCashComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefiBorrowCashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
