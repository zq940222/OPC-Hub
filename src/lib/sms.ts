import * as tencentcloud from "tencentcloud-sdk-nodejs";

export function generateSmsCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

export async function sendSmsCode(phone: string, code: string): Promise<void> {
  const SmsClient = tencentcloud.sms.v20210111.Client;
  const client = new SmsClient({
    credential: {
      secretId: process.env.TENCENT_SECRET_ID ?? "",
      secretKey: process.env.TENCENT_SECRET_KEY ?? "",
    },
    region: "ap-guangzhou",
  });

  await client.SendSms({
    PhoneNumberSet: [`+86${phone}`],
    SmsSdkAppId: process.env.TENCENT_SMS_SDK_APP_ID ?? "",
    SignName: process.env.TENCENT_SMS_SIGN_NAME ?? "",
    TemplateId: process.env.TENCENT_SMS_TEMPLATE_ID ?? "",
    TemplateParamSet: [code],
  });
}
