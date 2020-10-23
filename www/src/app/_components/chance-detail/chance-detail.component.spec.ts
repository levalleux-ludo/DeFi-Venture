import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChanceDetailComponent } from './chance-detail.component';

describe('ChanceDetailComponent', () => {
  let component: ChanceDetailComponent;
  let fixture: ComponentFixture<ChanceDetailComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChanceDetailComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChanceDetailComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
