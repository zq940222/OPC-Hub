import { generateSmsCode, isValidPhone } from "@/lib/sms";

describe("SMS utilities", () => {
  it("generates a 6-digit numeric code", () => {
    expect(generateSmsCode()).toMatch(/^\d{6}$/);
  });

  it("validates Chinese mobile numbers", () => {
    expect(isValidPhone("13800138000")).toBe(true);
    expect(isValidPhone("12345")).toBe(false);
    expect(isValidPhone("23800138000")).toBe(false);
  });
});
