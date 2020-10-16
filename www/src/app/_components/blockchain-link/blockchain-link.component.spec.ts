import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BlockchainLinkComponent } from './blockchain-link.component';

describe('BlockchainLinkComponent', () => {
  let component: BlockchainLinkComponent;
  let fixture: ComponentFixture<BlockchainLinkComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BlockchainLinkComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BlockchainLinkComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
