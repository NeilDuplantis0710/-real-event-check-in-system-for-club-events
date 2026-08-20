import mongoose, {Schema} from 'mongoose'

const clubSchema = new Schema(
    {
        Name: {
            required: true,
            type: String,
            unique: true,
            uppercase: true
        },
        EventName: {
            type: Schema.Types.ObjectId,
            ref: "Event"
        }
    },{timestamps: true})


const Club = mongoose.model("Club", clubSchema)

export default Club
export { Club }