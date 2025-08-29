import { registerAs } from "@nestjs/config";

export default registerAs("app", () => ({
  nodeEnv: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT || "3001", 10),
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "24h",
  logLevel: process.env.LOG_LEVEL || "info",
  defaultCurrency: process.env.DEFAULT_CURRENCY || "USD",
  defaultTimezone: process.env.DEFAULT_TIMEZONE || "UTC",
  throttle: {
    ttl: parseInt(process.env.THROTTLE_TTL || "60", 10),
    limit: parseInt(process.env.THROTTLE_LIMIT || "10", 10),
  },
}));
