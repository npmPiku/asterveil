import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

const compactSource = 'contracts/asterveil.compact';
const managedOutput = 'contracts/managed/asterveil';
const isWindows = os.platform() === 'win32';

function shellQuote(value) {
  return `'${value.replaceAll("'", "'\\''")}'`;
}

function windowsPathToWsl(value) {
  const normalized = value.replaceAll('\\', '/');
  const match = normalized.match(/^([A-Za-z]):\/(.*)$/);
  if (!match) throw new Error(`Cannot convert Windows path to WSL path: ${value}`);
  return `/mnt/${match[1].toLowerCase()}/${match[2]}`;
}

function compileContract() {
  if (!isWindows) {
    execFileSync('compact', ['compile', compactSource, managedOutput], { stdio: 'inherit' });
    return;
  }

  const projectPath = windowsPathToWsl(process.cwd());
  const distro = process.env.MIDNIGHT_WSL_DISTRO ?? 'Ubuntu';
  const user = process.env.MIDNIGHT_WSL_USER ?? 'deep_saha';
  const command = [
    `cd ${shellQuote(projectPath)}`,
    `/home/${user}/.local/bin/compact compile ${compactSource} ${managedOutput}`,
  ].join(' && ');

  execFileSync('wsl.exe', ['-d', distro, '-u', user, '--', 'bash', '-lc', command], {
    stdio: 'inherit',
  });
}

console.log(`[Asterveil] Compiling Compact contract: ${compactSource}`);

try {
  compileContract();
  const source = path.resolve(managedOutput);
  const destinations = [
    path.resolve('frontend', 'src', 'managed'),
    path.resolve('frontend', 'public', 'managed'),
  ];

  for (const destination of destinations) {
    fs.rmSync(destination, { recursive: true, force: true });
    fs.mkdirSync(destination, { recursive: true });
    fs.cpSync(source, destination, { recursive: true });
  }

  console.log('[Asterveil] Managed circuits and proving assets synced to frontend.');
} catch (error) {
  console.error('[Asterveil] Compilation failed:', error instanceof Error ? error.message : error);
  process.exitCode = 1;
}
