import classes from './NeonText.module.css';
import type { ComponentCreateOptions } from '../Component.ts';
import { Component } from '../Component.ts';

export class NeonText extends Component<'div'> {
  private readonly textEffectWrapper: Component<'div'>;

  private readonly header: Component<'h1'>;

  constructor(options?: ComponentCreateOptions<'div'>) {
    super('div', options);

    this.textEffectWrapper = this.appendChild(new Component('div').toggleClass(classes.textEffectWrapper));
    this.header = this.textEffectWrapper.appendChild(new Component('h1').toggleClass(classes.text));
    this.appendChild(this.textEffectWrapper);
  }

  public override setTextContent(text: string): typeof this {
    this.header.setTextContent(text);
    return this;
  }

  public setAlternate(alternate: boolean): typeof this {
    this.toggleClass(classes.effect2, alternate);
    return this;
  }
}
