import { ChangeDetectionStrategy, Component, inject, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '@portal/shared';

@Component({
  selector: 'portal-student-layout',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './student-layout.component.html',
  styleUrl: './student-layout.component.scss',
})
export class StudentLayoutComponent implements OnInit, OnDestroy {
  protected readonly theme = inject(ThemeService);
  private readonly el = inject(ElementRef);
  private resizeHandler = () => this.setAppHeight();

  ngOnInit(): void {
    this.setAppHeight();
    window.addEventListener('resize', this.resizeHandler);
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
  }

  /**
   * On iOS PWA standalone, `100vh` / `100dvh` and `position:fixed bottom:0`
   * do NOT reach the physical screen bottom — they stop at the safe-area edge,
   * leaving a ~34px gap (home indicator zone).
   *
   * `window.screen.height` IS the true physical screen height (852px on iPhone
   * 16 Pro). In standalone mode we use it to force the layout to fill the
   * entire physical screen. On desktop / non-standalone we fall back to
   * `window.innerHeight`.
   */
  private setAppHeight(): void {
    const isStandalone =
      (navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) {
      // Force html element to physical screen height — this is the ONLY
      // way to make the flex chain reach the home-indicator zone on iOS PWA,
      // because 100vh/100dvh and position:fixed bottom:0 all stop at the
      // safe-area edge (~34px above the physical screen bottom).
      document.documentElement.style.height = window.screen.height + 'px';
    }
  }
}
