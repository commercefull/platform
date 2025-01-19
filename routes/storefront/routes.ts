import express from "express";
import { isLoggedIn } from "../../libs/auth";
import { index } from "./controller";

const router = express.Router();

router.get("/", index);
router.get("/login", (req, res) => {});
router.post("/login", (req, res) => {});
router.get("/registration", (req, res) => {});
router.post("/registration", (req, res) => {});
router.get("/password-reset", (req, res) => {});
router.post("/password-reset", (req, res) => {});
router.get("/categories", (req, res) => {});
router.get("/logout", isLoggedIn, (req, res) => {});

export const storefrontRoutes = router;