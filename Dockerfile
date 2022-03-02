FROM node:17.3.0-alpine

WORKDIR /code

RUN yarn global add aws-cdk

CMD ["sh", "-c", "yarn && /bin/ash"]
