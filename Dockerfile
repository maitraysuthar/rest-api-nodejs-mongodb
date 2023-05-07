FROM node:lts-alpine@sha256:1a9a71ea86aad332aa7740316d4111ee1bd4e890df47d3b5eff3e5bded3b3d10 as base

RUN apk add dumb-init
RUN apk add curl

WORKDIR /usr/app
COPY --chown=node:node package*.json ./
EXPOSE 3000
HEALTHCHECK --interval=15s --timeout=10s --retries=2 CMD curl -f http://localhost:3000/ || exit 1

COPY --chown=node:node ./ ./
USER node
CMD ["dumb-init", "node", "./bin/www"]