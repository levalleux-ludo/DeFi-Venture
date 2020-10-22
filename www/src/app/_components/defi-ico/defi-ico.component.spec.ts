import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DefiIcoComponent } from './defi-ico.component';

describe('DefiIcoComponent', () => {
  let component: DefiIcoComponent;
  let fixture: ComponentFixture<DefiIcoComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DefiIcoComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefiIcoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
