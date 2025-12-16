import { Socket } from "socket.io";
import { UserDocument } from "../models/user.model.js";
import { Types } from "mongoose";

declare module "socket.io" {
  interface Socket {
    user?: UserDocument;
    userId?: Types.ObjectId;
  }
}
