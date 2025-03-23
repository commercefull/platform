import { Request, Response } from "express";

type ResponseData = Record<string, any>;

export async function adminRespond(req: any, res: Response, view: string, data: ResponseData) {
  res.render(`admin-default/${view}`, {
    ...data
  });
}

export async function storefrontRespond(req: Request, res: Response, view: string, data: ResponseData) {
  res.render(`storefront/${view}`, {
    ...data
  });
}