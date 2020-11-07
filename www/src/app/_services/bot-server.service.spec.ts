import { TestBed } from '@angular/core/testing';

import { BotServerService } from './bot-server.service';

describe('BotServerService', () => {
  let service: BotServerService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BotServerService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
