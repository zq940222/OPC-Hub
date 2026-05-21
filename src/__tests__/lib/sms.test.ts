import { generateSmsCode, getTencentSmsSdkAppId, hasTencentSmsConfig, isValidPhone } from "@/lib/sms";

describe("SMS utilities", () => {
  const originalEnv = process.env;

  beforeEach(() => {
    process.env = { ...originalEnv };
    delete process.env.TENCENT_SECRET_ID;
    delete process.env.TENCENT_SECRET_KEY;
    delete process.env.TENCENT_SMS_SDK_APP_ID;
    delete process.env.TENCENT_SMS_SIGN_NAME;
    delete process.env.TENCENT_SMS_TEMPLATE_ID;
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  it("generates a 6-digit numeric code", () => {
    expect(generateSmsCode()).toMatch(/^\d{6}$/);
  });

  it("validates Chinese mobile numbers", () => {
    expect(isValidPhone("13800138000")).toBe(true);
    expect(isValidPhone("12345")).toBe(false);
    expect(isValidPhone("23800138000")).toBe(false);
  });

  it("uses the Tencent Cloud SMS business SDKAppID by default", () => {
    expect(getTencentSmsSdkAppId()).toBe("1401130610");
  });

  it("requires all Tencent Cloud SMS credentials before sending", () => {
    expect(hasTencentSmsConfig()).toBe(false);

    process.env.TENCENT_SECRET_ID = "secret-id";
    process.env.TENCENT_SECRET_KEY = "secret-key";
    process.env.TENCENT_SMS_SIGN_NAME = "OPC";
    process.env.TENCENT_SMS_TEMPLATE_ID = "123456";

    expect(hasTencentSmsConfig()).toBe(true);
  });
});
