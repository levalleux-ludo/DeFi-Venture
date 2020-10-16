import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { PortisL1PageComponent } from './portis-l1-page.component';

describe('PortisL1PageComponent', () => {
  let component: PortisL1PageComponent;
  let fixture: ComponentFixture<PortisL1PageComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ PortisL1PageComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(PortisL1PageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
