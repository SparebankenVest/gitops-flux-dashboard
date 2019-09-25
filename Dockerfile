FROM mhart/alpine-node:8.10.0 as api-build
RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app

COPY api/package.json /usr/src/app/
RUN npm install

COPY api/src /usr/src/app/src
COPY api/.babelrc /usr/src/app/
RUN npm run build

FROM mhart/alpine-node:8.10.0 as client-build
RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app

ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY client/package.json /usr/src/app/

RUN npm install --silent
RUN npm install react-scripts@3.0.1 -g --silent

COPY client /usr/src/app

RUN npm run build

FROM mhart/alpine-node:8.10.0
RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app

COPY --from=api-build /usr/src/app/node_modules ./node_modules
COPY --from=api-build /usr/src/app/dist/ .
COPY --from=client-build /usr/src/app/build static

CMD [ "node", "server.js" ]