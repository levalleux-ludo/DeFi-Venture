import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractUsdcComponent } from './contract-usdc.component';

describe('ContractUsdcComponent', () => {
  let component: ContractUsdcComponent;
  let fixture: ComponentFixture<ContractUsdcComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContractUsdcComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractUsdcComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
