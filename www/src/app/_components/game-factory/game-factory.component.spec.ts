import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { GameFactoryComponent } from './game-factory.component';

describe('GameFactoryComponent', () => {
  let component: GameFactoryComponent;
  let fixture: ComponentFixture<GameFactoryComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ GameFactoryComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(GameFactoryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
