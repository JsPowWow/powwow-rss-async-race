import { P, match } from 'ts-pattern';

import { Component } from '@/components';

import classes from '../RaceScene.module.css';

export type ActionCallback = (action: ToolbarAction) => void;
export type ToolbarAction = (typeof TOOLBAR_ACTIONS)[number];
const TOOLBAR_ACTIONS = ['reset', 'start'] as const;

type ToolbarActions<T> = Partial<Record<ToolbarAction, T>>;

const enableButton = (btn: Component<'button'>) => {
  return (enable?: boolean): void => {
    btn.element.disabled = !enable;
  };
};

export class RaceSceneToolbar extends Component<'div'> {
  private readonly startBtn: Component<'button'>;

  private readonly resetBtn: Component<'button'>;

  private onActionCallback?: ActionCallback;

  constructor() {
    super('div');
    this.toggleClass(classes.sceneToolbar);
    this.startBtn = this.appendChild(new Component('button', { id: 'start-race-btn' }).setTextContent('Start'));
    this.resetBtn = this.appendChild(new Component('button', { id: 'reset-race-btn' }).setTextContent('Reset'));

    this.startBtn.element.addEventListener('click', this.onButtonClickHandler('start'));
    this.resetBtn.element.addEventListener('click', this.onButtonClickHandler('reset'));
    this.setEnabled({ reset: true, start: false });
  }

  public onAction(cb: ActionCallback): typeof this {
    this.onActionCallback = cb;
    return this;
  }

  public setEnabled(buttons: ToolbarActions<boolean>): typeof this {
    Object.entries(buttons).forEach((entry) => {
      match(Object.fromEntries([entry]))
        .with({ start: P.select() }, enableButton(this.startBtn))
        .with({ reset: P.select() }, enableButton(this.resetBtn))
        .run();
    });

    return this;
  }

  private onButtonClickHandler =
    (btn: ToolbarAction) =>
    (_event: MouseEvent): void => {
      this.onActionCallback?.(btn);
    };
}
