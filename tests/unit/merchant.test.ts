import { describe, expect, it } from "vitest";
import {
  getMerchantIdentity,
  getMerchantIdentityReadiness,
  isCommercialActivationReady,
} from "@/lib/merchant";

const completeEnvironment = {
  LEGAL_BUSINESS_NAME: "Stepwise Learning (Private) Limited",
  LEGAL_REGISTRATION_TYPE: "Private limited company",
  LEGAL_REGISTRATION_NUMBER: "0123456",
  LEGAL_TAX_NUMBER: "1234567-8",
  LEGAL_REGISTERED_ADDRESS: "Registered address, Pakistan",
  LEGAL_OPERATING_ADDRESS: "Operating address, Pakistan",
  SUPPORT_PHONE: "+92 300 0000000",
  NEXT_PUBLIC_SUPPORT_EMAIL: "care@stepwise.page",
  APPWRITE_API_KEY: "appwrite-key",
  APPWRITE_SMTP_CONFIGURED: "true",
  RESEND_API_KEY: "resend-key",
  SAFEPAY_API_KEY: "safepay-key",
  SAFEPAY_WEBHOOK_SECRET: "webhook-secret",
};

describe("merchant and commercial activation readiness", () => {
  it("normalizes public merchant contact details", () => {
    expect(getMerchantIdentity(completeEnvironment)).toMatchObject({
      legalBusinessName: "Stepwise Learning (Private) Limited",
      country: "Pakistan",
      supportEmail: "care@stepwise.page",
      billingEmail: "billing@stepwise.page",
    });
  });

  it("fails closed when required merchant identity is incomplete", () => {
    const result = getMerchantIdentityReadiness({
      LEGAL_BUSINESS_NAME: "Stepwise",
      NEXT_PUBLIC_SUPPORT_EMAIL: "support@stepwise.page",
    });
    expect(result.ready).toBe(false);
    expect(result.missingFields).toContain("registeredAddress");
    expect(result.missingFields).toContain("supportPhone");
  });

  it("requires both merchant identity and provider credentials for activation", () => {
    expect(isCommercialActivationReady(completeEnvironment).ready).toBe(true);
    const result = isCommercialActivationReady({
      ...completeEnvironment,
      RESEND_API_KEY: "",
      SAFEPAY_WEBHOOK_SECRET: "",
    });
    expect(result.ready).toBe(false);
    expect(result.missingServices).toEqual(["Resend API key", "Safepay webhook secret"]);
  });
});
