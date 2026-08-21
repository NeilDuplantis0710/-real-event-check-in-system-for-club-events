import { Router } from "express"
import { createEvent } from "../controllers/user.contollers.js"
import { createClub } from "../controllers/user.contollers.js"
import { viewAllEvents } from "../controllers/user.contollers.js"
import { viewAllClubs } from "../controllers/user.contollers.js"
import { eventRegisteration } from "../controllers/user.contollers.js"
import { checkedIn } from "../controllers/user.contollers.js"

const router = Router()

router.route("/registerEvent").post(createEvent)
router.route("/createClub").post(createClub)
router.route("/viewAllEvents").get(viewAllEvents)
router.route("/viewAllClubs").get(viewAllClubs)
router.route("/registerForEvent").post(eventRegisteration)
router.route("/checkIn").post(checkedIn)

export default router