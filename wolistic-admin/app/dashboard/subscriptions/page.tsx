import { SubscriptionAdminPanel } from "./SubscriptionAdminPanel";

export const metadata = {
  title: "Subscriptions – Wolistic Admin",
};

export default function SubscriptionsPage() {
  return (
    <main className="max-w-6xl mx-auto px-6 py-8">
      <div className="mb-8 pb-6 border-b border-slate-700">
        <h1 className="text-3xl font-bold text-white">Subscription Management</h1>
        <p className="text-base text-gray-400 mt-2">
          Manage subscription plans (by expert type), assign plans to professionals, and log billing records.
        </p>
      </div>
      <SubscriptionAdminPanel />
    </main>
  );
}
