#!/usr/bin/env node
import { Command } from 'commander';
import { createServer } from 'http';
import { readFile } from 'fs/promises';
import { existsSync } from 'fs';
import { URL } from 'url';
import { XMLBuilder } from 'fast-xml-parser';

const program = new Command();
program
  .requiredOption('-i, --input <path>', 'path to input JSON file')
  .requiredOption('-h, --host <host>', 'server host')
  .requiredOption('-p, --port <port>', 'server port', (v) => parseInt(v, 10));

program.parse(process.argv);
const opts = program.opts();

// Validate input file
if (!existsSync(opts.input)) {
  console.error('Cannot find input file');
  process.exit(1);
}

// Prepare XML builder
const builder = new XMLBuilder({
  ignoreAttributes: false,
  format: true,
  suppressEmptyNode: true
});

const server = createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${opts.host}:${opts.port}`);
    const humidityFlag = url.searchParams.get('humidity') === 'true';
    const minRainfallRaw = url.searchParams.get('min_rainfall');
    const minRainfall = (minRainfallRaw !== null && minRainfallRaw !== '') ? Number(minRainfallRaw) : null;
    if (minRainfallRaw !== null && Number.isNaN(minRainfall)) {
      res.writeHead(400, {'Content-Type': 'text/plain; charset=utf-8'});
      res.end('Bad request: min_rainfall must be a number');
      return;
    }

    // Read and parse JSON each request (as required)
    const content = await readFile(opts.input, 'utf-8');
    let data = JSON.parse(content);

    // Try to be robust to different top-level shapes (array or object with array field)
    if (!Array.isArray(data)) {
      const firstArrayKey = Object.keys(data).find(k => Array.isArray(data[k]));
      data = firstArrayKey ? data[firstArrayKey] : [];
    }

    // Normalize records to objects to avoid crashes on primitives
    const records = data.filter(r => r && typeof r === 'object');

    // Apply filters
    let filtered = records;
    if (minRainfall !== null) {
      filtered = filtered.filter(r => Number(r.Rainfall) > minRainfall);
    }

    // Map to output schema
    const xmlRecords = filtered.map(r => ({
      rainfall: (r.Rainfall ?? r.rainfall ?? r.rain ?? 0),
      pressure3pm: (r.Pressure3pm ?? r.pressure3pm ?? r.pressure ?? null),
      // include humidity if requested
      ...(humidityFlag ? { humidity: (r.Humidity3pm ?? r.humidity3pm ?? r.humidity ?? null) } : {})
    }));

    const xmlObj = { weather_data: { record: xmlRecords } };
    const xml = builder.build(xmlObj);

    res.writeHead(200, {'Content-Type': 'application/xml; charset=utf-8'});
    res.end(xml);
  } catch (err) {
    console.error(err);
    res.writeHead(500, {'Content-Type': 'text/plain; charset=utf-8'});
    res.end('Internal server error');
  }
});

server.listen(opts.port, opts.host, () => {
  console.log(`Server listening at http://${opts.host}:${opts.port}`);
});