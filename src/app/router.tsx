import { lazy, Suspense } from "react";
import { createBrowserRouter } from "react-router-dom";

const AddressPage = lazy(() =>
  import("@/features/address-form").then((m) => ({ default: m.AddressPage })),
);

export const router = createBrowserRouter([
  {
    path: "/",
    element: <h1>FrankieOne · Address Onboarding — scaffold ready</h1>,
  },
  {
    path: "/onboarding/address",
    element: (
      <Suspense fallback={<p>Loading…</p>}>
        <main className="bg-background min-h-dvh p-6">
          <AddressPage />
        </main>
      </Suspense>
    ),
  },
]);
