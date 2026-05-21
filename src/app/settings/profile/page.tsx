import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProfileForm } from "@/components/profile/ProfileForm";
import { db } from "@/lib/db";

export default async function SettingsProfilePage() {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const user = await db.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      image: true,
      opcProfile: {
        select: {
          bio: true,
          skills: true,
          website: true,
          location: true,
        },
      },
    },
  });

  if (!user) redirect("/login");

  return (
    <main className="shell grid gap-6 py-8 md:py-12">
      <section className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm md:p-8">
        <p className="text-sm font-semibold text-teal-700">Profile settings</p>
        <h1 className="mt-3 text-3xl font-semibold text-slate-950 md:text-5xl">Company profile</h1>
        <p className="mt-4 max-w-3xl text-base leading-8 text-slate-600">Use an avatar URL for v1. COS upload can be added after credentials and upload policy are available.</p>
      </section>
      <ProfileForm user={user} profile={user.opcProfile} />
    </main>
  );
}
