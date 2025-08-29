import { registerAs } from "@nestjs/config";
import * as Joi from "joi";

export default registerAs("business", (): BusinessConfig => {
  const values = {
    defaultCurrency: process.env.DEFAULT_CURRENCY || "INR",
    decimalPrecision: parseInt(process.env.DECIMAL_PRECISION || "2", 10),
    fiscalYearStartMonth: parseInt(
      process.env.FISCAL_YEAR_START_MONTH || "1",
      10,
    ),
    supportedCurrencies: [
      "USD",
      "EUR",
      "GBP",
      "JPY",
      "CAD",
      "AUD",
      "CHF",
      "CNY",
      "INR",
    ],
    taxSettings: {
      defaultTaxRate: 0,
      enableMultipleTaxRates: true,
      taxInclusivePricing: false,
    },
    invoiceSettings: {
      defaultPaymentTerms: 30,
      autoGenerateNumbers: true,
      numberPrefix: "INV-",
      numberPadding: 6,
    },
  };

  // Validation schema
  const schema = Joi.object({
    defaultCurrency: Joi.string().length(3).uppercase().default("INR"),
    decimalPrecision: Joi.number().min(0).max(8).default(2),
    fiscalYearStartMonth: Joi.number().min(1).max(12).default(1),
    supportedCurrencies: Joi.array()
      .items(Joi.string().length(3).uppercase())
      .default(["USD", "EUR", "GBP", "JPY", "CAD", "AUD", "CHF", "CNY", "INR"]),
    taxSettings: Joi.object({
      defaultTaxRate: Joi.number().min(0).max(1).default(0),
      enableMultipleTaxRates: Joi.boolean().default(true),
      taxInclusivePricing: Joi.boolean().default(false),
    }).default({
      defaultTaxRate: 0,
      enableMultipleTaxRates: true,
      taxInclusivePricing: false,
    }),
    invoiceSettings: Joi.object({
      defaultPaymentTerms: Joi.number().min(0).default(30),
      autoGenerateNumbers: Joi.boolean().default(true),
      numberPrefix: Joi.string().default("INV-"),
      numberPadding: Joi.number().min(1).max(10).default(6),
    }).default({
      defaultPaymentTerms: 30,
      autoGenerateNumbers: true,
      numberPrefix: "INV-",
      numberPadding: 6,
    }),
  });

  const { error, value } = schema.validate(values) as {
    error?: Joi.ValidationError;
    value: BusinessConfig;
  };

  if (error) {
    throw new Error(
      `Business Configuration validation error: ${error.message}`,
    );
  }

  return value;
});

export interface BusinessConfig {
  defaultCurrency: string;
  decimalPrecision: number;
  fiscalYearStartMonth: number;
  supportedCurrencies: string[];
  taxSettings: {
    defaultTaxRate: number;
    enableMultipleTaxRates: boolean;
    taxInclusivePricing: boolean;
  };
  invoiceSettings: {
    defaultPaymentTerms: number;
    autoGenerateNumbers: boolean;
    numberPrefix: string;
    numberPadding: number;
  };
}
