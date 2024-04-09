FROM node:20-alpine

# Create app directory
WORKDIR /usr/src/app

# Install app dependencies
COPY package*.json ./

RUN npm install

# Bundle app source
COPY . .

#RUN npm test

EXPOSE 3000

CMD [ "node", "src/index.js" ]
