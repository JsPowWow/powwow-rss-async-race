import { Component } from '@/components';

import { RedSwitch } from '../../../components/redSwitch/RedSwitch.ts';
import type { Traffic } from '../models/Traffic.ts';
import type { TrafficCar } from '../models/TrafficCar.ts';

export class CarsToolbar extends Component<'div'> {
  constructor() {
    super('div');
  }

  public draw(traffic: Traffic): typeof this {
    this.destroyChildren();
    traffic.cars().forEach((_c: TrafficCar) => {
      const toggler = this.appendChild(new RedSwitch().setVariant('small'));
      toggler.on('onChange', (_value) => {
        // TODO
      });
    });
    return this;
  }
}
