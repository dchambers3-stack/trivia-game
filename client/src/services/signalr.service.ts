import { inject, Injectable, input, NgZone, signal } from '@angular/core';
import * as signalR from '@microsoft/signalr';
import { GameState } from './game-state';
import { Router } from '@angular/router';
import { QuestionService } from './question';
import { PlayerState } from '../models/player-state.type';
import { Timer } from './timer';
@Injectable({
  providedIn: 'root',
})
export class SignalRService {
  gameStateService = inject(GameState);
  questionService = inject(QuestionService);
  timerService = inject(Timer);
  router = inject(Router);
  messageReceived = signal<string>('');
  currentTurn = signal<string>('');
  isGameOver = signal<boolean>(false);
  playersInRoom = signal<PlayerState[]>([]);
  hostName = signal<string>('');
  private ngZone = inject(NgZone);
  private connection = new signalR.HubConnectionBuilder()
    .withUrl('http://localhost:5086/gamehub')
    .build();

  async startConnection(): Promise<void> {
    if (this.connection.state === signalR.HubConnectionState.Connected) {
      return;
    }
    await this.connection.start();

    // register all listeners
    await this.listenForMessages();
    await this.listenForPlayersJoined();
    await this.listenForGameStarted();
    await this.listenForTurnChanged();
    await this.listenForGameOver();
    await this.listenForGameReset();
  }
  async joinRoom(roomCode: string, playerName: string): Promise<void> {
    await this.connection.invoke('JoinRoom', roomCode, playerName);
  }
  async leaveRoom(roomCode: string, playerName: string): Promise<void> {
    await this.connection.invoke('LeaveRoom', roomCode, playerName);
  }
  async listenForMessages(): Promise<void> {
    this.connection.on('ReceiveMessage', (message: string) => {
      this.ngZone.run(() => {
        this.messageReceived.set(message);
      });
    });
  }
  async listenForPlayersJoined(): Promise<void> {
    this.connection.on('PlayersUpdated', (players: PlayerState[]) => {
      this.ngZone.run(() => {
        this.playersInRoom.set(players);
        if (!this.hostName() && players.length > 0) {
          this.hostName.set(players[0].name);
        }
      });
    });
  }
  async listenForGameStarted(): Promise<void> {
    this.connection.on('GameStarted', () => {
      this.ngZone.run(async () => {
        if (this.questionService.questions().length === 0) {
          const categoryId = this.gameStateService.category();
          await this.questionService.loadQuestions(categoryId ?? undefined);
        }
        this.router.navigate(['/game']);
        this.gameStateService.gameSound.play();
      });
    });
  }
  async listenForTurnChanged(): Promise<void> {
    this.connection.on('TurnChanged', (playerName: string, questionIndex?: number) => {
      console.log('TurnChanged received', playerName, questionIndex);
      this.ngZone.run(() => {
        this.currentTurn.set(playerName);
        if (questionIndex !== undefined) {
          this.gameStateService.currentIndex.set(questionIndex);
        }
        this.gameStateService.gameSound.play();
      });
    });
  }
  async listenForGameOver(): Promise<void> {
    this.connection.on('GameOver', (players: PlayerState[]) => {
      this.ngZone.run(() => {
        this.playersInRoom.set(players);
        this.isGameOver.set(true);
        this.router.navigate(['/results']);
      });
    });
  }
  async startGame(): Promise<void> {
    await this.connection.invoke('StartGame', this.gameStateService.FAMILY_ROOM_CODE);
  }
  async resetGame(): Promise<void> {
    this.isGameOver.set(false);
    await this.connection.invoke('ResetGame', this.gameStateService.FAMILY_ROOM_CODE);
  }
  async listenForGameReset(): Promise<void> {
    this.connection.on('GameReset', () => {
      this.ngZone.run(() => {
        this.isGameOver.set(false);
        this.hostName.set('');
        this.timerService.resetTimer();
        this.gameStateService.currentIndex.set(0);
        this.router.navigate(['/lobby']);
      });
    });
  }
  async submitAnswer(roomCode: string, playerName: string, isCorrect: boolean): Promise<void> {
    await this.connection.invoke('SubmitAnswer', roomCode, playerName, isCorrect);
  }
}
