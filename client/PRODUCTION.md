# Production Deployment Guide

## Overview
This application runs a card reader server with Socket.IO on port 4014 and serves a React frontend at `/card-reader`.

## Production Setup

### 1. Build the React App
```bash
npm run build
```

This will compile the React app from `client/src` to `client/dist`.

### 2. Start the Production Server
```bash
npm run prod
```

Or manually:
```bash
node app.js
```

### 3. Access the Application

- **Main App**: http://your-server:4030/
- **Card Reader Interface**: http://your-server:4030/card-reader
- **Socket.IO Server**: ws://your-server:4014

## How It Works

1. The Express server runs on port 4030 (or `SERVER_PORT` from `.env`)
2. Socket.IO server runs on port 4014
3. When card data is posted to `/temp/cardread`, it's broadcast via Socket.IO
4. The React app at `/card-reader` displays the card data in real-time

## Production Checklist

- [ ] Build the React app: `npm run build`
- [ ] Set environment variables in `.env`
- [ ] Ensure port 4014 is accessible for Socket.IO
- [ ] Start the server: `node app.js` or use a process manager

## Using a Process Manager (Recommended)

### PM2 Example
```bash
npm install -g pm2
pm2 start app.js --name card-reader-server
pm2 save
pm2 startup
```

### Systemd Example
Create `/etc/systemd/system/card-reader.service`:
```ini
[Unit]
Description=Card Reader Server
After=network.target

[Service]
Type=simple
User=youruser
WorkingDirectory=/path/to/nab-cardread-server
ExecStart=/usr/bin/node app.js
Restart=on-failure
Environment=NODE_ENV=production

[Install]
WantedBy=multi-user.target
```

Then:
```bash
sudo systemctl enable card-reader
sudo systemctl start card-reader
```

## Nginx Reverse Proxy (Optional)

If you want to use a domain name and SSL:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    location / {
        proxy_pass http://localhost:4030;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /socket.io/ {
        proxy_pass http://localhost:4014;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Troubleshooting

- **Socket.IO not connecting**: Check if port 4014 is open and accessible
- **Card data not displaying**: Check browser console for Socket.IO connection errors
- **Build errors**: Ensure all dependencies are installed: `npm install && npm install --prefix client`
