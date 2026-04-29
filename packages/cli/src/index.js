#!/usr/bin/env node
import { Command } from 'commander'
import { scan }      from './commands/scan.js'
import { install }   from './commands/install.js'
import { uninstall } from './commands/uninstall.js'
import { list }      from './commands/list.js'
import { search }    from './commands/search.js'
import { showInfo }  from './commands/info.js'
import { doctor }    from './commands/doctor.js'
import { update }     from './commands/update.js'
import { configure }  from './commands/configure.js'
import { c }         from './ui.js'

const program = new Command()

program
  .name('cgcone')
  .description('Universal AI CLI extension manager')
  .version('0.3.4')
  .addHelpText('after', `
${c.dim('Examples:')}
  ${c.primary('cgcone scan')}                     detect AI CLIs on this machine
  ${c.primary('cgcone install filesystem-mcp')}   install to all detected CLIs
  ${c.primary('cgcone install filesystem-mcp --for claude-code')}
  ${c.primary('cgcone list')}                     show installed extensions
  ${c.primary('cgcone search web')}               search registry
  ${c.primary('cgcone doctor')}                   diagnose config issues
  `)

program
  .command('scan')
  .description('Detect AI CLI tools installed on this machine')
  .action(scan)

program
  .command('install <name>')
  .description('Install an extension to all detected AI CLIs')
  .option('--for <cli>', 'target a specific CLI (claude-code | gemini-cli | codex-cli)')
  .option('--dry-run', 'preview what would be written without modifying any config files')
  .action((name, opts) => install(name, opts))

program
  .command('uninstall <name>')
  .alias('remove')
  .description('Remove an extension from all detected AI CLIs')
  .option('--for <cli>', 'target a specific CLI')
  .action((name, opts) => uninstall(name, opts))

program
  .command('list')
  .alias('ls')
  .description('Show installed extensions and which CLIs they are in')
  .action(list)

program
  .command('search <query>')
  .description('Search the cgcone registry')
  .option('--type <type>', 'filter by install type: npm | uvx | docker | skill | plugin | remote')
  .option('--installable', 'only show extensions with a working install command')
  .option('--sort <field>', 'sort results: stars (default: relevance)')
  .action((query, opts) => search(query, opts))

program
  .command('info <name>')
  .description('Show details about an extension')
  .action(showInfo)

program
  .command('doctor')
  .description('Diagnose CLI installations and config issues')
  .action(doctor)

program
  .command('configure <name>')
  .alias('config')
  .description('Set or update API keys and env vars for an installed MCP')
  .option('--for <cli>', 'target a specific CLI')
  .action((name, opts) => configure(name, opts))

program
  .command('update [name]')
  .description('Update an installed extension (or all with --all)')
  .option('--all', 'update all installed extensions')
  .action((name, opts) => {
    if (!name && !opts.all) {
      console.error('Specify a name or use --all')
      process.exit(1)
    }
    update(name, opts)
  })

program.parse()
