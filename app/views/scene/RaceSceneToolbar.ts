import { P, match } from 'ts-pattern';

import { Component } from '@/components';

import classes from './RaceScene.module.css';

export type ActionCallback = (action: ToolbarAction) => void;
export type ToolbarAction = (typeof TOOLBAR_ACTIONS)[number];
const TOOLBAR_ACTIONS = ['reset', 'start', 'stop'] as const;

type ToolbarActions<T> = Partial<Record<ToolbarAction, T>>;

const enableButton = (btn: Component<'button'>) => {
  return (enable?: boolean): void => {
    btn.element.disabled = !enable ?? true;
  };
};

export class RaceSceneToolbar extends Component<'div'> {
  private readonly startBtn: Component<'button'>;

  private readonly stopBtn: Component<'button'>;

  private readonly resetBtn: Component<'button'>;

  private onActionCallback?: ActionCallback;

  constructor() {
    super('div');
    this.toggleClass(classes.sceneToolbar);
    this.startBtn = this.appendChild(new Component('button', { id: 'start-race-btn' }).setTextContent('Start'));
    this.stopBtn = this.appendChild(new Component('button', { id: 'stop-race-btn' }).setTextContent('Stop'));
    this.resetBtn = this.appendChild(new Component('button', { id: 'reset-race-btn' }).setTextContent('Reset'));

    this.startBtn.element.addEventListener('click', this.clickHandler('start'));
    this.stopBtn.element.addEventListener('click', this.clickHandler('stop'));
    this.resetBtn.element.addEventListener('click', this.clickHandler('reset'));
  }

  public onAction(cb: ActionCallback): typeof this {
    this.onActionCallback = cb;
    return this;
  }

  public setEnabled(buttons: ToolbarActions<boolean>): typeof this {
    Object.entries(buttons).forEach((entry) => {
      match(Object.fromEntries([entry]))
        .with({ start: P.select() }, enableButton(this.startBtn))
        .with({ stop: P.select() }, enableButton(this.stopBtn))
        .with({ reset: P.select() }, enableButton(this.resetBtn))
        .run();
    });

    return this;
  }

  private clickHandler =
    (btn: ToolbarAction) =>
    (_event: MouseEvent): void => {
      this.onActionCallback?.(btn);
    };
}
