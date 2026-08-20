import mongoose, {Schema} from "mongoose";

const eventSchema = new Schema(
    {
        ClubName = {
            type: Schema.Types.ObjectId,
            ref: "Club"
        },
        EventName = {
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
        }
    },{timestamps: true})

export const Event = mongoose.model("Event", eventSchema)