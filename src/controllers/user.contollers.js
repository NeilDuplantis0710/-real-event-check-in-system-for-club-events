import { asyncHandler } from "../utils/AyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { apiResponse } from "../utils/ApiResponse.js"
import { Event } from "../models/event.models.js"
import { Club } from "../models/club.models.js"



// Event Registeration
const registerEvent = asyncHandler(async  (req,res) => {

    const { ClubName, EventName, EventDate, StudentCoordinator, FacultyCoordinator, StartTime, EndTime, Status, Venue } = req.body

    console.log("Club Name: ", ClubName)
    console.log("Event Name: ", EventName)
    console.log("Event Date: ", EventDate)
    console.log("Student Coordinator: ", StudentCoordinator)
    console.log("Faculty Coordinator: ", FacultyCoordinator)
    console.log("Start Time: ", StartTime)
    console.log("End Time: ", EndTime)
    console.log("Status: ", Status)
    console.log("Venue: ", Venue)

    if(!ClubName && ClubName == ""){
        throw new ApiError(400, "Club name is required.")
    }
    if(!EventName && EventName == ""){
        throw new ApiError(400, "Event name is required.")
    }
    if(!EventDate && EventDate == ""){
        throw new ApiError(400, "Event Date is required.")
    }
    if(!StudentCoordinator && StudentCoordinator == ""){
        throw new ApiError(400, "Student Coordinator name is required")
    }
    if(!FacultyCoordinator && FacultyCoordinator == ""){
        throw new ApiError(400, "Faculty Coordinator name is required")
    }
    if(!StartTime && StartTime == ""){
        throw new ApiError(400, "Start Time is required")
    }
    if(!EndTime && EndTime == ""){
        throw new ApiError(400, "End Time of the Event is required")
    }
    if(!Status && Status == ""){
        throw new ApiError(400, "Event Status is required")
    }
    if(!Venue && Venue == ""){
        throw new ApiError(400, "Venue is required")
    }

    // Checking for an already existing event
    const existingEvent = await User.findOne({
        $or: [{EventName}]
    })

    if(existingEvent){
        throw new ApiError(409, "An event of this name already exists.")
    }

    // Creating entry in the database

    const event = await Event.create({
        ClubName,
        EventDate, 
        StudentCoordinator,
        FacultyCoordinator,
        StartTime,
        EndTime,
        Venue,
        Status,
        EventDate,
        EventName
    })

    
    //Confirming event registeration
    const eventRegistered = await Event.findById(event._id)

    if(!eventRegistered){
        throw new ApiError(500, "Could not register the event!!")
    }


    // return response

    return res.status(201).json(new apiResponse(200, eventRegistered, "Event Registered Successfully!!!"))
})

export { registerEvent }

