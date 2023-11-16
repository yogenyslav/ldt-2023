FROM node:latest
WORKDIR /app

COPY . /app

RUN npm i
RUN npm run build
RUN npm add serve -g

EXPOSE 10000

CMD ["npm", "run", "serve"]