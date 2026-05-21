import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { generateSmsCode, isValidPhone } from "@/lib/sms";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const { phone } = (await req.json()) as { phone?: string };

  if (!phone || !isValidPhone(phone)) {
    return NextResponse.json({ error: "请输入有效手机号" }, { status: 400 });
  }

  const code = generateSmsCode();
  await db.smsCode.create({
    data: {
      phone,
      code,
      expiresAt: new Date(Date.now() + 5 * 60 * 1000),
    },
  });

  return NextResponse.json({
    success: true,
    devCode: code,
  });
}
