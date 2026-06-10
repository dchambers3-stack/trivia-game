import { Component, inject, output } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { GameState } from '../../services/game-state';
import { QuestionService } from '../../services/question';
import { KeyValuePipe } from '@angular/common';

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

  protected nameForm = this.fb.group({
    playerName: ['', Validators.required],
    category: [null, Validators.required],
  });

  appendPlayerName() {
    try {
      const playerName = this.nameForm.value.playerName?.trim();
      if (playerName) {
        this.gameStateService.addPlayer(playerName);
      }
    } catch (error) {
      console.error('Error adding player name:', error);
    }
  }

  protected async goToLobby() {
    const category = this.nameForm.controls.category.value;
    this.gameStateService.setCategory(category ?? 0);
    this.appendPlayerName();
    this.router.navigate(['/lobby']);
  }
}
