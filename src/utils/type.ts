export interface JsonRequest extends Request {
    params: Record<string, string>;
    rawBody: Record<string, any>;
}
