import type { FileSystemTree } from '@webcontainer/api';
import { Terminal } from 'xterm';

import { webContainer } from '@/api/web-container';
import { Component, IFrameComponent } from '@/components';

import 'xterm/css/xterm.css';
import classes from './MainWebContainerPage.module.css';
import { ASYNC_RACE_LOADED } from '../messages.ts';

export class MainWebContainerPage extends Component<'div'> {
  // private readonly editor: TextAreaComponent;

  private readonly terminal: Component<'div'>;

  private readonly iframe: IFrameComponent;

  constructor() {
    super('div', { id: 'web-container-main-page' });
    // this.editor = new TextAreaComponent()
    //   .setTextContent('Express Server code...')
    //   .toggleClass(classes.serverCodeEditor);
    this.terminal = new Component('div').toggleClass(classes.terminalWrapper);
    this.iframe = new IFrameComponent().setSource('/loading.html').toggleClass(classes.appIframe);

    this.appendChildren([
      new Component('header')
        .setStyles({ textAlign: 'left' })
        .appendChildren([
          new Component('h1').appendChildren([
            new Component('span').toggleClass(classes.caption).setTextContent('WebContainers'),
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
      rows: 8,
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

    // TODO AR try code below inside ..setSource
    this.iframe.setStyles({
      visibility: 'hidden',
    });
    const { iframe } = this;
    this.iframe.setSource(`${url}/async-race.html`);
    window.addEventListener('message', (event) => {
      if (event.data === ASYNC_RACE_LOADED) {
        iframe.setStyles({
          visibility: 'visible',
        });
      }
    });
  }
}
