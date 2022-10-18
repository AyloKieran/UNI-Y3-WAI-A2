'use strict';

const express = require('express');
const { Server } = require('ws');
const { v4: uuidv4 } = require('uuid');
const PORT = process.env.PORT || 3000;

const server = express()
  .use(express.static('web'))
  .listen(PORT, () => console.log(`Listening on ${PORT}`));

const wss = new Server({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (message) => {
    let parsedMessage = null;

    try {
      parsedMessage = JSON.parse(message);
    } catch {
      console.log("Invalid Message - Unparsable JSON");
    }

    if (parsedMessage != null) {
      executeMessage(ws, parsedMessage);
    }
  })

  ws.on('close', () => {
    console.log('Client disconnected')
  });

});

function executeMessage(client, message) {
  let type = message.type || null,
      data = message.data || null;

  console.log(`${new Date().toLocaleString()} - New Message Received: ${JSON.stringify(message)}`);

  switch(type) {
    case 'ping':
      _sendMessage('{"type": "pong"}');
      break;
    case 'joining':
      _sendMessage(`{
        "type": "joined", 
        "data": { 
          "userID": "${uuidv4()}"
        }
      }`);
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
      wss.clients.forEach((client) => {
        client.send(message);
      });
    } else {
      client.send(message);
    }

    console.log(`${new Date().toLocaleString()} - New Message Sent: ${message}`);
  }
}
