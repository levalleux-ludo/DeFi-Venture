import { TestBed } from '@angular/core/testing';

import { GameTokenContractService } from './game-token-contract.service';

describe('GameTokenContractService', () => {
  let service: GameTokenContractService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameTokenContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
