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
  private vpResizeHandler = () => this.setAppHeight();

  ngOnInit(): void {
    this.setAppHeight();
    window.addEventListener('resize', this.resizeHandler);
    // Bug 5: also respond to visualViewport resize so the software keyboard
    // shrinks the layout instead of hiding inputs underneath it.
    if (window.visualViewport) {
      window.visualViewport.addEventListener('resize', this.vpResizeHandler);
    }
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeHandler);
    if (window.visualViewport) {
      window.visualViewport.removeEventListener('resize', this.vpResizeHandler);
    }
  }

  /**
   * On iOS PWA standalone, `100vh` / `100dvh` and `position:fixed bottom:0`
   * do NOT reach the physical screen bottom — they stop at the safe-area edge,
   * leaving a ~34px gap (home indicator zone).
   *
   * When no keyboard is open, visualViewport.height ≈ screen.height so the
   * nav still reaches the physical bottom. When the software keyboard opens,
   * visualViewport.height shrinks automatically, keeping focused inputs visible
   * above the keyboard (Bug 5 fix).
   */
  private setAppHeight(): void {
    const isStandalone =
      (navigator as any).standalone === true ||
      window.matchMedia('(display-mode: standalone)').matches;

    if (isStandalone) {
      // Prefer visualViewport.height: keyboard-aware on iOS 13+.
      // Fall back to screen.height on older browsers.
      const h = window.visualViewport
        ? window.visualViewport.height
        : window.screen.height;
      document.documentElement.style.height = h + 'px';
    }
  }
}
