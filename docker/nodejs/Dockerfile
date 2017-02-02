FROM node:7.2

ENV http_proxy http://10.78.17.6:3128
ENV https_proxy http://10.78.17.6:3128

COPY ./package.json /tmp

RUN cd /tmp && npm install

ENV http_proxy=
ENV https_proxy=

WORKDIR /src

COPY ./entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
