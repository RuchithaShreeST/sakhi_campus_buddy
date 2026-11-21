import http from 'node:http';
import { chatRoute } from './routes/chat.js';

const port = Number(process.env.PORT || 8787);
const server = http.createServer((request, response) => {
  if (request.method === 'POST' && request.url === '/chat') return chatRoute(request, response);
  response.writeHead(404, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({ error: 'Not found' }));
});

server.listen(port, () => console.log(`Sakhi AI server listening on ${port}`));

