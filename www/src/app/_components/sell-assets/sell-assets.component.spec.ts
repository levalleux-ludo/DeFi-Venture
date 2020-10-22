import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SellAssetsComponent } from './sell-assets.component';

describe('SellAssetsComponent', () => {
  let component: SellAssetsComponent;
  let fixture: ComponentFixture<SellAssetsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SellAssetsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SellAssetsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
