import { TestBed } from '@angular/core/testing';

import { GameTranslatorService } from './game-translator.service';

describe('GameTranslatorService', () => {
  let service: GameTranslatorService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GameTranslatorService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
