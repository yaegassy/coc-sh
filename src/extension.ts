import path from 'path'
import fs from 'fs'
import pkgDir from 'pkg-dir'
import { TransportKind, ExtensionContext, LanguageClient, ServerOptions, commands, workspace, services, LanguageClientOptions } from 'coc.nvim'

interface ShConfig {
  enable: boolean
  commandPath: string
  highlightParsingErrors: boolean
  explainshellEndpoint: string
  globPattern: string
}


export async function activate(context: ExtensionContext): Promise<void> {
  const config = workspace.getConfiguration().get('sh', {}) as ShConfig
  if (config.enable === false) {
    return
  }

  // TODO add config options:

  const serverOptions: ServerOptions = {
    command: (config.commandPath || await serverBin()),
    args: ['start'],
    transport: TransportKind.stdio,
    options: {
      env: {
        // => https://github.com/bash-lsp/bash-language-server/blob/master/server/src/config.ts
        EXPLAINSHELL_ENDPOINT: config.explainshellEndpoint,
        GLOB_PATTERN: config.globPattern,
        HIGHLIGHT_PARSING_ERRORS: config.highlightParsingErrors.toString()
      }
    }
  }

  const clientOptions: LanguageClientOptions = {
    documentSelector: ['sh']
  }

  const client = new LanguageClient('sh', 'bash-language-server', serverOptions, clientOptions)

  context.subscriptions.push(
    services.registLanguageClient(client),
    commands.registerCommand("sh.version", async () => {
      const rootDir = await pkgDir(__dirname)
      const { version } = JSON.parse(fs.readFileSync(path.resolve(rootDir, 'package.json'), 'utf-8'))

      workspace.showMessage(`Version: ${version} [node: ${process.versions.node}]`, 'more')
    })
  )
}

async function serverBin(): Promise<string> {
  const rootDir = await pkgDir(__dirname)
  let bin = path.join(rootDir, 'node_modules', 'bash-language-server', 'bin', 'main.js')
  try {
    bin = fs.realpathSync(bin)
  } catch (e) {
    // ignore
  }

  return bin
}

