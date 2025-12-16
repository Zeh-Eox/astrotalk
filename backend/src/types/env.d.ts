export {};

declare global {
  namespace NodeJS {
    interface ProcessEnv {
      PORT?: string;
      MONGO_URI?: string;
      NODE_ENV?: "development" | "production" | "test";
      JWT_SECRET?: string;
      RESEND_API_KEY?: string;
      EMAIL_FROM?: string;
      EMAIL_FROM_NAME?: string;
      CLIENT_URL?: string;
      CLOUDINARY_CLOUD_NAME?: string;
      CLOUDINARY_API_KEY?: string;
      CLOUDINARY_API_SECRET?: string;
      ARCJET_KEY?: string;
      ARCJET_ENV?: string;
    }
  }
}