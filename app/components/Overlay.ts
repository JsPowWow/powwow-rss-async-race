import { Component, type ComponentCreateOptions } from './Component';

export class Overlay extends Component<'div'> {
  constructor(options?: ComponentCreateOptions<'div'> & { overlayElement?: HTMLElementTagNameMap['div'] }) {
    const { overlayElement } = options ?? {};
    super(overlayElement ?? 'div', options);
    this.setStyles({
      zIndex: '100',
      position: 'fixed',
      boxSizing: 'border-box',
      top: '0',
      left: '0',
      right: '0',
      bottom: '0',
      overflow: 'hidden',
      pointerEvents: 'none',
    });
  }
}
