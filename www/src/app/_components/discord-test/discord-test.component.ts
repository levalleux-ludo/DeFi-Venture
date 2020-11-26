import { AfterViewInit, Component, ElementRef, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-discord-test',
  templateUrl: './discord-test.component.html',
  styleUrls: ['./discord-test.component.scss']
})
export class DiscordTestComponent implements OnInit, AfterViewInit {

  @ViewChild('script', {static: true})
  script: ElementRef;

  @ViewChild('heading', {static: true})
  heading: ElementRef;

  constructor(
    private elementRef: ElementRef
  ) { }

  ngOnInit(): void {
  }

  ngAfterViewInit(): void {
    const elementHeading = this.heading.nativeElement;
    const n = document.createElement('h3');
    if (elementHeading.innerHTML) {
      n.innerHTML = elementHeading.innerHTML;
    }
    const parentHeading = elementHeading.parentElement;
    // parentHeading.parentElement.replaceChild(n, parentHeading);
    this.elementRef.nativeElement.appendChild(n);



    const elementScript = this.script.nativeElement;


    const s = document.createElement("script");
    s.type = "text/javascript";
    s.src = "https://cdn.jsdelivr.net/npm/@widgetbot/crate@3";
    s.async = true;
    s.defer = true;
    s.innerHTML = `new Crate({ server: '773475946597842954', channel: '773475946597842956', })`;
    // s.text = `

    // `;
    this.elementRef.nativeElement.appendChild(s);
  }

}
