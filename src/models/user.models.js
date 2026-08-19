import mongoose, {Schema} from "mongoose";
import { lowercase, uppercase } from "zod";

const userSchema = new Schema(
    {
        Name: {
            type: String,
            req: true,
        },
        Email:{
            type: String,
            req: true,
            unique: true,
            lowercase: true
        },
        RegisterationNumber: {
            type: String,
            unique: true,
            uppercase: true,
            req: true,
        },
        Branch:{
            type: String,
            req: true,
            uppercase: true,
        },
        YearOfStudy:{
            req: true,
            type: Number,

        }
}, {timestamps: true})

export const User = mongoose.model("User", userSchema)