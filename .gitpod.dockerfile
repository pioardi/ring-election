FROM node:alpine

USER root
# Install custom tools, runtime, etc.
RUN apk --update add docker docker-compose

USER gitpod


# Give back control
USER root
