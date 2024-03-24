import { RacePageStandalone } from '@/pages/race';
import { assertIsNonNullable } from '@/utils';

import { ASYNC_RACE_LOADED } from './app/pages/messages.ts';

((): void => {
  window.onload = (): void => {
    window.parent.postMessage(ASYNC_RACE_LOADED, '*');
  };
})();

const root = document.getElementById('root');
assertIsNonNullable(root);
new RacePageStandalone(root).draw();
