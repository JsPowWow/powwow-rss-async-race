import './normalize.css';
import './style.css';
import { assertIsNonNullable, noop } from '@/utils';
import { MainPageStandalone, MainWebContainerPage } from '@/view/main';

const app = document.querySelector('#app');
assertIsNonNullable(app);
const envMode = import.meta.env.MODE;
const params = new URLSearchParams(window.location.search);

const isDevMode = envMode === 'development';
const isWebContainerMode = params.has('mode', 'webcontainer');
const isStandaloneMode = params.has('mode', 'standalone');

window.addEventListener('load', () => {
  if ((isDevMode && !isWebContainerMode) || isStandaloneMode) {
    app.append(new MainPageStandalone().element);
  } else {
    const webContainerPage = new MainWebContainerPage();
    app.append(webContainerPage.element);
    webContainerPage.init().catch(noop);
  }
});
