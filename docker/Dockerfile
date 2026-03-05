FROM node:24

EXPOSE 4444

VOLUME /app

WORKDIR /app

RUN npm install -g serve

COPY entrypoint.sh /

USER node

ENTRYPOINT ["/entrypoint.sh"]

