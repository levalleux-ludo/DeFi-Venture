import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscordWidgetbotComponent } from './discord-widgetbot.component';

describe('DiscordWidgetbotComponent', () => {
  let component: DiscordWidgetbotComponent;
  let fixture: ComponentFixture<DiscordWidgetbotComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiscordWidgetbotComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscordWidgetbotComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
