import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TimerBar } from './timer-bar';

describe('TimerBar', () => {
  let component: TimerBar;
  let fixture: ComponentFixture<TimerBar>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TimerBar],
    }).compileComponents();

    fixture = TestBed.createComponent(TimerBar);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
