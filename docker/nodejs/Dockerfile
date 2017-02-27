FROM node:7.2

COPY ./package.json /tmp

RUN cd /tmp && npm install

WORKDIR /src

COPY ./entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
