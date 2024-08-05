import { Request, Response } from "express";
import { JsonRequest } from "./type";

export function commonParams(req: Request | JsonRequest) {
  //@ts-ignore
  const { sessionid, fromDate, toDate } = req.query;

  return {
    sessionId: sessionid as string,
    fromDate,
    toDate,
  };
}
