import { registerAs } from "@nestjs/config";
import * as Joi from "joi";

export default registerAs("email", (): EmailConfig => {
  const values = {
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "587", 10),
    secure: process.env.SMTP_SECURE === "true",
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
    from: process.env.SMTP_USER || "noreply@accounting-software.com",
    enabled: Boolean(
      process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS,
    ),
  };

  // Validation schema
  const schema = Joi.object({
    host: Joi.string().when("enabled", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    port: Joi.number().port().default(587),
    secure: Joi.boolean().default(false),
    user: Joi.string().when("enabled", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    pass: Joi.string().when("enabled", {
      is: true,
      then: Joi.required(),
      otherwise: Joi.optional(),
    }),
    from: Joi.string().email().default("noreply@accounting-software.com"),
    enabled: Joi.boolean().default(false),
  });

  const { error, value } = schema.validate(values) as {
    error?: Joi.ValidationError;
    value: EmailConfig;
  };

  if (error) {
    throw new Error(`Email Configuration validation error: ${error.message}`);
  }

  return value;
});

export interface EmailConfig {
  host?: string;
  port: number;
  secure: boolean;
  user?: string;
  pass?: string;
  from: string;
  enabled: boolean;
}
