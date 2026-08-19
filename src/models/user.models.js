import mongoose, { Schema } from "mongoose";

const userSchema = new Schema(
  {
    Name: {
      type: String,
      required: true,
    },
    Email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    RegisterationNumber: {
      type: String,
      unique: true,
      uppercase: true,
      required: true,
    },
    Branch: {
      type: String,
      required: true,
      uppercase: true,
    },
    YearOfStudy: {
      required: true,
      type: Number,
    },
  },
  { timestamps: true }
);

export const User = mongoose.model("User", userSchema);