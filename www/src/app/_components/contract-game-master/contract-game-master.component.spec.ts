import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ContractGameMasterComponent } from './contract-game-master.component';

describe('ContractGameMasterComponent', () => {
  let component: ContractGameMasterComponent;
  let fixture: ComponentFixture<ContractGameMasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ContractGameMasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ContractGameMasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
