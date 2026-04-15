import { redirect } from "next/navigation";

export default function RootPage() {
  // Redirect to login page - dashboard will handle redirect if already authenticated
  redirect("/login");
}
