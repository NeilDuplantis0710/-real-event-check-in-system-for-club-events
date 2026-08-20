import { Router } from "express"
import { registerEvent } from "../controllers/user.contollers.js"
import { createClub } from "../controllers/user.contollers.js"

const router = Router()

router.route("/registerEvent").post(registerEvent)
router.route("/createClub").post(createClub)

export default router