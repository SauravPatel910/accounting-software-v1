import { Injectable } from "@nestjs/common";
import { AppConfigService } from "../../app-config.service";

// Simple decimal service using JavaScript's built-in precision handling
// For production use, consider integrating a proper decimal library
@Injectable()
export class DecimalService {
  private readonly defaultPrecision: number;
  private readonly defaultCurrency: string;

  constructor(private configService: AppConfigService) {
    this.defaultPrecision = this.configService.business.decimalPrecision;
    this.defaultCurrency = this.configService.business.defaultCurrency;
  }

  /**
   * Add two decimal values with precision handling
   */
  add(a: string | number, b: string | number): number {
    const numA = typeof a === "string" ? parseFloat(a) : a;
    const numB = typeof b === "string" ? parseFloat(b) : b;
    return this.round(numA + numB);
  }

  /**
   * Subtract two decimal values
   */
  subtract(a: string | number, b: string | number): number {
    const numA = typeof a === "string" ? parseFloat(a) : a;
    const numB = typeof b === "string" ? parseFloat(b) : b;
    return this.round(numA - numB);
  }

  /**
   * Multiply two decimal values
   */
  multiply(a: string | number, b: string | number): number {
    const numA = typeof a === "string" ? parseFloat(a) : a;
    const numB = typeof b === "string" ? parseFloat(b) : b;
    return this.round(numA * numB);
  }

  /**
   * Divide two decimal values
   */
  divide(a: string | number, b: string | number): number {
    const numA = typeof a === "string" ? parseFloat(a) : a;
    const numB = typeof b === "string" ? parseFloat(b) : b;
    if (numB === 0) {
      throw new Error("Division by zero");
    }
    return this.round(numA / numB);
  }

  /**
   * Round a decimal value to the specified precision
   */
  round(value: string | number, precision?: number): number {
    const num = typeof value === "string" ? parseFloat(value) : value;
    const dp = precision ?? this.defaultPrecision;
    return Math.round(num * Math.pow(10, dp)) / Math.pow(10, dp);
  }

  /**
   * Format a decimal value for display
   */
  format(
    value: string | number,
    options?: {
      precision?: number;
      currency?: string;
      locale?: string;
      includeCurrency?: boolean;
    },
  ): string {
    const precision = options?.precision ?? this.defaultPrecision;
    const currency = options?.currency ?? this.defaultCurrency;
    const locale = options?.locale ?? "en-US";
    const includeCurrency = options?.includeCurrency ?? false;

    const rounded = this.round(value, precision);

    if (includeCurrency) {
      return new Intl.NumberFormat(locale, {
        style: "currency",
        currency: currency,
        minimumFractionDigits: precision,
        maximumFractionDigits: precision,
      }).format(rounded);
    }

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: precision,
      maximumFractionDigits: precision,
    }).format(rounded);
  }

  /**
   * Parse a string value to number
   */
  parse(value: string): number {
    const cleaned = value.replace(/[^\d.-]/g, "");
    return parseFloat(cleaned);
  }

  /**
   * Check if a value is zero
   */
  isZero(value: string | number): boolean {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return Math.abs(num) < Math.pow(10, -this.defaultPrecision);
  }

  /**
   * Check if a value is positive
   */
  isPositive(value: string | number): boolean {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num > 0;
  }

  /**
   * Check if a value is negative
   */
  isNegative(value: string | number): boolean {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num < 0;
  }

  /**
   * Get absolute value
   */
  abs(value: string | number): number {
    const num = typeof value === "string" ? parseFloat(value) : value;
    return Math.abs(num);
  }

  /**
   * Compare two decimal values
   * Returns: -1 if a < b, 0 if a === b, 1 if a > b
   */
  compare(a: string | number, b: string | number): number {
    const numA = typeof a === "string" ? parseFloat(a) : a;
    const numB = typeof b === "string" ? parseFloat(b) : b;
    const diff = numA - numB;
    const epsilon = Math.pow(10, -this.defaultPrecision);

    if (Math.abs(diff) < epsilon) return 0;
    return diff > 0 ? 1 : -1;
  }

  /**
   * Check if two decimal values are equal
   */
  equals(a: string | number, b: string | number): boolean {
    return this.compare(a, b) === 0;
  }

  /**
   * Calculate percentage
   */
  percentage(value: string | number, percent: string | number): number {
    return this.divide(this.multiply(value, percent), 100);
  }

  /**
   * Apply discount
   */
  applyDiscount(
    value: string | number,
    discount: string | number,
    isPercentage = true,
  ): number {
    if (isPercentage) {
      const discountAmount = this.percentage(value, discount);
      return this.subtract(value, discountAmount);
    }
    return this.subtract(value, discount);
  }

  /**
   * Calculate tax amount
   */
  calculateTax(
    value: string | number,
    taxRate: string | number,
    isInclusive = false,
  ): number {
    if (isInclusive) {
      // Tax = Value * (rate / (100 + rate))
      return this.divide(this.multiply(value, taxRate), this.add(100, taxRate));
    }
    // Tax = Value * (rate / 100)
    return this.percentage(value, taxRate);
  }

  /**
   * Sum an array of decimal values
   */
  sum(values: (string | number)[]): number {
    let total = 0;
    for (const value of values) {
      total = this.add(total, value);
    }
    return total;
  }

  /**
   * Average of an array of decimal values
   */
  average(values: (string | number)[]): number {
    if (values.length === 0) {
      return 0;
    }
    return this.divide(this.sum(values), values.length);
  }

  /**
   * Convert to string with precision
   */
  toString(value: string | number, precision?: number): string {
    const dp = precision ?? this.defaultPrecision;
    const num = typeof value === "string" ? parseFloat(value) : value;
    return num.toFixed(dp);
  }

  /**
   * Convert to number
   */
  toNumber(value: string | number): number {
    return typeof value === "string" ? parseFloat(value) : value;
  }

  /**
   * Validate if a string can be converted to a valid decimal
   */
  isValidDecimal(value: string): boolean {
    const cleaned = value.replace(/[^\d.-]/g, "");
    const num = parseFloat(cleaned);
    return !isNaN(num) && isFinite(num);
  }

  /**
   * Round to nearest currency unit (for cash transactions)
   */
  roundToCurrency(value: string | number, currency?: string): number {
    const curr = currency ?? this.defaultCurrency;

    const roundingRules: Record<string, number> = {
      JPY: 0,
      KRW: 0,
      INR: 2,
      USD: 2,
      EUR: 2,
      GBP: 2,
    };

    const precision = roundingRules[curr] ?? 2;
    return this.round(value, precision);
  }
}
