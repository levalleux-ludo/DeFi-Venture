import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DiscordConnectDialogComponent } from './discord-connect-dialog.component';

describe('DiscordConnectDialogComponent', () => {
  let component: DiscordConnectDialogComponent;
  let fixture: ComponentFixture<DiscordConnectDialogComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DiscordConnectDialogComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DiscordConnectDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
