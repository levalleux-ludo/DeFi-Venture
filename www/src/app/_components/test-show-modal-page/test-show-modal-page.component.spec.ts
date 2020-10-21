import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestShowModalPageComponent } from './test-show-modal-page.component';

describe('TestShowModalPageComponent', () => {
  let component: TestShowModalPageComponent;
  let fixture: ComponentFixture<TestShowModalPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestShowModalPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestShowModalPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
