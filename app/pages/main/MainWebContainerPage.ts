import type { FileSystemTree } from '@webcontainer/api';
import { Terminal } from 'xterm';

import { webContainer } from '@/api/web-container';
import { Component, IFrameComponent } from '@/components';

import 'xterm/css/xterm.css';
import classes from './MainWebContainerPage.module.css';

export class MainWebContainerPage extends Component<'main'> {
  // private readonly editor: TextAreaComponent;

  private readonly terminal: Component<'div'>;

  private readonly iframe: IFrameComponent;

  constructor() {
    super('main', { id: 'main-page' });
    // this.editor = new TextAreaComponent()
    //   .setTextContent('Express Server code...')
    //   .toggleClass(classes.serverCodeEditor);
    this.terminal = new Component('div', { id: 'terminal-wrapper' });
    this.iframe = new IFrameComponent().setSource('/loading.html').toggleClass(classes.appIframe);

    this.appendChildren([
      new Component('header')
        .setStyles({ textAlign: 'left' })
        .appendChildren([
          new Component('h1').appendChildren([
            new Component('span').toggleClass(classes.caption).setTextContent('WebContainers...'),
          ]),
        ]),
      new Component('div').toggleClass(classes.appContainer).appendChildren([
        // new Component('div').toggleClass(classes.serverCodeWrapper).appendChildren([this.editor]),
        new Component('div').toggleClass(classes.raceAppContainer).appendChildren([this.iframe]),
      ]),
      this.terminal,
    ]);
  }

  public async init(files: FileSystemTree): Promise<void> {
    // this.editor.setText(files['index.js'].file.contents);
    // this.editor.element.addEventListener('input', (e) => {
    //   if (e.currentTarget && 'value' in e.currentTarget) {
    //     webContainer.writeToFile({ path: '/index.js', content: String(e.currentTarget.value) }).catch(noop);
    //   }
    // });
    const terminal = new Terminal({
      convertEol: true,
    });

    terminal.open(this.terminal.element);
    // Call only once
    await webContainer.init(files, (log) => terminal.write(log));

    terminal.write('\nInstall Dependencies...\n');
    const exitCode = await webContainer.installDependencies();

    if (exitCode !== 0) {
      throw new Error('Installation failed');
    }
    terminal.write('\nStarting Dev Server...\n');
    const { url } = await webContainer.startDevServer();

    this.iframe.setSource(`${url}/race.html`);
  }
}
