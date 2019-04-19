FROM node:alpine
USER root
# Install custom tools, runtime, etc.
# Install perl
RUN apk add --update docker  py-pip  python-dev libffi-dev openssl-dev gcc libc-dev make  && rm -rf /var/cache/apk/*
RUN pip install docker-compose
RUN rc-update add docker boot
RUN service docker start

USER gitpod

# Give back control
USER root
