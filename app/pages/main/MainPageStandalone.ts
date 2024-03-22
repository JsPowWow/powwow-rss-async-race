import { Component } from '@/components';

import classes from './MainPageStandalone.module.css';

export class MainPageStandalone extends Component<'main'> {
  constructor() {
    super('main', { id: 'main=page' });
    this.appendChildren([
      new Component('header').appendChildren([
        new Component('h1').appendChildren([
          new Component('span').toggleClass(classes.caption).setTextContent('Async Race'),
        ]),
      ]),
    ]);
  }
}
