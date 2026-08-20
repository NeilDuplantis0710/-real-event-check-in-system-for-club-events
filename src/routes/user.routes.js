import { Router } from "express"
import { registerEvent } from "../controllers/user.contollers.js"

const router = Router()

router.route("/registerEvent").post(registerEvent)

export default router