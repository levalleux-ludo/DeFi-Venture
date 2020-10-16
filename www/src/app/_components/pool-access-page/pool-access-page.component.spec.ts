import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PoolAccessPageComponent } from './pool-access-page.component';

describe('PoolAccessPageComponent', () => {
  let component: PoolAccessPageComponent;
  let fixture: ComponentFixture<PoolAccessPageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PoolAccessPageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PoolAccessPageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
