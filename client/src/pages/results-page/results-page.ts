import { Component, inject, OnDestroy, OnInit, signal } from '@angular/core';
import { GameState } from '../../services/game-state';
import { CurrencyPipe } from '@angular/common';
import { Timer } from '../../services/timer';
import { Router } from '@angular/router';
import { QuestionService } from '../../services/question';
import { SignalRService } from '../../services/signalr.service';

@Component({
  selector: 'app-results-page',
  imports: [CurrencyPipe],
  templateUrl: './results-page.html',
  styleUrl: './results-page.css',
})
export class ResultsPage implements OnInit, OnDestroy {
  protected countdown = signal(20);
  private countdownInterval: ReturnType<typeof setInterval> | null = null;

  ngOnInit() {
    if (!this.isHost) return;
    this.countdownInterval = setInterval(() => {
      this.countdown.update((c) => c - 1);
      if (this.countdown() === 0) {
        this.onPlayAgainClicked();
      }
    }, 1000);
  }

  ngOnDestroy() {
    if (this.countdownInterval) {
      clearInterval(this.countdownInterval);
      this.countdownInterval = null;
    }
  }

  get isHost(): boolean {
    return this.signalRService.hostName() === this.gameStateService.currentPlayer;
  }
  protected gameStateService = inject(GameState);
  protected questionService = inject(QuestionService);
  protected signalRService = inject(SignalRService);
  protected timerService = inject(Timer);
  private router = inject(Router);

  protected async onPlayAgainClicked() {
    await this.signalRService.resetGame();
    this.gameStateService.resetPoints();
    this.gameStateService.currentIndex.set(0);
    this.timerService.resetTimer();
    this.router.navigate(['/lobby']);
  }
}
