import { Injectable, signal } from '@angular/core';
import {
  DEFAULT_DISC_GOLF_SETTINGS,
  DiscGolfWeatherSettings,
} from '../models/scoring-settings.model';

@Injectable({
  providedIn: 'root',
})
export class Settings {
  private readonly storageKey = 'disc-golf-weather-settings';

  readonly settings = signal<DiscGolfWeatherSettings>(this.loadSettings());

  updateSettings(settings: DiscGolfWeatherSettings): void {
    this.settings.set(settings);
    localStorage.setItem(this.storageKey, JSON.stringify(settings));
  }

  reset(): void {
    this.updateSettings(DEFAULT_DISC_GOLF_SETTINGS);
  }

  private loadSettings(): DiscGolfWeatherSettings {
    const raw = localStorage.getItem(this.storageKey);

    if (!raw) {
      return DEFAULT_DISC_GOLF_SETTINGS;
    }

    try {
      return {
        ...DEFAULT_DISC_GOLF_SETTINGS,
        ...JSON.parse(raw),
      };
    } catch {
      return DEFAULT_DISC_GOLF_SETTINGS;
    }
  }
}