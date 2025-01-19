import express from "express";
import { isMerchantLoggedIn } from "../../libs/auth";
import { dashboard } from "./controller";
import { login } from "../merchant/controller";

const router = express.Router();

router.get("/", isMerchantLoggedIn, dashboard);
router.get("/login", login);
router.get("/categories", isMerchantLoggedIn, (req, res) => {});
router.get("/logout", (req, res) => {});
router.post("/login", (req, res) => {});
router.get("/password-reset", isMerchantLoggedIn, (req, res) => {});
router.post("/password-reset", (req, res) => {});

export const merchantRoutes = router;