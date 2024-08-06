import Logger from "../loger";

export function CatchErrors(
  target: any,
  propertyKey: string,
  descriptor: PropertyDescriptor
) {
  const originalMethod = descriptor.value;

  descriptor.value = async function (...args: any[]) {
    try {
      return await originalMethod.apply(this, args);
    } catch (error) {
      Logger.error(`Error in ${propertyKey}:`, error);
    }
  };
}

export function withErrorHandling(fn: Function) {
  return async function (...args: any[]) {
    try {
      return await fn(...args);
    } catch (error) {
      Logger.error("Error in function:", error);
      const [req, res] = args;
      if (res) {
        res.status(500).send("Internal Server Error");
      }
    }
  };
}
