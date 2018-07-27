FROM node:10 as dev
MAINTAINER Mark Wecke <wecke@neoskop.de>

RUN apt-get update
RUN apt-get install -y mysql-client

ENV NODE_ENV    production
ENV DB_TYPE     mysql
ENV DB_HOST     db
ENV DB_PORT     3306
ENV DB_NAME     hostit
ENV DB_USER     root
ENV DB_PASS     root
ENV PORT        5717

RUN npm install -g yarn

WORKDIR /src
COPY package.json .
COPY yarn.lock .
RUN yarn --production=false
COPY ./ .
RUN yarn run build

ENTRYPOINT [ "./entrypoint.sh" ]
CMD [ "./bin/cli.js", "--config", "conf.yml" ]

EXPOSE ${PORT}

FROM dev as prod
RUN rm -rf node_modules
RUN yarn --prod
