import { Component } from '@/components';

import { RedSwitch } from '../../../components/redSwitch/RedSwitch.ts';
import type { Traffic } from '../models/Traffic.ts';
import type { TrafficCar } from '../models/TrafficCar.ts';

export type CarActionCallback = (action: CarToolbarAction) => void;
export type CarToolbarAction = { car: TrafficCar; action: 'start' | 'stop' };

export class CarsToolbar extends Component<'div'> {
  private onCarActionCallback?: CarActionCallback;

  constructor() {
    super('div');
  }

  public draw(traffic: Traffic): typeof this {
    this.destroyChildren();
    traffic.cars().forEach((car: TrafficCar) => {
      const toggler = this.appendChild(new RedSwitch().setVariant('small'));
      toggler.on('onChange', (isToggle) => {
        if (this.onCarActionCallback) {
          this.onCarActionCallback({ car, action: isToggle ? 'start' : 'stop' });
        }
      });
      car.stateClient.onStateLeave('drive', (_e) => {
        toggler.setChecked(false);
      });
    });
    return this;
  }

  public onAction(cb: CarActionCallback): typeof this {
    this.onCarActionCallback = cb;
    return this;
  }
}
