import express from "express";
import {
  getAllContacts,
  getChatPartners,
  getMessagesByUserId,
  sendMessage,
} from "../controllers/message.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";
import { arcjetProtection } from "../middleware/arcjet.middleware.js";
import { validate } from "../middleware/validate.js";
import {
  contactsQuerySchema,
  messagesQuerySchema,
  sendMessageBodySchema,
  userIdParamSchema,
} from "../schemas/message.schema.js";

const router = express.Router();

router.use(arcjetProtection, protectRoute);

router.get("/contacts", validate(contactsQuerySchema, "query"), getAllContacts);
router.get("/chats", getChatPartners);
router.get(
  "/:id",
  validate(userIdParamSchema, "params"),
  validate(messagesQuerySchema, "query"),
  getMessagesByUserId
);
router.post(
  "/send/:id",
  validate(userIdParamSchema, "params"),
  validate(sendMessageBodySchema),
  sendMessage
);

export default router;
