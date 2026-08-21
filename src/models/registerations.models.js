import mongoose, {Schema} from "mongoose";

const registerationSchema = new Schema({
    Name: {
        type: String,
        required: true,
        trim: true
    },
    EventName: {
        type: String,
        required: true,
        trim: true
    },
    Email: {
        type: String,
        required: true,
        trim: true
    },
    RegisterationNumber: {
        type: String,
        required: true,
        trim: true
    },
    ClubName: {
        type: String,
        required: true,
        trim: true
    },
    checkedIn:{
        type: Boolean,
        default: false
    }
},{timestamps: true})

export const Registeration = new mongoose.model("Registeration", registerationSchema)