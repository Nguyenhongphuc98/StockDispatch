# syntax=docker/dockerfile:1

FROM node:16
WORKDIR /app
COPY . .
RUN yarn install --production
CMD ["node", "."]
EXPOSE 8080