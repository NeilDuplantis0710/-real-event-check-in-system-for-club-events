import { Router } from "express"
import { createEvent, createClub, viewAllEvents, viewAllClubs, eventRegisteration, checkedIn, getCheckedInList } from "../controllers/user.contollers.js"

const router = Router()

router.route("/registerEvent").post(createEvent)
router.route("/createClub").post(createClub)
router.route("/viewAllEvents").get(viewAllEvents)
router.route("/viewAllClubs").get(viewAllClubs)
router.route("/registerForEvent").post(eventRegisteration)
router.route("/checkIn").post(checkedIn)
router.route("/checkedInList").get(getCheckedInList)

export default router