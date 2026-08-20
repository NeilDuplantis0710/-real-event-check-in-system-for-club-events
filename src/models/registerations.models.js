import mongoose, {Schema} from "mongoose";

const registerationSchema = new Schema({
    users: {
        type: mongoose.Schema.ObjectId,
        ref: "User"
    }
},{timestamps: true})

export const Registeration = new mongoose.model("Registeration", registerationSchema)