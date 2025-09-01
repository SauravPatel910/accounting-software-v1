import { registerAs } from "@nestjs/config";
import * as Joi from "joi";

export default registerAs("jwt", (): JwtConfig => {
  const values = {
    secret: process.env.JWT_SECRET,
    expirationTime: process.env.JWT_EXPIRATION_TIME || "7d",
    refreshSecret: process.env.JWT_REFRESH_SECRET,
    refreshExpirationTime: process.env.JWT_REFRESH_EXPIRATION_TIME || "30d",
    issuer: "accounting-software",
    audience: "accounting-users",
  };

  // Validation schema
  const schema = Joi.object({
    secret: Joi.string().min(32).required(),
    expirationTime: Joi.string().required(),
    refreshSecret: Joi.string().min(32).required(),
    refreshExpirationTime: Joi.string().required(),
    issuer: Joi.string().default("accounting-software"),
    audience: Joi.string().default("accounting-users"),
  });

  const { error, value } = schema.validate(values) as {
    error?: Joi.ValidationError;
    value: JwtConfig;
  };

  if (error) {
    throw new Error(`JWT Configuration validation error: ${error.message}`);
  }

  return value;
});

export interface JwtConfig {
  secret: string;
  expirationTime: string;
  refreshSecret: string;
  refreshExpirationTime: string;
  issuer: string;
  audience: string;
}
