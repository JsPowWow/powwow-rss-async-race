import { Component, type ComponentCreateOptions } from '@/components';

import classes from './redSwitch.module.css';

export class RedSwitch extends Component<'label'> {
  private readonly button: Component<'div'>;

  constructor(options?: ComponentCreateOptions<'label'>) {
    super('label', options);
    this.toggleClass(classes.switch);
    this.appendChild(new Component('input').setAttribute('type', 'checkbox'));
    this.button = this.appendChild(new Component('div').toggleClass(classes.button));
    this.button.appendChildren([
      new Component('div').toggleClass(classes.light),
      new Component('div').toggleClass(classes.dots),
      new Component('div').toggleClass(classes.characters),
      new Component('div').toggleClass(classes.shine),
      new Component('div').toggleClass(classes.shadow),
    ]);
  }

  public setVariant(valiant: 'small'): typeof this {
    if (valiant === 'small') {
      this.toggleClass(classes.small);
      // this.button.toggleClass(classes.small);
    }

    return this;
  }
}
