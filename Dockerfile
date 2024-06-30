# syntax=docker/dockerfile:1

FROM node:18
WORKDIR /app
COPY . .
RUN yarn install --production
CMD ["node", "."]
EXPOSE 8080