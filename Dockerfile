FROM node:20.10-alpine

WORKDIR /xrpl-wallet

COPY package*.json .
COPY yarn* .
RUN yarn install

COPY . .

CMD ["npm", "run", "dev"]