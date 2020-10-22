import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BuyAssetsComponent } from './buy-assets.component';

describe('BuyAssetsComponent', () => {
  let component: BuyAssetsComponent;
  let fixture: ComponentFixture<BuyAssetsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BuyAssetsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BuyAssetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
