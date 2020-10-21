import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpaceImageComponent } from './space-image.component';

describe('SpaceImageComponent', () => {
  let component: SpaceImageComponent;
  let fixture: ComponentFixture<SpaceImageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpaceImageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceImageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
