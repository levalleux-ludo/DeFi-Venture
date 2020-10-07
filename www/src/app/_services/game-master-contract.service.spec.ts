import { TestBed } from '@angular/core/testing';

import { GameMasterContractService } from './game-master-contract.service';

describe('GameMasterContractService', () => {
  let service: GameMasterContractService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameMasterContractService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
