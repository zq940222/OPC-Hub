import { redirect } from "next/navigation";
import { AdminLoginForm } from "@/components/auth/AdminLoginForm";
import { getAdminSession } from "@/lib/admin-session";

export default async function AdminLoginPage() {
  const session = await getAdminSession();
  if (session) redirect("/admin");

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8">
      <AdminLoginForm />
    </main>
  );
}
