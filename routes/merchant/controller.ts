import { Request, Response } from "express";

export const dashboard = async (req: Request, res: Response) => {
    res.render("merchant/dashboard");
}

export const login = async (req: Request, res: Response) => {
    res.render("merchant/login");
}