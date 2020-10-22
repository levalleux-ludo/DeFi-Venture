import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DefiFormComponent } from './defi-form.component';

describe('DefiFormComponent', () => {
  let component: DefiFormComponent;
  let fixture: ComponentFixture<DefiFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DefiFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DefiFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
