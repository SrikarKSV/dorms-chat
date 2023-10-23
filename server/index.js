import { WebSocketServer, WebSocket } from 'ws';
import { serve } from '@hono/node-server';
import { cors } from 'hono/cors';
import { Hono } from 'hono';
import { nanoid } from 'nanoid';

const wss = new WebSocketServer({ port: 8080 });
const app = new Hono();

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
    }
  });

  ws.on('close', () => {
    dorms.forEach((room) => room.delete(ws));
  });

  ws.on('error', (err) => {
    console.log(`WebSocket error: ${err}`);
  });
});

app.use('/*', cors());

app.post('/createDorm', async (c) => {
  const dormId = nanoid(6);
  dorms.set(dormId, new Set());

  return c.text(dormId);
});

function getRandomKey(collection) {
  let keys = Array.from(collection.keys());
  return keys[Math.floor(Math.random() * keys.length)];
}

app.post('/joinDorm', async (c) => {
  let { dormId } = await c.req.json();
  if (dormId === '') {
    dormId = getRandomKey(dorms);
  }
  if (!dormId) {
    throw new Error('No dorms available');
  }
  return c.text(dormId);
});

app.onError((err, c) => {
  console.error(`${err}`);
  return c.text(err.message, 500);
});

const PORT = process.env.PORT || 3000;
serve({
  fetch: app.fetch,
  port: PORT,
});
