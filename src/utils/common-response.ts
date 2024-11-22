import { Request, Response } from "express";
import { DataResult, JsonRequest } from "./type";
import { ErrorCode } from "./const";
import {
  ErrorResponse,
  InvalidPayloadResponse,
  NotEncryptSessionNotFoundResponse,
  PermissionDeniedResponse,
  ResourceNotFoundResponse,
  SuccessResponse,
} from "./response";
import Logger from "../loger";

export function commonResponseHandler(
  sessionId: string,
  result: DataResult,
  req: Request | JsonRequest,
  res: Response,
  next: any
) {
  switch (result.error_code) {
    case ErrorCode.ResourceNotFound:
      res.send(new ResourceNotFoundResponse(sessionId, result.data));
      break;
    case ErrorCode.Success:
      res.send(new SuccessResponse(sessionId, result.data));
      break;
    case ErrorCode.Error:
      res.send(new ErrorResponse(sessionId, result.data));
      break;
    case ErrorCode.InvalidPayload:
      res.send(new InvalidPayloadResponse(sessionId, result.data));
      break;
    case ErrorCode.PermissionDenied:
      res.send(new PermissionDeniedResponse(sessionId, result.data));
      break;
    default:
      break;
  }
}

export function rawResponseHandler(
  result: DataResult<string | Record<string, any>>,
  req: Request | JsonRequest,
  res: Response,
  next: any
) {
  // Logger.log('resp raw', result);
  res.send(result);
}
