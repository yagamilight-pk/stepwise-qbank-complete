import "server-only";

export const MERCHANT_IDENTITY_FIELDS = {
  legalBusinessName: "legal business name",
  registrationType: "business registration type",
  registrationNumber: "business registration number",
  taxNumber: "NTN or tax registration number",
  registeredAddress: "registered business address",
  operatingAddress: "operating business address",
  supportPhone: "customer-support phone number",
} as const;

export type MerchantIdentityField = keyof typeof MERCHANT_IDENTITY_FIELDS;

type Environment = Record<string, string | undefined>;

const value = (environment: Environment, key: string) => environment[key]?.trim() || "";

export function getMerchantIdentity(environment: Environment = process.env) {
  return {
    legalBusinessName: value(environment, "LEGAL_BUSINESS_NAME"),
    registrationType: value(environment, "LEGAL_REGISTRATION_TYPE"),
    registrationNumber: value(environment, "LEGAL_REGISTRATION_NUMBER"),
    taxNumber: value(environment, "LEGAL_TAX_NUMBER"),
    registeredAddress: value(environment, "LEGAL_REGISTERED_ADDRESS"),
    operatingAddress: value(environment, "LEGAL_OPERATING_ADDRESS"),
    supportPhone: value(environment, "SUPPORT_PHONE"),
    supportEmail: value(environment, "NEXT_PUBLIC_SUPPORT_EMAIL") || "support@stepwise.page",
    billingEmail: value(environment, "BILLING_EMAIL") || "billing@stepwise.page",
    legalEmail: value(environment, "LEGAL_EMAIL") || "legal@stepwise.page",
    country: "Pakistan",
  };
}

export function getMerchantIdentityReadiness(environment: Environment = process.env) {
  const identity = getMerchantIdentity(environment);
  const missingFields = (Object.keys(MERCHANT_IDENTITY_FIELDS) as MerchantIdentityField[])
    .filter((field) => !identity[field]);
  return {
    ready: missingFields.length === 0,
    missingFields,
    missingLabels: missingFields.map((field) => MERCHANT_IDENTITY_FIELDS[field]),
    identity,
  };
}

export function isCommercialActivationReady(environment: Environment = process.env) {
  const merchant = getMerchantIdentityReadiness(environment);
  const missingServices = [
    !value(environment, "APPWRITE_API_KEY") && "Appwrite server key",
    value(environment, "APPWRITE_SMTP_CONFIGURED") !== "true" && "Appwrite custom SMTP",
    !value(environment, "RESEND_API_KEY") && "Resend API key",
    !value(environment, "SAFEPAY_API_KEY") && "Safepay API key",
    !value(environment, "SAFEPAY_WEBHOOK_SECRET") && "Safepay webhook secret",
  ].filter((entry): entry is string => Boolean(entry));

  return {
    ready: merchant.ready && missingServices.length === 0,
    merchant,
    missingServices,
  };
}
