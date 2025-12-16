import "dotenv/config";

const required = (key: string): string => {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing environment variable: ${key}`);
  }
  return value;
};

export const ENV = {
  PORT: Number(process.env.PORT ?? 5000),

  MONGO_URI: required("MONGO_URI"),
  JWT_SECRET: required("JWT_SECRET"),

  NODE_ENV: process.env.NODE_ENV ?? "development",

  RESEND_API_KEY: required("RESEND_API_KEY"),
  EMAIL_FROM: required("EMAIL_FROM"),
  EMAIL_FROM_NAME: process.env.EMAIL_FROM_NAME ?? "AstroTalk",

  CLIENT_URL: required("CLIENT_URL"),

  CLOUDINARY_CLOUD_NAME: required("CLOUDINARY_CLOUD_NAME"),
  CLOUDINARY_API_KEY: required("CLOUDINARY_API_KEY"),
  CLOUDINARY_API_SECRET: required("CLOUDINARY_API_SECRET"),

  ARCJET_KEY: required("ARCJET_KEY"),
  ARCJET_ENV: process.env.ARCJET_ENV ?? "development",
} as const;