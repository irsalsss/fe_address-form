import { afterEach, describe, expect, it, vi } from "vitest";

import { ApiError, http } from "../http";

afterEach(() => {
  vi.restoreAllMocks();
});

function mockResponse(status: number, body: unknown) {
  vi.stubGlobal(
    "fetch",
    vi.fn(async () => ({
      ok: status >= 200 && status < 300,
      status,
      statusText: "",
      json: async () => body,
    })),
  );
}

describe("http error mapping (FR-017)", () => {
  it("maps problem+json details.fieldErrors to ApiError.fieldErrors with registry keys", async () => {
    mockResponse(400, {
      title: "BAD_REQUEST",
      detail: "validation failed",
      code: "BAD_REQUEST",
      details: {
        formErrors: [],
        fieldErrors: { zip: ["Invalid"], street: ["Required"] },
      },
    });

    const err = await http.post("/addresses", {}).catch((e) => e);

    expect(err).toBeInstanceOf(ApiError);
    expect(err.status).toBe(400);
    // detail is the human message, not the title/code
    expect(err.message).toBe("validation failed");
    expect(err.fieldErrors).toEqual([
      { field: "zip", message: "Invalid" },
      { field: "street", message: "Required" },
    ]);
  });

  it("carries formErrors for the form-level banner", async () => {
    mockResponse(400, {
      detail: "country not supported",
      details: { formErrors: ["UNSUPPORTED_COUNTRY"], fieldErrors: {} },
    });

    const err = await http.post("/addresses", {}).catch((e) => e);

    expect(err.formErrors).toEqual(["UNSUPPORTED_COUNTRY"]);
    expect(err.fieldErrors).toEqual([]);
  });

  it("falls back to a default message when a field error array is empty", async () => {
    mockResponse(400, {
      detail: "validation failed",
      details: { fieldErrors: { postalCode: [] } },
    });

    const err = await http.post("/addresses", {}).catch((e) => e);

    expect(err.fieldErrors).toEqual([{ field: "postalCode", message: "Invalid" }]);
  });
});
