FROM node:10 as dev
MAINTAINER Mark Wecke <wecke@neoskop.de>

RUN apt-get update
RUN apt-get install -y mysql-client clamav-freshclam clamav-daemon wget

ENV DB_TYPE     mysql
ENV DB_HOST     db
ENV DB_PORT     3306
ENV DB_DATABASE hostit
ENV DB_USER     root
ENV DB_PASS     root
ENV PORT        5717
ENV SECRET      "NOT_SO_SECURE_SECRET...CHANGE!!!"

RUN npm install -g yarn

# Download initial database
RUN wget -O /var/lib/clamav/main.cvd -q http://database.clamav.net/main.cvd && \
    wget -O /var/lib/clamav/daily.cvd -q http://database.clamav.net/daily.cvd && \
    wget -O /var/lib/clamav/bytecode.cvd -q http://database.clamav.net/bytecode.cvd && \
    chown clamav:clamav /var/lib/clamav/*.cvd

RUN cd /var/lib/clamav && tar -czvf /clamav.tgz .

VOLUME [ "/var/lib/clamav" ]

RUN mkdir /var/run/clamav && \
    chown clamav:clamav /var/run/clamav && \
    chmod 750 /var/run/clamav

RUN sed -i 's/^Foreground .*$/Foreground true/g' /etc/clamav/clamd.conf && \
    sed -i 's/^Foreground .*$/Foreground true/g' /etc/clamav/freshclam.conf


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
ENV NODE_ENV production
RUN rm -rf node_modules
RUN yarn --prod
