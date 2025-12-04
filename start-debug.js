#!/usr/bin/env node

import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('🔍 Starting debug server...');
console.log('📁 Current directory:', __dirname);
console.log('🌍 Environment variables:');
console.log('  PORT:', process.env.PORT);
console.log('  NODE_ENV:', process.env.NODE_ENV);
console.log('  DOWNLOADS_DIR:', process.env.DOWNLOADS_DIR);

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Статические файлы
app.use(express.static(path.join(__dirname, 'public')));

// Главная страница
app.get('/', (req, res) => {
    console.log('📄 Main page requested');
    res.sendFile(path.join(__dirname, 'public/index.html'));
});

// Health check endpoint
app.get('/api/health', (req, res) => {
    console.log('💓 Health check requested');
    res.json({
        status: 'ok',
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: '1.0.0',
        port: PORT,
        env: process.env.NODE_ENV || 'development'
    });
});

// Simple test endpoint
app.get('/api/test', (req, res) => {
    console.log('🧪 Test endpoint requested');
    res.json({
        message: 'Debug server is working!',
        timestamp: new Date().toISOString(),
        port: PORT
    });
});

// Запуск сервера
app.listen(PORT, '0.0.0.0', () => {
    console.log('🚀 Debug Server Started Successfully!');
    console.log('=====================================');
    console.log(`🌐 Server running on: http://0.0.0.0:${PORT}`);
    console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`📁 Static files: ${path.join(__dirname, 'public')}`);
    console.log(`⏰ Started: ${new Date().toLocaleString()}`);
    console.log('');
    console.log('Available endpoints:');
    console.log(`  GET  /          - Main page`);
    console.log(`  GET  /api/health - Health check`);
    console.log(`  GET  /api/test   - Test endpoint`);
    console.log('');
});

// Graceful shutdown
process.on('SIGTERM', () => {
    console.log('🛑 SIGTERM received, shutting down gracefully...');
    process.exit(0);
});

process.on('SIGINT', () => {
    console.log('🛑 SIGINT received, shutting down gracefully...');
    process.exit(0);
});

export default app;