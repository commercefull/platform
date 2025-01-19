import express from "express";
import { isLoggedIn } from "../../libs/auth";

const router = express.Router();

router.get("/", isLoggedIn, (req, res) => {});
router.get("/categories", isLoggedIn, (req, res) => {});

export const storefrontApiRoutes = router;