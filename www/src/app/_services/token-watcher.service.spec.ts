import { TestBed } from '@angular/core/testing';

import { TokenWatcherService } from './token-watcher.service';

describe('TokenWatcherService', () => {
  let service: TokenWatcherService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TokenWatcherService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
