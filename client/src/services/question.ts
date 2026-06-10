import { inject, Injectable, signal } from '@angular/core';
import { questions } from '../questions';
import { GameState } from './game-state';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Question } from '../models/question.type';

@Injectable({
  providedIn: 'root',
})
export class QuestionService {
  questions = signal<Question[]>([]);
  gameState = inject(GameState);
  router = inject(Router);
  private url = 'http://localhost:5086/';
  private http = inject(HttpClient);

  getQuestion(index: number): Question | null {
    const result = this.questions()[index] || null;
    console.log(result);

    return result;
  }
  async loadQuestions(categoryId?: number) {
    const result = await firstValueFrom(
      this.http.get<Question[]>(this.url + 'question', {
        params: categoryId ? { categoryId: categoryId.toString() } : {},
      }),
    );
    this.questions.set(result);
    return result;
  }
}
