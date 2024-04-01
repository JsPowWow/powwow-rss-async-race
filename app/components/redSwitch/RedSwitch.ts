import { Component, type ComponentCreateOptions } from '@/components';
import type { Emitter, EventKey, EventListener } from '@/event-emitter';
import { EventEmitter } from '@/event-emitter';

import classes from './RedSwitch.module.css';

type RedSwitchEventsMap = { onChange: boolean };

export class RedSwitch extends Component<'label'> implements Emitter<RedSwitchEventsMap> {
  private readonly button: Component<'div'>;

  public readonly input: Component<'input'>;

  private emitter: EventEmitter<{ onChange: boolean }>;

  constructor(options?: ComponentCreateOptions<'label'>) {
    super('label', options);
    this.emitter = new EventEmitter<RedSwitchEventsMap>();
    this.toggleClass(classes.switch);
    this.input = this.appendChild(new Component('input').setAttribute('type', 'checkbox'));
    this.button = this.appendChild(new Component('div').toggleClass(classes.button));
    this.button.appendChildren([
      new Component('div').toggleClass(classes.light),
      new Component('div').toggleClass(classes.dots),
      new Component('div').toggleClass(classes.characters),
      new Component('div').toggleClass(classes.shine),
      new Component('div').toggleClass(classes.shadow),
    ]);

    this.input.element.addEventListener('click', (event) => {
      const value = event && event.target && 'checked' in event.target ? !!event.target.checked : false;
      this.emitter.emit('onChange', value);
    });
  }

  public setVariant(valiant: 'small'): typeof this {
    if (valiant === 'small') {
      this.toggleClass(classes.small);
      // this.button.toggleClass(classes.small);
    }

    return this;
  }

  public setChecked = (checked: boolean): typeof this => {
    this.input.element.checked = checked;
    return this;
  };

  public emit<Event extends EventKey<RedSwitchEventsMap>>(eventName: Event, params: RedSwitchEventsMap[Event]): void {
    return this.emitter.emit(eventName, params);
  }

  public off<Event extends EventKey<RedSwitchEventsMap>>(
    eventName: Event,
    fn: EventListener<RedSwitchEventsMap[Event]>,
  ): void {
    return this.emitter.off(eventName, fn);
  }

  public on<Event extends EventKey<RedSwitchEventsMap>>(
    eventName: Event,
    fn: EventListener<RedSwitchEventsMap[Event]>,
  ): void {
    return this.emitter.on(eventName, fn);
  }
}
