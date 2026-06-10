import { Injectable, signal } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Timer {
  timer = signal(30);
  timerStarted = signal(false);
  private intervalId: number | undefined;
  onExpired: (() => void) | null = null;

  startTimer() {
    this.timerStarted.set(true);
    this.intervalId = setInterval(() => {
      this.timer.update((time) => time - 1);
      if (this.timer() <= 0) {
        this.stopTimer();
        this.onExpired?.();
      }
    }, 1000);
  }

  stopTimer() {
    this.timerStarted.set(false);
    if (this.intervalId !== undefined) {
      clearInterval(this.intervalId);
    }
  }

  async resetTimer() {
    await this.stopTimer();
    this.timer.update((time) => (time = 30));
  }
}
