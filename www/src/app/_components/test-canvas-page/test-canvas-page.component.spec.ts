import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TestCanvasPageComponent } from './test-canvas-page.component';

describe('TestCanvasPageComponent', () => {
  let component: TestCanvasPageComponent;
  let fixture: ComponentFixture<TestCanvasPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TestCanvasPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TestCanvasPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
