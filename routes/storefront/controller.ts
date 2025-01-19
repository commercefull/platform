import { Request, Response } from "express";

export const index = async (req: Request, res: Response) => {
    res.render("storefront/index");
}