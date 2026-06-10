import { inject, Injectable, signal } from '@angular/core';
import { Timer } from './timer';
import { Router } from '@angular/router';
import { type Categories } from '../models/category.type';

@Injectable({
  providedIn: 'root',
})
export class GameState {
  timerService = inject(Timer);
  router = inject(Router);
  currentIndex = signal(0);
  gameSound = new Audio('sounds/game-sound.mp3');

  unlockAudio(): void {
    this.gameSound
      .play()
      .then(() => this.gameSound.pause())
      .catch(() => {});
    this.gameSound.currentTime = 0;
  }

  players = signal<string[]>([]);
  category = signal<number | null>(null);

  FAMILY_ROOM_CODE = 'chambers-lau';
  points = signal(0);

  addPlayer(name: string) {
    this.players.update((players) => [...players, name]);
  }

  resetPoints() {
    this.points.set(0);
  }
  resetGame() {
    this.router.navigate(['/game']);
    this.resetPoints();
    this.currentIndex.set(0);
    this.timerService.resetTimer();
  }
  nextIndex() {
    this.currentIndex.update((n) => n + 1);
  }

  setCategory(category: number) {
    this.category.set(category);
  }
  get currentPlayer(): string {
    return this.players()[this.players().length - 1] || '';
  }
}
