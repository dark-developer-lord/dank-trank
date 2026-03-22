import { execSync } from 'node:child_process';
import chalk from 'chalk';
import { log } from '../utils/logger.js';

interface CheckResult {
  name: string;
  ok: boolean;
  version?: string;
  message?: string;
}

function checkCommand(name: string, cmd: string): CheckResult {
  try {
    const version = execSync(cmd, { encoding: 'utf-8', timeout: 5000 }).trim();
    return { name, ok: true, version };
  } catch {
    return { name, ok: false, message: `${name} not found. Please install it.` };
  }
}

export async function doctorCommand(): Promise<void> {
  log.banner();
  log.header('Doctor — Environment Check');

  const checks: CheckResult[] = [
    checkCommand('Node.js', 'node --version'),
    checkCommand('Docker', 'docker --version'),
    checkCommand('Docker Compose', 'docker compose version'),
    checkCommand('Git', 'git --version'),
  ];

  let allOk = true;

  for (const check of checks) {
    if (check.ok) {
      log.success(`${check.name}: ${chalk.dim(check.version)}`);
    } else {
      log.error(`${check.name}: ${check.message}`);
      allOk = false;
    }
  }

  log.break();

  if (allOk) {
    log.success('All checks passed! Your environment is ready.');
  } else {
    log.warn('Some checks failed. Install missing tools before proceeding.');
  }

  log.break();
}
