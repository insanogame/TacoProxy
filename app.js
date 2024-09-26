const express = require('express');
const alloy = require('alloyproxy');
const http = require('http');
const fs = require('fs');
const path = require('path');
const compression = require('compression');
const cors = require('cors');

const config = JSON.parse(fs.readFileSync('./config.json', { encoding: 'utf8' }));
const app = express();
const server = http.createServer(app);

// Middleware
app.use(compression());
app.use(cors());

// Proxy configuration
const localprox = new alloy({
    prefix: '/prefix/',
    error: (proxy) => {
        console.error(`Error: ${proxy.error}`);
        return proxy.res.send(fs.readFileSync(path.join(__dirname, 'public', 'error.html'), 'utf8'));
    },
    request: (proxy) => {
        if (proxy.req.headers.cookie) {
            proxy.headers['Cookie'] = proxy.req.headers.cookie;
        }
    },
    response: (proxy) => {
        if (proxy.res.headers['set-cookie']) {
            proxy.res.headers['set-cookie'].forEach(cookie => {
                proxy.res.cookie(cookie.split(';')[0].split('=')[0], cookie.split(';')[0].split('=')[1], { path: '/' });
            });
        }
    },
    injection: true
});

app.use(localprox.app);
localprox.ws(server);

// Static file handling
app.use(express.static(path.join(__dirname, 'public')));

// Root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
server.listen(process.env.PORT || config.port, () => {
    console.log(`Server running on port ${process.env.PORT || config.port}`);
});
