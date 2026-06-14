import http from 'http';

const query = "Death Stranding Director's Cut";
const options = {
  hostname: 'localhost',
  port: 3000,
  path: '/api/games/search',
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  }
};

const req = http.request(options, (res) => {
  let data = '';
  res.on('data', (chunk) => data += chunk);
  res.on('end', () => console.log(JSON.stringify(JSON.parse(data), null, 2)));
});

req.write(JSON.stringify({ query }));
req.end();
