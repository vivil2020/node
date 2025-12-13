const http = require('http');
const https = require('https');

const PORT = process.env.PORT || 3000;

function setCORS(req, res) {
  const reqHeaders = req.headers['access-control-request-headers'];
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', reqHeaders || 'Content-Type, Accept');
}

const server = http.createServer((req, res) => {
  if (req.method === 'OPTIONS') {
    setCORS(req, res);
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method === 'POST' && req.url === '/api/facepp/detect') {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
      const body = Buffer.concat(chunks);
      
      const options = {
        hostname: 'api-cn.faceplusplus.com',
        path: '/facepp/v3/detect',
        method: 'POST',
        headers: {
          'Content-Type': req.headers['content-type'] || 'application/x-www-form-urlencoded',
          'Content-Length': Buffer.byteLength(body),
        },
      };

      const fReq = https.request(options, (fRes) => {
        const respChunks = [];
        fRes.on('data', (c) => respChunks.push(c));
        fRes.on('end', () => {
          const respBuf = Buffer.concat(respChunks);
          setCORS(req, res);
          res.statusCode = fRes.statusCode || 200;
          res.setHeader('Content-Type', fRes.headers['content-type'] || 'application/json');
          res.end(respBuf);
        });
      });

      fReq.on('error', (err) => {
        setCORS(req, res);
        res.writeHead(502, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'proxy_error', message: String(err) }));
      });

      fReq.write(body);
      fReq.end();
    });
    return;
  }

  setCORS(req, res);
  res.writeHead(404, { 'Content-Type': 'application/json' });
  res.end(JSON.stringify({ error: 'not_found' }));
});

server.listen(PORT, () => {
  console.log(`server running at http://localhost:${PORT}`);
});
