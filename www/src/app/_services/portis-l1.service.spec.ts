import { TestBed } from '@angular/core/testing';

import { PortisL1Service } from './portis-l1.service';

describe('PortisL1Service', () => {
  let service: PortisL1Service;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PortisL1Service);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
