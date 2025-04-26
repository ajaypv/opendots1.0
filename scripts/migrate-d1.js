#!/usr/bin/env node

/**
 * This script helps with migrating the D1 database
 * It can be run using:
 *   - Local: pnpm run migrate:d1:local
 *   - Remote: pnpm run migrate:d1:remote
 */

const fs = require('fs');
const path = require('path');
const { spawn } = require('child_process');
const { promisify } = require('util');

const readdir = promisify(fs.readdir);
const stat = promisify(fs.stat);

// Get command line arguments
const args = process.argv.slice(2);
const isLocal = args.includes('--local');
const dbName = args.find(arg => arg.startsWith('--db='))?.split('=')[1] || 'user_profiles';

async function getMigrationFiles() {
  const migrationsDir = path.join(process.cwd(), 'migrations');
  
  try {
    const files = await readdir(migrationsDir);
    const sqlFiles = files
      .filter(file => file.endsWith('.sql'))
      .sort((a, b) => {
        // Sort by file name to ensure migrations run in order
        const aNum = parseInt(a.split('_')[0], 10) || 0;
        const bNum = parseInt(b.split('_')[0], 10) || 0;
        return aNum - bNum;
      });
    
    return sqlFiles.map(file => path.join(migrationsDir, file));
  } catch (err) {
    console.error('Error reading migrations directory:', err);
    return [];
  }
}

async function runMigration(sqlFile, isLocal) {
  const command = 'npx';
  const args = [
    'wrangler',
    'd1',
    'execute',
    dbName,
    '--file',
    sqlFile,
  ];
  
  if (isLocal) {
    args.push('--local');
  }
  
  console.log(`Running migration: ${path.basename(sqlFile)}`);
  
  return new Promise((resolve, reject) => {
    const process = spawn(command, args, { stdio: 'inherit' });
    
    process.on('close', code => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Migration failed with exit code ${code}`));
      }
    });
    
    process.on('error', err => {
      reject(err);
    });
  });
}

async function main() {
  try {
    const migrationFiles = await getMigrationFiles();
    
    if (migrationFiles.length === 0) {
      console.log('No migration files found.');
      return;
    }
    
    console.log(`Found ${migrationFiles.length} migration files.`);
    console.log(`Running migrations on ${isLocal ? 'local' : 'remote'} D1 database...`);
    
    for (const file of migrationFiles) {
      await runMigration(file, isLocal);
    }
    
    console.log('Migrations completed successfully!');
  } catch (err) {
    console.error('Migration failed:', err);
    process.exit(1);
  }
}

main(); 