import { TestBed } from '@angular/core/testing';

import { AssetsLibraryService } from './assets-library.service';

describe('AssetsLibraryService', () => {
  let service: AssetsLibraryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetsLibraryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
