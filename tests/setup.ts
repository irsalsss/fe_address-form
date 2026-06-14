import "@testing-library/jest-dom/vitest";
import { vi } from "vitest";

/**
 * jsdom lacks the pointer-capture / scroll APIs that Radix UI (shadcn Select)
 * relies on to open its listbox. Stub them so dropdown interactions work in
 * component tests.
 */
if (!Element.prototype.hasPointerCapture) {
  Element.prototype.hasPointerCapture = vi.fn(() => false);
}
if (!Element.prototype.releasePointerCapture) {
  Element.prototype.releasePointerCapture = vi.fn();
}
if (!Element.prototype.scrollIntoView) {
  Element.prototype.scrollIntoView = vi.fn();
}
