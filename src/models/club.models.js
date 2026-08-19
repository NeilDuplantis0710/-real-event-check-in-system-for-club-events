import mongoose, {Schema} from 'mongoose'
import { uppercase } from 'zod'

const clubSchema = new Schema(
    {
        Name: {
            req: true,
            type: String, 
            unique: true,
            uppercase: true
        },
        EventName: {
            type: Schema.Types.ObjectId,
            ref: "Event"
        }
    },{timestamps: true})


export default Club = mongoose.Schema("Club", clubSchema)