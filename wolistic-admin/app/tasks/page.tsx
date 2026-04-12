import { TasksAdminPanel } from "./TasksAdminPanel";

export const metadata = {
  title: "Wolistic Tasks – Admin",
};

export default function TasksPage() {
  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <TasksAdminPanel />
    </main>
  );
}
