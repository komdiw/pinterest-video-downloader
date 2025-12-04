#!/usr/bin/env node

import http from 'http';

console.log('🔥 Starting SIMPLE test server...');
console.log('📍 Available ports check:');

// Проверим порты
const testPort = process.env.PORT || 80;
console.log('🌍 PORT env:', process.env.PORT);
console.log('🎯 Using port:', testPort);

const server = http.createServer((req, res) => {
    console.log('📨 Request received:', req.method, req.url);

    // Устанавливаем CORS headers
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        res.writeHead(200);
        res.end();
        return;
    }

    if (req.url === '/') {
        res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
        res.end(`
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Simple Test Server</title>
                <style>
                    body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
                    .success { color: green; font-size: 24px; }
                    .info { background: #f0f0f0; padding: 20px; margin: 20px 0; border-radius: 8px; }
                </style>
            </head>
            <body>
                <div class="success">✅ Сервер работает!</div>
                <div class="info">
                    <h3>Информация:</h3>
                    <p>🌐 URL: ${req.headers.host}${req.url}</p>
                    <p>🔧 Метод: ${req.method}</p>
                    <p>🕐 Время: ${new Date().toLocaleString()}</p>
                    <p>👤 User-Agent: ${req.headers['user-agent'] || 'Unknown'}</p>
                </div>
                <p><a href="/api/health">Health Check</a> | <a href="/api/test">Test API</a></p>
            </body>
            </html>
        `);
    } else if (req.url === '/api/health') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            status: 'ok',
            message: 'Simple test server is working!',
            timestamp: new Date().toISOString(),
            port: testPort,
            uptime: process.uptime()
        }));
    } else if (req.url === '/api/test') {
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({
            message: 'Test endpoint working!',
            method: req.method,
            url: req.url,
            headers: req.headers,
            timestamp: new Date().toISOString()
        }));
    } else {
        res.writeHead(404, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ error: 'Not Found' }));
    }
});

server.listen(testPort, '0.0.0.0', () => {
    console.log('🚀 SIMPLE SERVER STARTED!');
    console.log('=====================================');
    console.log(`🌐 Server running on: http://0.0.0.0:${testPort}`);
    console.log(`🌍 All interfaces: 0.0.0.0:${testPort}`);
    console.log(`⏰ Started: ${new Date().toLocaleString()}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET  /              - Main page`);
    console.log(`  GET  /api/health    - Health check`);
    console.log(`  GET  /api/test      - Test endpoint`);
    console.log('');
    console.log('✅ READY FOR CAPROVER!');
});

server.on('error', (err) => {
    console.error('❌ Server error:', err);
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${testPort} is already in use!`);
    }
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    server.close(() => {
        console.log('✅ Server closed');
        process.exit(0);
    });
});