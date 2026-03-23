# Mobile UI Bugs Master Report — iOS PWA Full Audit
**Date:** March 23, 2026
**Device Simulation:** iPhone 13 · iOS PWA Standalone Mode
**Audit Scope:** Comprehensive Native-Fidelity Verification

This report serves as the definitive list of UI and behavioral regressions that prevent the Student Portal PWA from delivering a high-fidelity native application experience on iOS.

---

## 1. Top Safe Area Violation (Header Overlap) (**HIGH** 🔴)

**Issue:** Sticky headers and page content overlap with the system status bar (Time, Battery, Signal).
**Description:** On modern iPhones with a notch or Dynamic Island, the application's sticky headers remain fixed at the literal top of the viewport (`top: 0`). Because the app runs in `black-translucent` mode to achieve an edge-to-edge look, the system status bar is drawn directly over the header text and navigation buttons.
**Impacted Screens:** Mobility, Surveys, Issue Report, Ask Minister.

**Screenshots:**
- ![Mobility Header Overlap](dist/screenshots/bug-1-mobility-header-overlap.png)
- ![Questionnaire Header Overlap](dist/screenshots/bug-3-questionnaire-header-overlap.png)

---

## 2. Modal Z-Index Conflict & Clipping (**HIGH** 🔴)

**Issue:** Bottom-sheet modals render behind the fixed bottom navigation bar.
**Evidence:** Verified Z-Indexes — Modal: `50`, Bottom Nav: `100`.
**Description:** The primary bottom navigation bar is on a higher stacking layer than the application's modals. This results in the navigation bar covering the bottom section of all modals, effectively hiding "Save", "Delete", and "Confirm" buttons from the user.

**Screenshots:**
- ![Modal Z-Index Conflict](dist/screenshots/bug-2-repro-modal-zindex.png)
- ![Delete Modal Overlap](dist/screenshots/test-2-delete-modal-overlap.png)

---

## 3. iOS Auto-Zoom on Input Focus (**HIGH** 🔴)

**Issue:** The viewport automatically zooms in (approx. 115%) when an input or textarea is tapped.
**Evidence:** Input Font Size: `14px` (iOS threshold is `16px`).
**Description:** To prevent this "web-like" jumping behavior, iOS requires a minimum font size of 16px. The current 14px implementation triggers a zoom that doesn't reset after typing is finished, leaving the UI in a permanently enlarged and "broken" state.

**Screenshots:**
- ![Input Auto-Zoom](dist/screenshots/bug-3-input-auto-zoom.png)
- ![Textarea Focus Zoom](dist/screenshots/test-3-textarea-focus-zoom.png)

---

## 4. Dark Mode Flash of Unstyled Content (FOUC) (**CRITICAL** 🔴)

**Issue:** A bright white flash occurs on every cold launch when the system is in dark mode.
**Evidence:** Initial Background Color (pre-hydration): `rgb(255, 255, 255)`.
**Description:** Because the theme logic is tied to the Angular bootstrap process, the browser paints the default white background before the "dark" class is applied. This is a significant immersion breaker for PWA users.

**Screenshots:**
- ![Dark Mode Flash](dist/screenshots/gap-1-fouc-flash.png)

---

## 5. Software Keyboard Occlusion (**HIGH** 🔴)

**Issue:** The software keyboard obscures active inputs and modal buttons.
**Description:** The application layout uses a fixed height that does not respond to the `visualViewport` resizing when the keyboard opens. As a result, the 300px keyboard area overlays the application, hiding the fields the user is trying to type into.

**Screenshots:**
- ![Keyboard Occlusion](dist/screenshots/gap-3-keyboard-occlusion.png)

---

## 6. Bottom Safe Area / Home Indicator Overlap (**MEDIUM** 🔴)

**Issue:** Navigation items and buttons are flush with the bottom edge/home indicator.
**Description:** The application does not implement `env(safe-area-inset-bottom)` padding. On gesture-based iPhones, the home indicator overlaps with the bottom navigation items, leading to accidental "swipe-home" gestures when users try to navigate.

**Screenshots:**
- ![Home Indicator Overlap](dist/screenshots/bug-4-home-indicator-overlap.png)

---

## 7. Missing iOS Splash Screens (**HIGH** 🔴)

**Issue:** The app shows a generic blank screen during boot instead of a branded splash screen.
**Description:** The PWA is missing the `apple-touch-startup-image` meta tags required by iOS. This makes the launch sequence feel like a "saved bookmark" rather than a native application.

**Screenshots:**
- ![Missing Splash Tags](dist/screenshots/gap-2-splash-tags.png)

---

## 8. Long-Press Context Menu (Touch Callout) (**HIGH** 🔴)

**Issue:** Long-pressing images or links triggers the Safari context menu.
**Description:** Native apps suppress the browser context menu. Currently, users can long-press a profile photo or link to see "Open in New Tab" or "Save Image" options, which immediately reveals the underlying web technology.

**Screenshots:**
- ![Touch Callout](dist/screenshots/gap-4-long-press-callout.png)

---

## 9. Scroll Position Persistence Bug (**MEDIUM** 🔴)

**Issue:** Navigation between pages does not reset the scroll to the top.
**Description:** When moving from a scrolled view (like the Survey list) to another (like the Dashboard), the scroll position is preserved. This results in the user landing in the middle or bottom of the new page.

**Screenshots:**
- ![Scroll Persistence](dist/screenshots/gap-6-scroll-persistence.png)

---

## 10. Web-like Bouncy Scrolling (**MEDIUM** 🔴)

**Issue:** Scroll containers exhibit "rubber-band" bouncy behavior.
**Description:** The scroll containers do not feel "locked" or native because `overscroll-behavior` is not fully optimized for WebKit's specific PWA behaviors, allowing the whole app shell to occasionally bounce.

---

## 11. Navigation Label Font Size (**LOW** 🔴)

**Issue:** Bottom navigation labels are 10px, failing Apple HIG readability standards.
**Evidence:** Nav Label Size: `10px` (Minimum recommended: `11pt`).
**Description:** The labels feel cramped and are difficult to read for users with vision impairments or when using complex scripts like Georgian.

**Screenshots:**
- ![Small Nav Labels](dist/screenshots/gap-9-nav-label-small.png)

---

## 12. PWA Technical Gaps (Manifest & touch-action) (**LOW** 🔴)

**Issue:** Missing PWA manifest fields and interaction latency.
**Description:** The manifest lacks `screenshots` and `id` fields for high-quality installation prompts. Additionally, the absence of `touch-action: manipulation` on buttons can lead to subtle tap delays.

**Screenshots:**
- ![Manifest Evaluation](dist/screenshots/gap-10-manifest-verification.png)
- ![Touch Action Evaluation](dist/screenshots/gap-5-touch-action.png)
