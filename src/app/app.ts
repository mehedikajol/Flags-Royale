import { Component, signal } from '@angular/core';
import { FlagsRoyaleComponent } from './components/flags-royale/flags-royale.component';

@Component({
  imports: [FlagsRoyaleComponent],
  standalone: true,
  selector: 'app-root',
  styleUrl: './app.css',
  templateUrl: './app.html',
})
export class App {
  protected readonly title = signal('flags-royale');
}
