import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { renderHook, waitFor } from "@testing-library/react";
import { createElement, type ReactNode } from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/shared/api/http", () => ({ http: { get: vi.fn() } }));

import { http } from "@/shared/api/http";
import { countryMetadataQueryKey, useCountryMetadata } from "../../api/useCountryMetadata";

function wrapper() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return ({ children }: { children: ReactNode }) =>
    createElement(QueryClientProvider, { client }, children);
}

describe("useCountryMetadata", () => {
  beforeEach(() => vi.mocked(http.get).mockReset());

  it("folds version into the query key so a bump invalidates the cache (FR-003)", () => {
    expect(countryMetadataQueryKey("USA", "v1")).not.toEqual(countryMetadataQueryKey("USA", "v2"));
    expect(countryMetadataQueryKey("USA", "v1")).toEqual(["country-metadata", "USA", "v1"]);
  });

  it("does not fetch when no country is selected", () => {
    renderHook(() => useCountryMetadata(null), { wrapper: wrapper() });
    expect(http.get).not.toHaveBeenCalled();
  });

  it("fetches a country's fields from GET /countries/:code/fields", async () => {
    const payload = { code: "USA", name: "United States", version: "v1", fields: [] };
    vi.mocked(http.get).mockResolvedValueOnce(payload);

    const { result } = renderHook(() => useCountryMetadata("USA", "v1"), { wrapper: wrapper() });

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(http.get).toHaveBeenCalledWith("/countries/USA/fields");
    expect(result.current.data).toEqual(payload);
  });
});
