import './normalize.css';
import './style.css';
import logger from '@/logger';
import { assertIsNonNullable, noop } from '@/utils';
import { MainWebContainerPage } from '@/view/main';
import { RacePageStandalone } from '@/view/race';

const envMode = import.meta.env.MODE;
const params = new URLSearchParams(window.location.search);

const isDevMode = envMode === 'development';
const isWebContainerMode = params.has('mode', 'webcontainer');
const isStandaloneMode = params.has('mode', 'standalone');

const app = document.querySelector('#app');
assertIsNonNullable(app);

window.addEventListener('load', () => {
  if ((isDevMode && !isWebContainerMode) || isStandaloneMode) {
    app.append(new RacePageStandalone().element);
  } else {
    const webContainerPage = new MainWebContainerPage();
    app.append(webContainerPage.element);
    import('./container/files')
      .then((module) => {
        webContainerPage.init(module.files).catch(noop);
      })
      // eslint-disable-next-line @typescript-eslint/no-unsafe-argument,@typescript-eslint/no-unsafe-member-access
      .catch(logger.error);
    // TODO AR use Logger of such case(s)
  }
});
