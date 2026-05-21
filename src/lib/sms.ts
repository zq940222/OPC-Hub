import * as tencentcloud from "tencentcloud-sdk-nodejs";

const DEFAULT_TENCENT_SMS_SDK_APP_ID = "1401130610";

export function generateSmsCode(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export function isValidPhone(phone: string): boolean {
  return /^1[3-9]\d{9}$/.test(phone);
}

export function getTencentSmsSdkAppId(): string {
  return process.env.TENCENT_SMS_SDK_APP_ID?.trim() || DEFAULT_TENCENT_SMS_SDK_APP_ID;
}

export function hasTencentSmsConfig(): boolean {
  return Boolean(
    process.env.TENCENT_SECRET_ID?.trim() &&
      process.env.TENCENT_SECRET_KEY?.trim() &&
      getTencentSmsSdkAppId() &&
      process.env.TENCENT_SMS_SIGN_NAME?.trim() &&
      process.env.TENCENT_SMS_TEMPLATE_ID?.trim(),
  );
}

function requireTencentSmsConfig() {
  const config = {
    secretId: process.env.TENCENT_SECRET_ID?.trim(),
    secretKey: process.env.TENCENT_SECRET_KEY?.trim(),
    smsSdkAppId: getTencentSmsSdkAppId(),
    signName: process.env.TENCENT_SMS_SIGN_NAME?.trim(),
    templateId: process.env.TENCENT_SMS_TEMPLATE_ID?.trim(),
  };

  const missing = Object.entries(config)
    .filter(([, value]) => !value)
    .map(([key]) => key);

  if (missing.length > 0) {
    throw new Error(`Missing Tencent Cloud SMS config: ${missing.join(", ")}`);
  }

  return config as Record<keyof typeof config, string>;
}

export async function sendSmsCode(phone: string, code: string): Promise<void> {
  const config = requireTencentSmsConfig();
  const SmsClient = tencentcloud.sms.v20210111.Client;
  const client = new SmsClient({
    credential: {
      secretId: config.secretId,
      secretKey: config.secretKey,
    },
    region: "ap-guangzhou",
  });

  await client.SendSms({
    PhoneNumberSet: [`+86${phone}`],
    SmsSdkAppId: config.smsSdkAppId,
    SignName: config.signName,
    TemplateId: config.templateId,
    TemplateParamSet: [code],
  });
}
