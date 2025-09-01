import { registerAs } from "@nestjs/config";
import * as Joi from "joi";

export default registerAs("fileUpload", (): FileUploadConfig => {
  const values = {
    maxFileSize: parseInt(process.env.MAX_FILE_SIZE || "10485760", 10), // 10MB default
    destination: process.env.UPLOAD_DESTINATION || "./uploads",
    allowedMimeTypes: [
      "image/jpeg",
      "image/png",
      "image/gif",
      "application/pdf",
      "text/csv",
      "application/vnd.ms-excel",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    ],
    allowedExtensions: [
      ".jpg",
      ".jpeg",
      ".png",
      ".gif",
      ".pdf",
      ".csv",
      ".xls",
      ".xlsx",
    ],
  };

  // Validation schema
  const schema = Joi.object({
    maxFileSize: Joi.number().min(1024).max(104857600).default(10485760), // 1KB to 100MB
    destination: Joi.string().default("./uploads"),
    allowedMimeTypes: Joi.array()
      .items(Joi.string())
      .default([
        "image/jpeg",
        "image/png",
        "image/gif",
        "application/pdf",
        "text/csv",
        "application/vnd.ms-excel",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      ]),
    allowedExtensions: Joi.array()
      .items(Joi.string())
      .default([
        ".jpg",
        ".jpeg",
        ".png",
        ".gif",
        ".pdf",
        ".csv",
        ".xls",
        ".xlsx",
      ]),
  });

  const { error, value } = schema.validate(values) as {
    error?: Joi.ValidationError;
    value: FileUploadConfig;
  };

  if (error) {
    throw new Error(
      `File Upload Configuration validation error: ${error.message}`,
    );
  }

  return value;
});

export interface FileUploadConfig {
  maxFileSize: number;
  destination: string;
  allowedMimeTypes: string[];
  allowedExtensions: string[];
}
