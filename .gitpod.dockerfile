FROM node:alpine
USER root
# Install custom tools, runtime, etc.
# Install perl
RUN apk add --update docker && rm -rf /var/cache/apk/*
RUN apk add --update docker-compose && rm -rf /var/cache/apk/*


USER gitpod

# Give back control
USER root
