import mongoose, {Schema} from "mongoose";

const eventSchema = new Schema(
    {
        ClubName : {
            type: String,
            required: true,
            trim: true
        },
        EventName : {
            req: true,
            type: String,
            unique: true
        },
        EventDate: {
            req: true,
            type: String,
        },
        StudentCoordinator: {
            type: String,
            req: true,
        },
        FacultyCoordinator: {
            type: String,
            req: true
        }, 
        StartTime: {
            req: true,
            type: String
        },
        EndTime: {
            req: true,
            type: String
        },
        Status:{
            req: true,
            type: String
        }, 
        Venue: {
            req: true,
            type: String
        }
    },{timestamps: true})

export const Event = mongoose.model("Event", eventSchema)