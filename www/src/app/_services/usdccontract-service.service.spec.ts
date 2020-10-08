import { TestBed } from '@angular/core/testing';

import { USDCContractServiceService } from './usdccontract-service.service';

describe('USDCContractServiceService', () => {
  let service: USDCContractServiceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(USDCContractServiceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
