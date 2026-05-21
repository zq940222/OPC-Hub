import { PROFILE_SKILL_LIMIT } from "@/lib/constants";

export function normalizeSkills(values: FormDataEntryValue[]) {
  const skills = values.flatMap((value) =>
    String(value)
      .split(",")
      .map((skill) => skill.trim())
      .filter(Boolean),
  );

  return Array.from(new Set(skills)).slice(0, PROFILE_SKILL_LIMIT);
}

export function normalizeWebsite(value: string) {
  const website = value.trim();
  if (!website) return { website: null };

  try {
    const url = new URL(website);
    if (url.protocol !== "http:" && url.protocol !== "https:") {
      return { error: "invalid_website" };
    }
    return { website: url.toString() };
  } catch {
    return { error: "invalid_website" };
  }
}
