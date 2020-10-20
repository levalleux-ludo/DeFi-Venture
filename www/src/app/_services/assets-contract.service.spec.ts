import { TestBed } from '@angular/core/testing';

import { AssetsContractService } from './assets-contract.service';

describe('AssetsContractService', () => {
  let service: AssetsContractService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AssetsContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
