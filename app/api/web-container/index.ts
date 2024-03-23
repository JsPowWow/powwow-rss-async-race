import type { FileSystemTree, WebContainerProcess } from '@webcontainer/api';
import { WebContainer } from '@webcontainer/api';

import { assertIsNonNullable, noop } from '@/utils';

export const webContainer = new (class {
  private webContainerInstance?: WebContainer;

  private onLogMessage?: (log: string) => void;

  public async init(files: FileSystemTree, onLogMessage?: (log: string) => void): Promise<WebContainer> {
    this.onLogMessage = onLogMessage;
    this.webContainerInstance = await WebContainer.boot({ coep: 'credentialless' });
    await this.webContainerInstance.mount(files);
    return this.webContainerInstance;
  }

  public get instance(): WebContainer {
    assertIsNonNullable(this.webContainerInstance);
    return this.webContainerInstance;
  }

  public async installDependencies(): Promise<number> {
    const installProcess = await this.instance.spawn('npm', ['ci', '--no-audit']);
    this.writeProcessToTerminal(installProcess);
    return installProcess.exit;
  }

  public async startDevServer(): Promise<{ ready: boolean; url: string }> {
    // Run `npm run start` to start the server app
    const serverProcess = await this.instance.spawn('npm', ['run', 'start']);
    this.writeProcessToTerminal(serverProcess);

    return new Promise((resolve, reject) => {
      // Wait for `server-ready` event
      this.instance.on('server-ready', (_port, url) => {
        resolve({ ready: true, url });
      });
      this.instance.on('error', (error) => {
        reject(error);
      });
    });
  }

  public async writeToFile({ path, content }: { path: string; content: string }): Promise<void> {
    // i.e. '/index.js'
    await this.instance.fs.writeFile(path, content);
  }

  // public async startShell() {
  //   const shellProcess = await this.instance.spawn('jsh');
  //   await this.writeProcessToTerminal(shellProcess);
  //   return shellProcess;
  // }

  private writeProcessToTerminal(process: WebContainerProcess): void {
    if (this.onLogMessage) {
      process.output
        .pipeTo(
          new WritableStream({
            write: this.onLogMessage,
          }),
        )
        .catch(noop); // TODO AR logging
    }
  }
})();
