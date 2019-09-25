FROM mhart/alpine-node:8.10.0 as build
RUN mkdir -p /usr/src/app/
WORKDIR /usr/src/app

ENV PATH /usr/src/app/node_modules/.bin:$PATH

COPY ./package.json /usr/src/app/
# COPY ./yarn.lock /usr/src/app/

RUN npm install --silent
# RUN yarn
RUN npm install react-scripts@3.0.1 -g --silent

COPY . /usr/src/app
# COPY ./public /usr/src/app/public

RUN npm run build

RUN ls -al build/static/js

FROM nginx:1.17.4-alpine
COPY --from=build /usr/src/app/build /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

# FROM mhart/alpine-node:8.10.0
# RUN mkdir -p /usr/src/app/
# WORKDIR /usr/src/app

# COPY --from=build /usr/src/app/node_modules ./node_modules
# COPY --from=build /usr/src/app/dist/ .

# CMD [ "node", "server.js" ]