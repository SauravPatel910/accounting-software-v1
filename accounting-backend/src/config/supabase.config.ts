import { registerAs } from "@nestjs/config";
import * as Joi from "joi";

export default registerAs("supabase", (): SupabaseConfig => {
  const values = {
    url: process.env.SUPABASE_URL,
    anonKey: process.env.SUPABASE_ANON_KEY,
    serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
    enableAuth: true,
    enableRealtime: false,
    enableStorage: true,
    schema: "public",
    authOptions: {
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    },
  };

  // Validation schema
  const schema = Joi.object({
    url: Joi.string().uri().required(),
    anonKey: Joi.string().required(),
    serviceRoleKey: Joi.string().required(),
    enableAuth: Joi.boolean().default(true),
    enableRealtime: Joi.boolean().default(false),
    enableStorage: Joi.boolean().default(true),
    schema: Joi.string().default("public"),
    authOptions: Joi.object({
      autoRefreshToken: Joi.boolean().default(true),
      persistSession: Joi.boolean().default(true),
      detectSessionInUrl: Joi.boolean().default(false),
    }).default({
      autoRefreshToken: true,
      persistSession: true,
      detectSessionInUrl: false,
    }),
  });

  const { error, value } = schema.validate(values) as {
    error?: Joi.ValidationError;
    value: SupabaseConfig;
  };

  if (error) {
    throw new Error(
      `Supabase Configuration validation error: ${error.message}`,
    );
  }

  return value;
});

export interface SupabaseConfig {
  url: string;
  anonKey: string;
  serviceRoleKey: string;
  enableAuth: boolean;
  enableRealtime: boolean;
  enableStorage: boolean;
  schema: string;
  authOptions: {
    autoRefreshToken: boolean;
    persistSession: boolean;
    detectSessionInUrl: boolean;
  };
}
