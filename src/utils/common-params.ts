import { Request, Response } from "express";
import { JsonRequest } from "./type";

export function commonParams(req: Request | JsonRequest) {
  //@ts-ignore
  const { sessionid, fromDate, toDate, page, kw, ts, wstt, pack, po } = req.query;

  return {
    sessionId: sessionid as string,
    fromDate,
    toDate,
    page: page || 1,
    kw,
    ts,
    wstt,
    pack,
    po,
  };
}
