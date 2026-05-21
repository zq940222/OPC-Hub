"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { normalizeSkills, normalizeWebsite } from "@/lib/profile";
import { db } from "@/lib/db";

export type ProfileActionState = {
  success?: boolean;
  error?: string;
};

export async function updateProfile(_state: ProfileActionState, formData: FormData): Promise<ProfileActionState> {
  const session = await auth();
  if (!session?.user?.id) return { error: "login_required" };

  const bio = String(formData.get("bio") ?? "").trim();
  if (bio.length > 300) return { error: "bio_too_long" };

  const parsedWebsite = normalizeWebsite(String(formData.get("website") ?? ""));
  if ("error" in parsedWebsite) return { error: parsedWebsite.error };

  const skills = normalizeSkills(formData.getAll("skills"));
  const location = String(formData.get("location") ?? "").trim();
  const name = String(formData.get("name") ?? "").trim();
  const image = String(formData.get("image") ?? "").trim();

  await db.opcProfile.upsert({
    where: { userId: session.user.id },
    update: {
      bio: bio || null,
      skills,
      website: parsedWebsite.website,
      location: location || null,
    },
    create: {
      userId: session.user.id,
      bio: bio || null,
      skills,
      website: parsedWebsite.website,
      location: location || null,
    },
  });

  await db.user.update({
    where: { id: session.user.id },
    data: {
      ...(name ? { name } : {}),
      ...(image ? { image } : {}),
    },
  });

  revalidatePath(`/profile/${session.user.id}`);
  revalidatePath("/settings/profile");
  return { success: true };
}
