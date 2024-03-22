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
    super('main', { id: 'main=page' });
    // this.editor = new TextAreaComponent()
    //   .setTextContent('Express Server code...')
    //   .toggleClass(classes.serverCodeEditor);
    this.terminal = new Component('div', { id: 'terminal-wrapper' });
    this.iframe = new IFrameComponent().setSource('/loading.html');

    this.appendChildren([
      new Component('header').appendChildren([
        new Component('h1').appendChildren([
          new Component('span').toggleClass(classes.caption).setTextContent('Async Race via WebContainers In Action'),
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
    await webContainer.init(files, terminal);

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
// app.innerHTML = `
//   <header>
//     <h1><span class="wc">Async Race via WebContainers In Action</span></h1>
//   </header>
//   <div class="container">
//     <div class="editor">
//       <textarea>I am a textarea</textarea>
//     </div>
//     <div class="preview">
//       <iframe src="/loading.html"></iframe>
//     </div>
//   </div>
//   <div class="terminal"></div>
// `;
//
// const iframeEl = document.querySelector('iframe');

// const textareaEl = document.querySelector('textarea');

// const terminalEl = document.querySelector<HTMLElement>('.terminal');

// standalone
