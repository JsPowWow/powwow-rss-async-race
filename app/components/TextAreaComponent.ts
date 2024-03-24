import type { ComponentCreateOptions } from './Component';
import { Component } from './Component';

export class TextAreaComponent extends Component<'textarea'> {
  constructor(textAreaElement?: HTMLElementTagNameMap['textarea'], options?: ComponentCreateOptions<'textarea'>) {
    super(textAreaElement ?? 'textarea', options);
  }

  public setText(text: string): typeof this {
    this.nodeElement.value = text;
    return this;
  }
}
