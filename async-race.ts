import { assertIsNonNullable } from '@/utils';

import { ASYNC_RACE_LOADED } from './app/pages/messages.ts';

import { RacePageStandalone } from '@/view/race';

(function () {
  window.onload = function () {
    window.parent.postMessage(ASYNC_RACE_LOADED, '*');
  };
})();

const root = document.getElementById('root');
assertIsNonNullable(root);
root.append(new RacePageStandalone().element);
