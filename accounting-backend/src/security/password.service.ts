import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import * as bcrypt from "bcrypt";
import { SecurityConfig } from "../config/security.config";

@Injectable()
export class PasswordService {
  private readonly saltRounds: number;

  constructor(private configService: ConfigService) {
    const securityConfig = this.configService.get<SecurityConfig>("security");
    this.saltRounds = securityConfig?.bcryptRounds || 12;
  }

  /**
   * Hash a password using bcrypt
   * @param password - Plain text password
   * @returns Promise<string> - Hashed password
   */
  async hashPassword(password: string): Promise<string> {
    try {
      return await bcrypt.hash(password, this.saltRounds);
    } catch (error) {
      throw new Error(
        `Password hashing failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Compare a plain text password with a hashed password
   * @param password - Plain text password
   * @param hashedPassword - Hashed password from database
   * @returns Promise<boolean> - True if passwords match
   */
  async comparePassword(
    password: string,
    hashedPassword: string,
  ): Promise<boolean> {
    try {
      return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
      throw new Error(
        `Password comparison failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Generate a random salt
   * @param rounds - Number of salt rounds (optional, uses default if not provided)
   * @returns Promise<string> - Generated salt
   */
  async generateSalt(rounds?: number): Promise<string> {
    try {
      return await bcrypt.genSalt(rounds || this.saltRounds);
    } catch (error) {
      throw new Error(
        `Salt generation failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Hash a password with a specific salt
   * @param password - Plain text password
   * @param salt - Salt to use for hashing
   * @returns Promise<string> - Hashed password
   */
  async hashPasswordWithSalt(password: string, salt: string): Promise<string> {
    try {
      return await bcrypt.hash(password, salt);
    } catch (error) {
      throw new Error(
        `Password hashing with salt failed: ${error instanceof Error ? error.message : "Unknown error"}`,
      );
    }
  }

  /**
   * Validate password strength
   * @param password - Password to validate
   * @returns Object with validation result and requirements
   */
  validatePasswordStrength(password: string): {
    isValid: boolean;
    requirements: {
      minLength: boolean;
      hasUppercase: boolean;
      hasLowercase: boolean;
      hasNumbers: boolean;
      hasSpecialChars: boolean;
    };
    score: number; // 0-5 strength score
  } {
    const requirements = {
      minLength: password.length >= 8,
      hasUppercase: /[A-Z]/.test(password),
      hasLowercase: /[a-z]/.test(password),
      hasNumbers: /\d/.test(password),
      hasSpecialChars: /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>?]/.test(password),
    };

    const score = Object.values(requirements).filter(Boolean).length;
    const isValid = score >= 4 && requirements.minLength;

    return {
      isValid,
      requirements,
      score,
    };
  }

  /**
   * Generate a secure random password
   * @param length - Length of the password (default: 16)
   * @param includeSymbols - Whether to include special characters (default: true)
   * @returns string - Generated password
   */
  generateSecurePassword(
    length: number = 16,
    includeSymbols: boolean = true,
  ): string {
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const numbers = "0123456789";
    const symbols = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    let chars = lowercase + uppercase + numbers;
    if (includeSymbols) {
      chars += symbols;
    }

    let password = "";

    // Ensure at least one character from each required set
    password += lowercase[Math.floor(Math.random() * lowercase.length)];
    password += uppercase[Math.floor(Math.random() * uppercase.length)];
    password += numbers[Math.floor(Math.random() * numbers.length)];

    if (includeSymbols) {
      password += symbols[Math.floor(Math.random() * symbols.length)];
    }

    // Fill the rest randomly
    for (let i = password.length; i < length; i++) {
      password += chars[Math.floor(Math.random() * chars.length)];
    }

    // Shuffle the password
    return password
      .split("")
      .sort(() => Math.random() - 0.5)
      .join("");
  }
}
