import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SpaceDetailsComponent } from './space-details.component';

describe('SpaceDetailsComponent', () => {
  let component: SpaceDetailsComponent;
  let fixture: ComponentFixture<SpaceDetailsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SpaceDetailsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SpaceDetailsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
