import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MyCashComponent } from './my-cash.component';

describe('MyCashComponent', () => {
  let component: MyCashComponent;
  let fixture: ComponentFixture<MyCashComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MyCashComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MyCashComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
