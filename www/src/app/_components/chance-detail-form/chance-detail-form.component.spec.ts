import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChanceDetailFormComponent } from './chance-detail-form.component';

describe('ChanceDetailFormComponent', () => {
  let component: ChanceDetailFormComponent;
  let fixture: ComponentFixture<ChanceDetailFormComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChanceDetailFormComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChanceDetailFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
