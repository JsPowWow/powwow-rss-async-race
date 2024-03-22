import type { ComponentCreateOptions } from './Component';
import { Component } from './Component';

export class IFrameComponent extends Component<'iframe'> {
  constructor(iframeElement?: HTMLElementTagNameMap['iframe'], options?: ComponentCreateOptions<'iframe'>) {
    super(iframeElement ?? 'iframe', options);
  }

  public setSource(src: string): typeof this {
    this.nodeElement.src = src;
    return this;
  }
}
