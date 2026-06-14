import { AddressForm } from "./AddressForm";
import { LanguageSwitcher } from "./LanguageSwitcher";
import { SavedAddresses } from "./SavedAddresses";

/** Onboarding address route: capture form + saved-address review (US3). */
export function AddressPage() {
  return (
    <div className="mx-auto grid w-full max-w-xl gap-8">
      <div className="flex justify-end">
        <LanguageSwitcher />
      </div>
      <AddressForm />
      <SavedAddresses />
    </div>
  );
}
