import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import "@/shared/i18n";
import { SavedAddresses } from "../components/SavedAddresses";

vi.mock("../api/useAddresses", () => ({
  useAddresses: () => ({
    isLoading: false,
    data: {
      addresses: [
        {
          id: "1",
          country: "USA",
          fields: {
            line1: "1600 Amphitheatre Pkwy",
            city: "Mountain View",
            state: "CA",
            zip: "94043",
          },
          createdAt: "2026-06-14T00:00:00.000Z",
        },
        {
          id: "2",
          country: "IDN",
          fields: {
            province: "Bali",
            city: "Denpasar",
            district: "Denpasar Selatan",
            postalCode: "80221",
            street: "Jl. Danau Tamblingan",
          },
          createdAt: "2026-06-14T00:00:00.000Z",
        },
      ],
    },
  }),
}));

describe("SavedAddresses (US3)", () => {
  it("renders each saved address with its own country field set", () => {
    render(<SavedAddresses />);

    // Country headers
    expect(screen.getByText("United States")).toBeInTheDocument();
    expect(screen.getByText("Indonesia")).toBeInTheDocument();

    // USA-specific values + label
    expect(screen.getByText("94043")).toBeInTheDocument();
    expect(screen.getByText("ZIP Code")).toBeInTheDocument();

    // IDN-specific values + label (no mismatched/dropped fields)
    expect(screen.getByText("Bali")).toBeInTheDocument();
    expect(screen.getByText("Street Address")).toBeInTheDocument();
    expect(screen.getByText("District (Kecamatan)")).toBeInTheDocument();
  });
});
