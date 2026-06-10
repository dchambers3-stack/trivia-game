import { Component, inject, OnInit } from '@angular/core';
import { GameState } from '../../services/game-state';
import { SignalRService } from '../../services/signalr.service';
import { Router } from '@angular/router';
import { QuestionService } from '../../services/question';

@Component({
  selector: 'app-game-lobby',
  templateUrl: './game-lobby.page.html',
  styleUrl: './game-lobby.page.css',
})
export class GameLobbyPage implements OnInit {
  protected signalRService = inject(SignalRService);
  protected gameStateService = inject(GameState);
  protected questionService = inject(QuestionService);
  protected router = inject(Router);

  async ngOnInit() {
    // Initialization logic here
    await this.signalRService.startConnection();
    console.log('Connection started');

    const playerName = this.gameStateService.currentPlayer;
    if (playerName) {
      await this.signalRService.joinRoom(this.gameStateService.FAMILY_ROOM_CODE, playerName);
    }
    setTimeout(() => {
      console.log(this.signalRService.messageReceived());
      console.log(this.signalRService.playersInRoom());
      console.log(this.signalRService.currentTurn());
      console.log(this.signalRService.isGameOver());
    }, 5000);
  }
  protected async startGame() {
    this.gameStateService.unlockAudio();
    await this.signalRService.startGame();
  }
}
