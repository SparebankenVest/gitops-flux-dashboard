FROM mhart/alpine-node:8.10.0 as build
RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app

COPY ./package.json /usr/src/app/
RUN npm install

COPY ./src /usr/src/app/src
COPY ./.babelrc /usr/src/app/
RUN npm run build

FROM mhart/alpine-node:8.10.0
RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app

COPY --from=build /usr/src/app/node_modules ./node_modules
COPY --from=build /usr/src/app/dist/ .

CMD [ "node", "server.js" ]