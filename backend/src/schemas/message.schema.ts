import { z } from "zod";
import mongoose from "mongoose";

const objectId = z
  .string()
  .refine((v) => mongoose.isValidObjectId(v), { message: "Invalid id" });

export const sendMessageBodySchema = z
  .object({
    text: z.string().trim().max(2000).optional(),
    image: z
      .string()
      .startsWith("data:image/", "image must be a base64 data URI")
      .max(15 * 1024 * 1024, "Image too large")
      .optional(),
  })
  .refine((data) => data.text || data.image, {
    message: "Message must contain text or image",
  });

export const userIdParamSchema = z.object({ id: objectId });

export const contactsQuerySchema = z.object({
  search: z.string().trim().max(80).optional(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().positive().max(100))
    .optional(),
});

export const messagesQuerySchema = z.object({
  before: objectId.optional(),
  limit: z
    .string()
    .regex(/^\d+$/)
    .transform(Number)
    .pipe(z.number().int().positive().max(100))
    .optional(),
});
