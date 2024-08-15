const origins = [
  "http://127.0.0.1:5500",
  "http://127.0.0.1:3000",
  "http://localhost:3000",
  "http://157.245.196.187:8081"
];
export const corsOptions = {
  origin: origins,
  "Access-Control-Allow-Credentials": true,
  credentials: true,
  "Access-Control-Allow-Origin": origins,
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  preflightContinue: false,
  optionsSuccessStatus: 204,
};
