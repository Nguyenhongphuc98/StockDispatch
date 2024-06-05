const hash = require("pbkdf2-password")();

export type HashedData = {
    hash: string,
    salt: string,
};

export function buildHashedData(data: string, salt: string = undefined): Promise<HashedData> {
   
    return new Promise((res, rej) => {
        hash({ password: data, salt: salt }, function (err: any, pass: any, salt: any, hash: any) {
            if (err) rej(err);
            
            res({
                hash,
                salt,
            });
          });
    })
}