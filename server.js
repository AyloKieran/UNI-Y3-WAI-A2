'use strict';

const express = require('express');
const { Server } = require('ws');
const { v4: uuidv4 } = require('uuid');
const PORT = process.env.PORT || 3000;

const WEB_SERVER = express()
  .use(express.static('web'))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));
let WebSocketServer;

let MessageHandler = (function () {
  function executeMessage(client, message) {
    let messageType = message.type || null;

    console.log(`${new Date().toLocaleString()} - New Message Received: ${JSON.stringify(message)}`);

    switch (messageType) {
      case 'ping':
        _sendMessage('{"type": "pong"}');
        break;
      case 'joining':
        _sendMessage(`{"type": "joined", "data": { "userID": "${uuidv4()}" } }`);
        break;
      case 'message':
        _sendMessage(JSON.stringify(message), true);
        break;
      default:
        console.log("NOT IMPLEMENTED");
        break;
    }

    function _sendMessage(message, all = false) {
      if (all) {
        WebSocketServer.clients.forEach((client) => {
          client.send(message);
        });
      } else {
        client.send(message);
      }

      console.log(`${new Date().toLocaleString()} - New Message Sent: ${message}`);
    }
  }

  return {
    executeMessage: executeMessage
  };
})();

(function init() {
  WebSocketServer = new Server({ server: WEB_SERVER });

  WebSocketServer.on('connection', (websocket) => {
    console.log('Client Connected');

    websocket.on('message', (message) => {
      let parsedMessage = null;

      try {
        parsedMessage = JSON.parse(message);
      } catch {
        console.log("Invalid Message - Unparsable JSON");
      }

      if (parsedMessage != null) {
        MessageHandler.executeMessage(websocket, parsedMessage);
      }
    });

    websocket.on('close', () => {
      console.log('Client disconnected')
    });
  })
})();