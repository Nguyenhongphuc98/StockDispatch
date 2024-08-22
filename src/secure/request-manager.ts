import { JsonRequest } from "../utils/type";
import Logger from "../loger";
import { InvalidPayloadResponse } from "../utils/response";
import { Request, Response } from "express";
import { commonParams } from "../utils/common-params";
import systemTime from "../utils/system-time";

const MAX_ALIVE = 24 * 60 * 60 * 1000;
const CLEAN_INTERVAL = 6 * 60 * 60 * 1000;
// const MAX_ALIVE = 3 * 1000;
// const CLEAN_INTERVAL = 1000;

const TAG = "[ReqManager]";

class RequestManager {
  reqCache: Map<string, number>;

  constructor() {
    this.reqCache = new Map();

    setInterval(() => {
      this.clearOutdateReq();
    }, CLEAN_INTERVAL);
  }

  clearOutdateReq() {
    this.reqCache.forEach((reqAt, reqId, m) => {
      if (Math.abs(reqAt - systemTime.now()) > MAX_ALIVE) {
        m.delete(reqId);
        Logger.log(TAG, "Delete outdate req", reqId, reqAt);
      }
    });
    Logger.log(TAG, "Cache req count", this.reqCache.size);
  }

  isValidReq(reqId: string, reqAt: number) {
    if (Math.abs(reqAt - systemTime.now()) > MAX_ALIVE) {
      return false;
    }

    return !this.reqCache.has(reqId);
  }

  addRequest(reqId: string, reqAt: number) {
    this.reqCache.set(reqId, reqAt);
  }
}

const requestManager = new RequestManager();

export async function validateRequest(
  req: JsonRequest,
  res: Response,
  next: any
) {
  const { sessionId } = commonParams(req);
  const { reqid, createat } = req.rawBody;

  if (requestManager.isValidReq(reqid, createat)) {
    requestManager.addRequest(reqid, createat);
    next();
  } else {
    Logger.log(TAG, "Duplicate req", reqid, createat);
    res.status(403).send(new InvalidPayloadResponse(sessionId));
  }
}
