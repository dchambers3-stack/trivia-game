import { Component, computed, effect, inject, OnInit, untracked } from '@angular/core';
import { Timer } from '../../services/timer';
import { QuestionService } from '../../services/question';
import { CurrencyPipe, JsonPipe } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { GameState } from '../../services/game-state';
import { Router } from '@angular/router';
import { SignalRService } from '../../services/signalr.service';

@Component({
  selector: 'app-game-page',
  imports: [ReactiveFormsModule, CurrencyPipe],
  templateUrl: './game-page.html',
  styleUrl: './game-page.css',
})
export class GamePage implements OnInit {
  protected timerService = inject(Timer);
  protected questionService = inject(QuestionService);
  protected gameStateService = inject(GameState);
  private fb = inject(FormBuilder);
  protected signalRService = inject(SignalRService);
  private router = inject(Router);
  protected answerForm = this.fb.group({
    answer: ['', Validators.required],
  });

  constructor() {
    this.timerService.onExpired = () => {
      if (this.signalRService.currentTurn() === this.gameStateService.currentPlayer) {
        this.signalRService.submitAnswer(
          this.gameStateService.FAMILY_ROOM_CODE,
          this.gameStateService.currentPlayer,
          false,
        );
      }
    };
    effect(() => {
      const isMyTurn = this.signalRService.currentTurn() === this.gameStateService.currentPlayer;
      untracked(() => {
        if (isMyTurn) {
          this.timerService.resetTimer();
          this.timerService.startTimer();
        } else {
          this.timerService.stopTimer();
        }
      });
    });
  }
  // This ngOnInit is temporary until we implement the game logic to start the timer when the game starts and stop it when the game ends. For now, it will start the timer when the component is initialized.
  async ngOnInit() {
    if (this.questionService.questions().length === 0) {
      this.router.navigate(['/']);
    }
  }

  protected stopTimer() {
    this.timerService.stopTimer();
  }
  protected leaveRoom() {
    const playerName = this.gameStateService.currentPlayer;
    if (playerName) {
      this.signalRService.leaveRoom(this.gameStateService.FAMILY_ROOM_CODE, playerName);
      this.router.navigate(['/']);
    }
  }
  currentQuestion = computed(() =>
    this.questionService.getQuestion(this.gameStateService.currentIndex()),
  );

  protected async checkAnswer() {
    const question = this.currentQuestion();
    const answerIndex = Number(this.answerForm.value.answer);
    const isCorrect = answerIndex === question?.correct;

    await this.signalRService.submitAnswer(
      this.gameStateService.FAMILY_ROOM_CODE,
      this.gameStateService.currentPlayer,
      isCorrect,
    );
    if (isCorrect && this.signalRService.currentTurn() === this.gameStateService.currentPlayer) {
      this.timerService.resetTimer();
      this.timerService.startTimer();
    }
    this.answerForm.reset();
  }
  get currentPlayerState() {
    return this.signalRService
      .playersInRoom()
      .find((p) => p.name === this.gameStateService.currentPlayer);
  }
  get isEliminated(): boolean {
    return (
      this.signalRService
        .playersInRoom()
        .find((p) => p.name === this.gameStateService.currentPlayer)?.isEliminated ?? false
    );
  }
}
