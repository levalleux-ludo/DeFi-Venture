import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, Input } from '@angular/core';

declare var widgetbot;

@Component({
  selector: 'app-discord-widgetbot',
  templateUrl: './discord-widgetbot.component.html',
  styleUrls: ['./discord-widgetbot.component.scss']
})
export class DiscordWidgetbotComponent implements OnInit, AfterViewInit {

  _guildId: string = '0';
  @Input()
  set guildId(value: string) {
    this._guildId = value;
    console.log('DiscordWidgetbotComponent GuildId:', value);
    this.refreshChannel();
  }

  _channelId: string = '0';
  @Input()
  set channelId(value: string) {
    this._channelId = value;
    console.log('DiscordWidgetbotComponent ChannelId:', value);
    this.refreshChannel();
  }

  scriptElement;
  constructor(
    private elementRef: ElementRef
  ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    this.refreshChannel();
  }

  refreshChannel() {
    const nodes = this.elementRef.nativeElement.ownerDocument.getElementsByTagName("widgetbot-crate");
    while(nodes.length > 0) {
      nodes[0].parentElement.removeChild(nodes[0]);
    }
    if (this.scriptElement) {
      this.elementRef.nativeElement.removeChild(this.scriptElement);
      this.scriptElement = undefined;
    }
    this.addWidgetbot();
  }

  addWidgetbot() {
    this.scriptElement = document.createElement("script");
    this.scriptElement.type = "text/javascript";
    this.scriptElement.src = "https://cdn.jsdelivr.net/npm/@widgetbot/crate@3";
    this.scriptElement.async = true;
    this.scriptElement.defer = true;
    this.scriptElement.innerHTML = `var widgetbot = new Crate({ server: '${this._guildId}', channel: '${this._channelId}', })`;
    this.elementRef.nativeElement.appendChild(this.scriptElement);
  }

}
