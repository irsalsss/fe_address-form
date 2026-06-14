import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api/http", () => ({ http: { get: vi.fn() } }));

import { http } from "@/shared/api/http";
import { countriesQueryKey, useCountries } from "../../api/useCountries";

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

describe("useCountries", () => {
  beforeEach(() => vi.mocked(http.get).mockReset());

  it("uses a stable query key", () => {
    expect(countriesQueryKey).toEqual(["countries"]);
  });

  it("fetches the country list from GET /countries", async () => {
    const list = [
      { code: "USA", name: "United States", version: "v1" },
      { code: "AUS", name: "Australia", version: "v1" },
    ];
    vi.mocked(http.get).mockResolvedValueOnce(list);

    const { result } = renderHook(() => useCountries(), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(http.get).toHaveBeenCalledWith("/countries");
    expect(result.current.data).toEqual(list);
  });
});
