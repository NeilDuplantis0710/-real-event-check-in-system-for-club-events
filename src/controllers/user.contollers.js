import { asyncHandler } from "../utils/AyncHandler.js"
import { ApiError } from "../utils/ApiError.js"
import { User } from "../models/user.models.js"
import { apiResponse } from "../utils/ApiResponse.js"
import { Event } from "../models/event.models.js"
import { Club } from "../models/club.models.js"
import { Registeration } from "../models/registerations.models.js"



// Event Creation
const createEvent = asyncHandler(async  (req,res) => {

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

    if(!ClubName || ClubName === ""){
        throw new ApiError(400, "Club name is required.")
    }
    if(!EventName || EventName === ""){
        throw new ApiError(400, "Event name is required.")
    }
    if(!EventDate || EventDate === ""){
        throw new ApiError(400, "Event Date is required.")
    }
    if(!StudentCoordinator || StudentCoordinator === ""){
        throw new ApiError(400, "Student Coordinator name is required")
    }
    if(!FacultyCoordinator || FacultyCoordinator === ""){
        throw new ApiError(400, "Faculty Coordinator name is required")
    }
    if(!StartTime || StartTime === ""){
        throw new ApiError(400, "Start Time is required")
    }
    if(!EndTime || EndTime === ""){
        throw new ApiError(400, "End Time of the Event is required")
    }
    if(!Status || Status === ""){
        throw new ApiError(400, "Event Status is required")
    }
    if(!Venue || Venue === ""){
        throw new ApiError(400, "Venue is required")
    }

    // Checking for an already existing event (by name)
    const existingEvent = await Event.findOne({ EventName })

    if(existingEvent){
        throw new ApiError(409, "An event of this name already exists.")
    }

    // Creating entry in the database
    const event = await Event.create({
        ClubName,
        EventName,
        EventDate, 
        StudentCoordinator,
        FacultyCoordinator,
        StartTime,
        EndTime,
        Venue,
        Status
    })

    
    //Confirming event registeration
    const eventRegistered = await Event.findById(event._id)

    if(!eventRegistered){
        throw new ApiError(500, "Could not register the event!!")
    }


    // return response

    return res.status(201).json(new apiResponse(201, eventRegistered, "Event Registered Successfully!!!"))
})

//Create a club

const createClub = asyncHandler(async (req,res) => {

    const { ClubName } = req.body

    if(!ClubName || ClubName == ""){
        throw new ApiError(400, "A name is a must to create a club")
    }

    const club = await Club.create({
        ClubName
    })

    const clubCreated = await Club.findById(club._id)

    if(!clubCreated){
        throw new ApiError(500, "Club could not be created!!")
    }

    return res.status(201).json(new apiResponse(201, clubCreated, "Congratulations!!! Club has been successfully registered!!"))
})

const viewAllEvents = asyncHandler(async (req,res) => {
    const events = await Event.find({})

    if(!events){
        throw new ApiError(400, "No events going on right now!!")
    }

    return res.status(201).json(new apiResponse(201, events, "All the events available are here for the display."))
})

const viewAllClubs = asyncHandler(async (req,res) => {

    const clubs = await Club.find({})

    if(!clubs || clubs.length === 0){
        throw new ApiError(400, "No Clubs are registered right now!!!")
    }

    res.status(200).json(new apiResponse(200, clubs, "All the clubs registered are here!!!"))
})

const eventRegisteration = asyncHandler(async (req,res) => {

    const { EventName, ClubName } = req.body
    const {eventId} = req.params
    const {clubId} = req.params

    const event = await Event.findById(eventId)
    if(!event){
        throw new ApiError(400, "Event not found")
    }
    const club = await Club.findById(clubId)
    if(!club){
        throw new ApiError(400, "Club not found")
    }

    if(event.ClubName != club.ClubName){
        throw new ApiError(400, "This event is not conducted by this club.")
    }



})

export { createEvent, createClub, viewAllEvents, viewAllClubs }

