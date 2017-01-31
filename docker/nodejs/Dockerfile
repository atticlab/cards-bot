FROM node:7.2

ENV http_proxy http://10.78.17.6:3128
ENV https_proxy http://10.78.17.6:3128

WORKDIR /app

RUN npm config set registry http://registry.npmjs.org

COPY ./entrypoint.sh /

ENTRYPOINT ["/entrypoint.sh"]