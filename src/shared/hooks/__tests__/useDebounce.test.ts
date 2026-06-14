import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { useDebounce } from "../useDebounce";

describe("useDebounce", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("returns the initial value immediately", () => {
    const { result } = renderHook(() => useDebounce("a", 300));
    expect(result.current).toBe("a");
  });

  it("updates only after the delay elapses", () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: "a" },
    });

    rerender({ v: "b" });
    expect(result.current).toBe("a"); // not yet

    act(() => vi.advanceTimersByTime(299));
    expect(result.current).toBe("a"); // still not

    act(() => vi.advanceTimersByTime(1));
    expect(result.current).toBe("b"); // now
  });

  it("collapses a rapid burst to the final value", () => {
    const { result, rerender } = renderHook(({ v }) => useDebounce(v, 300), {
      initialProps: { v: "a" },
    });

    rerender({ v: "ab" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ v: "abc" });
    act(() => vi.advanceTimersByTime(100));
    rerender({ v: "abcd" });

    // No 300ms-quiet window passed yet — still the original.
    expect(result.current).toBe("a");

    act(() => vi.advanceTimersByTime(300));
    expect(result.current).toBe("abcd");
  });
});
