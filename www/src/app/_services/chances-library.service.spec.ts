import { TestBed } from '@angular/core/testing';

import { ChancesLibraryService } from './chances-library.service';

describe('ChancesLibraryService', () => {
  let service: ChancesLibraryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ChancesLibraryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
