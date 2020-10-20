import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DefiServicesComponent } from './defi-services.component';

describe('DefiServicesComponent', () => {
  let component: DefiServicesComponent;
  let fixture: ComponentFixture<DefiServicesComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DefiServicesComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefiServicesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
