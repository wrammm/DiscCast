import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { ForecastPage } from './features/forecast-page/forecast-page';
import { SettingsPage } from './features/settings-page/settings-page';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, SettingsPage, ForecastPage],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('disc-cast');
}
