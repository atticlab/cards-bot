FROM node:7.2

ENV http_proxy http://10.78.17.6:3128
ENV https_proxy http://10.78.17.6:3128

COPY ./package.json /tmp

RUN npm config set registry http://registry.npmjs.org && cd /tmp && npm install

export http_proxy=''
export https_proxy=''

WORKDIR /src

COPY ./entrypoint.sh /
ENTRYPOINT ["/entrypoint.sh"]
