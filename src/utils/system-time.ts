
//TODO: update system sync to client.
class SystemTime {
    constructor() {}

    date() {
        const now = Date.now();
        const delta = 7 * 60 * 60 * 1000;
        // const delta = 0;
        return new Date(now + delta);
    }

    now() {
        const now = Date.now();
        const delta = 7 * 60 * 60 * 1000;
        // const delta = 0;
        return now + delta;
    }
}

const systemTime = new SystemTime();
export default systemTime;
