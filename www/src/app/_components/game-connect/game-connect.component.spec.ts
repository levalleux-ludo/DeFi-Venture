import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameConnectComponent } from './game-connect.component';

describe('GameConnectComponent', () => {
  let component: GameConnectComponent;
  let fixture: ComponentFixture<GameConnectComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GameConnectComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameConnectComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
