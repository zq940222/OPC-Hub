"use client";

import { useActionState, useState } from "react";
import { updateProfile, type ProfileActionState } from "@/actions/profile";
import { formatActionError } from "@/lib/action-errors";
import { PROFILE_SKILL_LIMIT } from "@/lib/constants";

type ProfileFormProps = {
  user: { name: string | null; image: string | null };
  profile: { bio: string | null; skills: string[]; website: string | null; location: string | null } | null;
};

export function ProfileForm({ user, profile }: ProfileFormProps) {
  const [state, formAction, pending] = useActionState<ProfileActionState, FormData>(updateProfile, {});
  const [customSkill, setCustomSkill] = useState("");
  const [skills, setSkills] = useState(profile?.skills ?? []);

  function addSkill() {
    const skill = customSkill.trim();
    if (!skill || skills.includes(skill) || skills.length >= PROFILE_SKILL_LIMIT) return;
    setSkills([...skills, skill]);
    setCustomSkill("");
  }

  return (
    <form action={formAction} className="grid gap-5 rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
      {state.error ? <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">{formatActionError(state.error)}</p> : null}
      {state.success ? <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">资料已保存。</p> : null}
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        显示名称
        <input name="name" defaultValue={user.name ?? ""} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        头像 URL
        <input name="image" defaultValue={user.image ?? ""} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <label className="grid gap-2 text-sm font-medium text-slate-700">
        简介
        <textarea name="bio" maxLength={300} rows={5} defaultValue={profile?.bio ?? ""} className="focus-ring resize-y rounded-md border border-slate-300 px-3 py-2" />
      </label>
      <div className="grid gap-2 text-sm font-medium text-slate-700">
        技能
        <div className="flex gap-2">
          <input value={customSkill} onChange={(event) => setCustomSkill(event.target.value)} className="focus-ring min-w-0 flex-1 rounded-md border border-slate-300 px-3 py-2" />
          <button type="button" onClick={addSkill} className="focus-ring rounded-md border border-slate-300 px-3 py-2 font-semibold text-slate-700 hover:bg-slate-50">
            添加
          </button>
        </div>
        <div className="flex flex-wrap gap-2">
          {skills.map((skill) => (
            <label key={skill} className="inline-flex items-center gap-2 rounded-full bg-slate-100 px-3 py-2 text-xs font-medium text-slate-700">
              <input type="hidden" name="skills" value={skill} />
              {skill}
              <button type="button" onClick={() => setSkills(skills.filter((item) => item !== skill))} className="text-slate-500 hover:text-red-700">
                x
              </button>
            </label>
          ))}
        </div>
      </div>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          省份 / 城市
          <input name="location" defaultValue={profile?.location ?? ""} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
        </label>
        <label className="grid gap-2 text-sm font-medium text-slate-700">
          网站
          <input name="website" type="url" defaultValue={profile?.website ?? ""} className="focus-ring rounded-md border border-slate-300 px-3 py-2" />
        </label>
      </div>
      <button disabled={pending} className="focus-ring rounded-md bg-blue-700 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-800 disabled:opacity-60">
        {pending ? "保存中..." : "保存资料"}
      </button>
    </form>
  );
}
