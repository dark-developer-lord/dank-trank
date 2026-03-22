import chalk from 'chalk';

const prefix = {
  info: chalk.blue('ℹ'),
  success: chalk.green('✔'),
  warn: chalk.yellow('⚠'),
  error: chalk.red('✖'),
  step: chalk.cyan('→'),
};

export const log = {
  info: (msg: string) => console.log(`${prefix.info} ${msg}`),
  success: (msg: string) => console.log(`${prefix.success} ${chalk.green(msg)}`),
  warn: (msg: string) => console.log(`${prefix.warn} ${chalk.yellow(msg)}`),
  error: (msg: string) => console.error(`${prefix.error} ${chalk.red(msg)}`),
  step: (msg: string) => console.log(`${prefix.step} ${msg}`),
  dim: (msg: string) => console.log(chalk.dim(`  ${msg}`)),
  break: () => console.log(),
  header: (msg: string) => {
    console.log();
    console.log(chalk.bold.underline(msg));
    console.log();
  },
  table: (rows: [string, string][]) => {
    const maxKey = Math.max(...rows.map(([k]) => k.length));
    for (const [key, value] of rows) {
      console.log(`  ${chalk.dim(key.padEnd(maxKey))}  ${value}`);
    }
  },
  banner: () => {
    console.log();
    console.log(chalk.bold.cyan('  ⚡ dank-trank'));
    console.log(chalk.dim('  From idea to live app in 1 command'));
    console.log();
  },
};
