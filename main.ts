import './normalize.css';
import './style.css';
import logger from '@/logger';
import { MainWebContainerPage } from '@/pages/main';
import { RacePageStandalone } from '@/pages/race';
import { assertIsInstanceOf, noop } from '@/utils';

const envMode = import.meta.env.MODE;
const params = new URLSearchParams(window.location.search);

const isDevMode = envMode === 'development';
const isWebContainerMode = params.has('mode', 'webcontainer');
const isStandaloneMode = params.has('mode', 'standalone');

const app = document.querySelector('#app');
assertIsInstanceOf(HTMLElement, app);

window.addEventListener('load', () => {
  if ((isDevMode && !isWebContainerMode) || isStandaloneMode) {
    new RacePageStandalone(app).draw();
  } else {
    const webContainerPage = new MainWebContainerPage();
    app.append(webContainerPage.element);
    import('./container/files')
      .then((module) => {
        webContainerPage.init(module.files).catch(noop);
      })
      .catch((e) => logger.error(e));
    // TODO AR use Logger of such case(s)
  }
});
