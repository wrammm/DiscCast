import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DiscGolfScore, DiscGolfScoreBreakdown } from '../../services/disc-golf-score';
import { OpenMeteo } from '../../services/open-meteo';
import { Settings } from '../../services/settings.service';

@Component({
  selector: 'app-forecast-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './forecast-page.html',
  styleUrl: './forecast-page.scss',
})
export class ForecastPage {
  private readonly weatherService = inject(OpenMeteo);
  private readonly scoreService = inject(DiscGolfScore);
  private readonly settingsService = inject(Settings);

  readonly locationQuery = signal('Omaha');
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);
  readonly score = signal<DiscGolfScoreBreakdown | null>(null);
  readonly locationName = signal<string | null>(null);

  search(): void {
    const query = this.locationQuery().trim();

    if (!query) {
      this.error.set('Enter a location first.');
      return;
    }

    this.loading.set(true);
    this.error.set(null);
    this.score.set(null);

    this.weatherService.searchAndForecast(query).subscribe({
      next: ({ location, forecast }) => {
        const score = this.scoreService.scoreCurrentConditions(
          forecast,
          this.settingsService.settings(),
        );

        this.locationName.set(
          [location.name, location.admin1, location.country].filter(Boolean).join(', '),
        );

        this.score.set(score);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err?.message ?? 'Unable to load weather.');
        this.loading.set(false);
      },
    });
  }
}
