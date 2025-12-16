import "socket.io";
import { Types } from "mongoose";

declare module "socket.io" {
  interface Socket {
    userId: Types.ObjectId;
    user: {
      _id: Types.ObjectId;
      fullName: string;
      email: string;
    };
  }
}