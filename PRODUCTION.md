# Production Deployment Guide

## Overview
This application runs a card reader server with Socket.IO on port 4014 and serves a React frontend at `/card-reader`.

## Production Setup

### 1. Configure Environment Variables

Create a `.env` file in the project root:

```bash
# Server Configuration
SERVER_PORT=4030

# Production Domain (REQUIRED for Socket.IO CORS)
# Add your production domain/IP to allow Socket.IO connections
PRODUCTION_DOMAIN=https://yourdomain.com
# Or for IP-based deployments:
# PRODUCTION_DOMAIN=http://192.168.1.100:4030
```

**Important**: The `PRODUCTION_DOMAIN` variable is required for Socket.IO to accept connections from your production domain. Without it, you'll get CORS errors.

### 2. Build the React App
```bash
npm run build
```

This will compile the React app from `client/src` to `client/dist`.

### 3. Start the Production Server
```bash
npm run prod
```

Or manually:
```bash
node app.js
```

### 4. Access the Application

- **Main App**: http://your-server:4030/
- **Card Reader Interface**: http://your-server:4030/card-reader
- **Socket.IO Server**: ws://your-server:4014

## CORS Configuration

The Socket.IO server is configured with strict origin checking for security. Allowed origins:

- `http://localhost:4030` (development)
- `http://localhost:5173` (Vite dev server)
- `http://127.0.0.1:4030`
- `http://127.0.0.1:5173`
- Your production domain (set via `PRODUCTION_DOMAIN` in `.env`)

If you get CORS errors:
1. Check that `PRODUCTION_DOMAIN` is set in `.env`
2. Ensure the domain matches exactly (including `http://` or `https://`)
3. Check server logs for "CORS blocked origin" messages
4. Add additional origins to the `allowedOrigins` array in `app.js` if needed

## How It Works

1. The Express server runs on port 4030 (or `SERVER_PORT` from `.env`)
2. Socket.IO server runs on port 4014
3. When card data is posted to `/temp/cardread`, it's broadcast via Socket.IO
4. The React app at `/card-reader` displays the card data in real-time

## Production Checklist

- [ ] Create `.env` file and set `PRODUCTION_DOMAIN`
- [ ] Build the React app: `npm run build`
- [ ] Ensure port 4014 is accessible for Socket.IO
- [ ] Start the server: `node app.js` or use a process manager
- [ ] Test Socket.IO connection from production domain

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

**Note**: If using Nginx, set `PRODUCTION_DOMAIN=https://yourdomain.com` in your `.env` file.

## Adding Additional Allowed Origins

If you need to allow connections from additional domains or IPs, edit `app.js` and add them to the `allowedOrigins` array:

```javascript
const allowedOrigins = [
  "http://localhost:4030",
  "http://localhost:5173",
  "http://127.0.0.1:4030",
  "http://127.0.0.1:5173",
  "http://192.168.1.50:4030",  // Add your custom origins here
  "https://another-domain.com"
];
```

## Troubleshooting

### CORS Errors
- **Error**: "Not allowed by CORS"
- **Solution**: 
  1. Set `PRODUCTION_DOMAIN` in `.env`
  2. Check server logs for blocked origins
  3. Add the blocked origin to `allowedOrigins` in `app.js`

### Socket.IO Not Connecting
- Check if port 4014 is open and accessible
- Verify `PRODUCTION_DOMAIN` matches your actual domain
- Check browser console for connection errors
- Ensure firewall allows port 4014

### Card Data Not Displaying
- Check browser console for Socket.IO connection errors
- Verify the `/temp/cardread` endpoint is receiving data
- Check server logs for emitted events

### Build Errors
- Ensure all dependencies are installed: `npm install && npm install --prefix client`
- Try clearing build cache: `rm -rf client/dist && npm run build`
