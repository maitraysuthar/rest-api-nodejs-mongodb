FROM python:3.8-slim-buster@sha256:2ce8031b678a8de21815a760313707f145f69ffc80f8d411b2d5f198f47608bf as base

RUN apt-get update
RUN apt-get install curl nano -y

RUN curl -sL https://deb.nodesource.com/setup_18.x | bash
RUN apt-get install nodejs -y

RUN useradd -ms /bin/bash node
WORKDIR /home/node

EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=10s --retries=2 CMD curl -f http://localhost:3000/ || exit 1

COPY --chown=node:node python-requirements.txt ./
RUN pip3 install -r python-requirements.txt

COPY --chown=node:node package*.json ./

FROM base as production
RUN npm ci --only=production
COPY --chown=node:node ./ ./
USER node
CMD ["node", "server.js"]

FROM base as development
RUN npm i -g nodemon && npm ci
COPY --chown=node:node ./ ./
USER node
CMD ["nodemon", "server.js"]