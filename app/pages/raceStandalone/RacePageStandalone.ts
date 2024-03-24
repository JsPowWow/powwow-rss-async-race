import { Component, NeonText } from '@/components';
import { RaceScene } from '@/views/race-scene';

import classes from './RacePageStandalone.module.css';

export class RacePageStandalone extends Component<'div'> {
  private readonly scene: RaceScene;

  constructor(root: HTMLElement) {
    super('div');
    this.toggleClass(classes.racePageContainer);
    this.scene = new RaceScene();

    root.append(this.element);
  }

  public draw(): typeof this {
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~
    const apiGarageBtn = new Component('button', { id: 'api-garage-btn' }).setTextContent('/garage');
    const apiStartSecondBtn = new Component('button', { id: 'api-start-engine-btn' }).setTextContent('/engine');
    apiGarageBtn.element.addEventListener('click', () => {
      fetch('http://localhost:3000/garage', { method: 'GET' })
        .then((res) => res.json())
        .then((res) => {
          console.log(res);
          if (Array.isArray(res)) {
            res.forEach((c: { name: string; color: string }) => {
              const car = new Component('div');
              car.setTextContent(`${c.name}`);
              car.style.color = c.color;
              this.appendChild(car);
            });
          }
        });
    });
    apiStartSecondBtn.element.addEventListener('click', () => {
      console.log('Check start 2nd Engine Api...');
      fetch('http://localhost:3000/engine?id=2&status=started', { method: 'PATCH' })
        .then((res) => res.json())
        .then((res) => {
          console.log(res);
        });
    });
    // ~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~~

    this.appendChildren([
      // new Component('header').appendChildren([
      //   new Component('h1').appendChildren([
      //     new Component('span').toggleClass(classes.caption).setTextContent('Async Race'),
      //   ]),
      // ]),
      new NeonText().setTextContent('Async race'),
      new Component('div').appendChildren([apiGarageBtn, apiStartSecondBtn]),
      this.scene,
    ]);
    this.scene.draw();
    return this;
  }
}
