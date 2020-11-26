FROM node:lts-alpine
RUN apk add --update git

ENV USER=defibot
ENV UID=12345
ENV GID=23456

RUN adduser \
    --disabled-password \
    "$USER"

USER defibot
RUN mkdir -p /home/defibot/bot-server
RUN mkdir -p /home/defibot/buidler
COPY --chown=defibot lib/buidler/artifacts /home/defibot/buidler/artifacts
WORKDIR /home/defibot/bot-server
COPY --chown=defibot package.json .
COPY --chown=defibot scripts scripts
COPY --chown=defibot .env.example .
RUN ls -la
RUN npm install -y
COPY --chown=defibot . .

ENV NODE_ENV production
CMD npm run start:indocker
