import { CoinAdminPanel } from "./CoinAdminPanel";

export const metadata = {
  title: "Coins – Wolistic Admin",
};

export default function CoinsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Coin Wallet Admin</h1>
        <p className="text-sm text-gray-500 mt-1">
          Look up any user's coin wallet by email, view transaction history, and apply manual
          adjustments.
        </p>
      </div>
      <CoinAdminPanel />
    </main>
  );
}
