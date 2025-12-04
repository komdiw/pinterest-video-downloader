#!/usr/bin/env node

const yargs = require('yargs/yargs');
const { hideBin } = require('yargs/helpers');
const PinterestDownloader = require('./downloader');

const argv = yargs(hideBin(process.argv))
  .command('$0 <url>', 'Загрузить видео из Pinterest', (yargs) => {
    yargs.positional('url', {
      describe: 'URL видео из Pinterest',
      type: 'string'
    });
  })
  .option('output', {
    alias: 'o',
    describe: 'Директория для сохранения видео',
    type: 'string',
    default: './downloads'
  })
  .option('quality', {
    alias: 'q',
    describe: 'Качество видео (high/medium/low)',
    type: 'string',
    default: 'high'
  })
  .help()
  .argv;

async function main() {
  try {
    const { url, output, quality } = argv;

    if (!url) {
      console.error('❌ Ошибка: URL видео обязателен');
      process.exit(1);
    }

    console.log('🎬 Pinterest Video Downloader');
    console.log('================================');
    console.log(`📍 URL: ${url}`);
    console.log(`📁 Папка для сохранения: ${output}`);
    console.log(`🎥 Качество: ${quality}`);
    console.log('');

    const downloader = new PinterestDownloader(output);
    await downloader.download(url, quality);

  } catch (error) {
    console.error('❌ Ошибка:', error.message);
    process.exit(1);
  }
}

main();