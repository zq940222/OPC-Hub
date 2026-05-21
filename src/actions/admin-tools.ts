"use server";

import { revalidatePath } from "next/cache";
import { db } from "@/lib/db";
import { type AdminActionState, requireAdminPermission } from "@/actions/admin-shared";

function textValue(formData: FormData, key: string) {
  return String(formData.get(key) ?? "").trim();
}

function parseToolData(formData: FormData) {
  const name = textValue(formData, "name");
  const description = textValue(formData, "description");
  const category = textValue(formData, "category");
  const url = textValue(formData, "url");
  const iconUrl = textValue(formData, "iconUrl");
  const order = Number(textValue(formData, "order") || "0");
  const embedable = formData.get("embedable") === "on";
  const active = formData.get("active") !== "off";

  if (!name) return { error: "name_required" } as const;
  if (!description) return { error: "description_required" } as const;
  if (!category) return { error: "category_required" } as const;
  try {
    const parsedUrl = new URL(url);
    if (parsedUrl.protocol !== "http:" && parsedUrl.protocol !== "https:") {
      return { error: "invalid_url" } as const;
    }
  } catch {
    return { error: "invalid_url" } as const;
  }

  return {
    data: {
      name,
      description,
      category,
      url,
      iconUrl: iconUrl || null,
      order: Number.isNaN(order) ? 0 : order,
      embedable,
      active,
    },
  } as const;
}

function revalidateTools() {
  revalidatePath("/admin");
  revalidatePath("/tools");
}

export async function createTool(_state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const auth = await requireAdminPermission("tools");
  if ("error" in auth) return { error: auth.error };

  const parsed = parseToolData(formData);
  if ("error" in parsed) return { error: parsed.error };

  await db.tool.create({ data: parsed.data });
  revalidateTools();
  return { success: true };
}

export async function updateTool(toolId: string, _state: AdminActionState, formData: FormData): Promise<AdminActionState> {
  const auth = await requireAdminPermission("tools");
  if ("error" in auth) return { error: auth.error };

  const parsed = parseToolData(formData);
  if ("error" in parsed) return { error: parsed.error };

  await db.tool.update({
    where: { id: toolId },
    data: parsed.data,
  });
  revalidateTools();
  return { success: true };
}

export async function toggleToolActive(toolId: string): Promise<AdminActionState> {
  const auth = await requireAdminPermission("tools");
  if ("error" in auth) return { error: auth.error };

  const tool = await db.tool.findUnique({
    where: { id: toolId },
    select: { id: true, active: true },
  });
  if (!tool) return { error: "tool_not_found" };

  await db.tool.update({
    where: { id: toolId },
    data: { active: !tool.active },
  });
  revalidateTools();
  return { success: true };
}

export async function moveTool(toolId: string, direction: "up" | "down"): Promise<AdminActionState> {
  const auth = await requireAdminPermission("tools");
  if ("error" in auth) return { error: auth.error };

  const tool = await db.tool.findUnique({
    where: { id: toolId },
    select: { id: true, order: true },
  });
  if (!tool) return { error: "tool_not_found" };

  await db.tool.update({
    where: { id: toolId },
    data: { order: tool.order + (direction === "up" ? -1 : 1) },
  });
  revalidateTools();
  return { success: true };
}
