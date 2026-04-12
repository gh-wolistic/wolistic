import { SubscriptionAdminPanel } from "./SubscriptionAdminPanel";

export const metadata = {
  title: "Subscriptions – Wolistic Admin",
};

export default function SubscriptionsPage() {
  return (
    <main className="max-w-5xl mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-xl font-bold">Subscription Management</h1>
        <p className="text-sm text-gray-500 mt-1">
          Manage subscription plans (by expert type), assign plans to professionals, and log billing
          records.
        </p>
      </div>
      <SubscriptionAdminPanel />
    </main>
  );
}
