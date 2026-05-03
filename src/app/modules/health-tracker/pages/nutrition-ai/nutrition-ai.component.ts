import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { HttpErrorResponse } from '@angular/common/http';
import { NutritionAnalysis } from '../../models/nutrition-ai.model';
import { NutritionAiService } from '../../services/nutrition-ai.service';

@Component({
  selector: 'app-nutrition-ai',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nutrition-ai.component.html',
  styleUrl: './nutrition-ai.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class NutritionAiComponent implements OnInit, OnDestroy {
  private readonly nutritionAiService = inject(NutritionAiService);
  private previewObjectUrl: string | null = null;

  readonly loading = signal(false);
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly analysis = signal<NutritionAnalysis | null>(null);
  readonly history = signal<NutritionAnalysis[]>([]);
  readonly errorMessage = signal('');

  readonly hasSelectedFile = computed(() => this.selectedFile() !== null);
  readonly hasResult = computed(() => this.analysis() !== null);
  readonly hasHistory = computed(() => this.history().length > 0);
  readonly historyItems = computed(() => [...this.history()]);

  ngOnInit(): void {
    this.loadHistory();
  }

  ngOnDestroy(): void {
    this.revokePreviewUrl();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;

    if (!file) {
      return;
    }

    if (!file.type.startsWith('image/')) {
      this.resetSelectedFile();
      this.errorMessage.set('Please choose a valid image file.');
      input.value = '';
      return;
    }

    const maxSizeInMb = 8;
    if (file.size > maxSizeInMb * 1024 * 1024) {
      this.resetSelectedFile();
      this.errorMessage.set(`Image is too large. Please use a file smaller than ${maxSizeInMb} MB.`);
      input.value = '';
      return;
    }

    this.revokePreviewUrl();
    this.selectedFile.set(file);
    this.previewObjectUrl = URL.createObjectURL(file);
    this.previewUrl.set(this.previewObjectUrl);
    this.errorMessage.set('');
  }

  analyzeImage(): void {
    const file = this.selectedFile();
    if (!file || this.loading()) {
      this.errorMessage.set('Please select a food image before analyzing it.');
      return;
    }

    this.errorMessage.set('');
    this.loading.set(true);

    this.nutritionAiService
      .analyzeNutrition(file)
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (result) => {
          this.analysis.set(result);
          this.nutritionAiService.saveHistory(result).subscribe({
            next: (history) => this.history.set(history)
          });
        },
        error: (error: HttpErrorResponse) => {
          this.errorMessage.set(this.extractErrorMessage(error));
        }
      });
  }

  clearSelection(): void {
    this.resetSelectedFile();
    this.analysis.set(null);
    this.errorMessage.set('');
  }

  clearHistory(): void {
    this.nutritionAiService.clearHistory().subscribe({
      next: () => this.history.set([])
    });
  }

  trackByHistoryItem(index: number, item: NutritionAnalysis): number {
    return item.id ?? index;
  }

  getCalorieBand(calories: number): 'low' | 'medium' | 'high' {
    if (calories < 250) {
      return 'low';
    }

    if (calories < 500) {
      return 'medium';
    }

    return 'high';
  }

  formatCalories(calories: number): string {
    return `${Math.round(calories)} kcal`;
  }

  formatConfidence(confidence: number): string {
    return `${Math.round(confidence)}%`;
  }

  formatAnalysisTime(value: string): string {
    return new Date(value).toLocaleString([], {
      dateStyle: 'medium',
      timeStyle: 'short'
    });
  }

  getSelectedFoodAlt(): string {
    const fileName = this.selectedFile()?.name;
    return fileName
      ? `Aperçu de l'aliment sélectionné pour ${fileName}`
      : "Aperçu de l'aliment sélectionné";
  }

  private loadHistory(): void {
    this.nutritionAiService.loadHistory().subscribe({
      next: (history) => this.history.set(history)
    });
  }

  private resetSelectedFile(): void {
    this.selectedFile.set(null);
    this.previewUrl.set(null);
    this.revokePreviewUrl();
  }

  private revokePreviewUrl(): void {
    if (this.previewObjectUrl) {
      URL.revokeObjectURL(this.previewObjectUrl);
      this.previewObjectUrl = null;
    }
  }

  private extractErrorMessage(error: HttpErrorResponse): string {
    const backendMessage = (error.error?.message || error.error?.error || error.error?.details || '').toString().trim();
    if (backendMessage) {
      return backendMessage;
    }

    if (error.status === 0) {
      return 'AI service is unavailable right now. Please try again later.';
    }

    if (error.status === 400) {
      return 'The image could not be analyzed. Please upload a valid food image.';
    }

    return 'Unexpected error while analyzing the image. Please retry.';
  }
}