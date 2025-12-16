import { Schema, model, Document, Types } from "mongoose";

export interface UserDocument extends Document {
  _id: Types.ObjectId;
  email: string;
  password: string;
  fullName: string;
  profilePicture?: string;
  createdAt: Date;
  updatedAt: Date;
}

const userSchema = new Schema<UserDocument>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    fullName: {
      type: String,
      required: true,
      minlength: 8,
    },
    profilePicture: {
      type: String,
      default: "",
    },
  },
  { timestamps: true }
);

const UserModel = model<UserDocument>("User", userSchema);
export default UserModel;
