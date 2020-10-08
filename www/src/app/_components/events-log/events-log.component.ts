import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-events-log',
  templateUrl: './events-log.component.html',
  styleUrls: ['./events-log.component.scss']
})
export class EventsLogComponent implements OnInit {

  @Input() events = [
    {log: "blabla bl albalb alb lab lab lba a"},
    {log: "aeiododie lo eoi oiz oij zzpa okokpoajk z"},
  ];

  constructor() { }

  ngOnInit(): void {
  }

}
