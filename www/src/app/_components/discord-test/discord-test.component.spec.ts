import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscordTestComponent } from './discord-test.component';

describe('DiscordTestComponent', () => {
  let component: DiscordTestComponent;
  let fixture: ComponentFixture<DiscordTestComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiscordTestComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscordTestComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
