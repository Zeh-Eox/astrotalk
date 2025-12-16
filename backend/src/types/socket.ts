import { Types } from "mongoose";

export interface AuthenticatedSocketData {
  userId: Types.ObjectId;
  fullName: string;
}