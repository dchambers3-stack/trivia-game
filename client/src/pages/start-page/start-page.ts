import { Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GameState } from '../../services/game-state';
import { SignalRService } from '../../services/signalr.service';

@Component({
  selector: 'app-start-page',
  imports: [ReactiveFormsModule],
  templateUrl: './start-page.html',
  styleUrl: './start-page.css',
})
export class StartPage {
  protected categories = [
    { id: 27, name: 'Animals' },
    { id: 32, name: 'Cartoons & Animations' },
    { id: 11, name: 'Film' },
    { id: 17, name: 'Science & Nature' },
    { id: 22, name: 'Geography' },
  ];

  private router = inject(Router);
  private fb = inject(FormBuilder);
  protected gameStateService = inject(GameState);
  protected signalRService = inject(SignalRService);

  protected joined = signal(false);

  protected isLeader = computed(
    () => this.signalRService.hostName() === this.gameStateService.currentPlayer,
  );

  protected nameForm = this.fb.group({
    playerName: ['', Validators.required],
    category: [null as number | null],
  });

  protected async joinAndContinue() {
    const playerName = this.nameForm.value.playerName?.trim();
    if (!playerName) return;

    this.gameStateService.addPlayer(playerName);
    await this.signalRService.startConnection();
    await this.signalRService.joinRoom(this.gameStateService.FAMILY_ROOM_CODE, playerName);
    this.joined.set(true);
  }
  protected async leaveRoom() {
    const playerName = this.nameForm.value.playerName?.trim();
    if (!playerName) return;
    this.gameStateService.removePlayer(playerName);
    await this.signalRService.leaveRoom(this.gameStateService.FAMILY_ROOM_CODE, playerName);
    this.joined.set(false);
  }

  protected async goToLobby() {
    if (this.isLeader()) {
      const category = this.nameForm.controls.category.value;
      await this.signalRService.setCategory(category ?? 0);
    }
    this.router.navigate(['/lobby']);
  }
}
