import { WebSocketServer, WebSocket } from 'ws';
import express from 'express';
import http from 'http';
import cors from 'cors';
import { nanoid } from 'nanoid';

const server = express();

server.use(
  cors({
    origin: 'https://dormss.netlify.app',
  })
);

server.use(express.json());

server.get('/', (req, res) => {
  return res.send('Working!');
});

server.post('/createDorm', (req, res) => {
  const dormId = nanoid(6);
  dorms.set(dormId, new Set());

  return res.send(dormId);
});

function getRandomKey(collection) {
  let keys = Array.from(collection.keys());
  return keys[Math.floor(Math.random() * keys.length)];
}

server.post('/joinDorm', (req, res) => {
  let { dormId } = req.body;
  if (dormId === '') {
    dormId = getRandomKey(dorms);
  }
  if (!dormId) {
    res.status(404).send('No dorms available');
  }
  return res.send(dormId);
});

const app = http.createServer(server);
const wss = new WebSocketServer({ server: app });

let dorms = new Map();

function sendMessage(roomId, message) {
  let dorm = dorms.get(roomId);
  if (dorm) {
    dorm.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(JSON.stringify(message));
      }
    });
  }
}

wss.on('connection', (ws) => {
  ws.on('message', (message) => {
    let { type, username, dormId, data } = JSON.parse(message);
    if (type === 'JOIN') {
      if (!dorms.has(dormId)) {
        ws.send(
          JSON.stringify({
            type: 'ERROR',
            message: "dorm doesn't exist",
          })
        );
        ws.close();
      }

      dorms.get(dormId).add(ws);
      sendMessage(dormId, {
        id: nanoid(6),
        type: 'JOINED',
        from: username,
        message: `${username} joined the chat!`,
      });
    } else if (type === 'MESSAGE') {
      let { text } = data;
      sendMessage(dormId, {
        id: nanoid(6),
        type: 'MESSAGE',
        from: username,
        message: text,
      });
    } else if (type === 'LEFT') {
      sendMessage(dormId, {
        id: nanoid(6),
        type: 'LEFT',
        from: username,
        message: `${username} left the chat`,
      });
    }
  });

  ws.on('close', () => {
    dorms.forEach((room) => room.delete(ws));
  });

  ws.on('error', (err) => {
    console.log(`WebSocket error: ${err}`);
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Listening on PORT: ${PORT}`);
});
