import './style.css';
import { Terminal } from 'xterm';

import { files } from './files.js';
import 'xterm/css/xterm.css';
import { webContainer } from './src/api/webContainer/index.ts';

window.addEventListener('load', async () => {
  textareaEl.value = files['index.js'].file.contents;
  textareaEl.addEventListener('input', (e) => {
    webContainer.writeToFile({ path: '/index.js', content: e.currentTarget.value });
  });

  const terminal = new Terminal({
    convertEol: true,
  });
  terminal.open(terminalEl);

  // Call only once
  await webContainer.init(files, terminal);
  terminal.write('\nInstall Dependencies...\n');
  const exitCode = await webContainer.installDependencies();

  if (exitCode !== 0) {
    throw new Error('Installation failed');
  }
  terminal.write('\nStarting Dev Server...\n');
  const { ready, url } = await webContainer.startDevServer();

  iframeEl.src = url;
});

document.querySelector('#app').innerHTML = `
  <div class="container">
    <div class="editor">
      <textarea>I am a textarea</textarea>
    </div>
    <div class="preview">
      <iframe src="/loading.html"></iframe>
    </div>
  </div>
  <div class="terminal"></div>
`;

/** @type {HTMLIFrameElement | null} */
const iframeEl = document.querySelector('iframe');

/** @type {HTMLTextAreaElement | null} */
const textareaEl = document.querySelector('textarea');

/** @type {HTMLTextAreaElement | null} */
const terminalEl = document.querySelector('.terminal');
