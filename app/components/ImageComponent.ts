import { Dimension, type ScaleRatio, toScaleRatio } from '@/geometry';

import type { ComponentCreateOptions } from './Component';
import { Component } from './Component';

export class ImageComponent extends Component<'img'> {
  constructor(imageElement?: HTMLElementTagNameMap['img'], options?: ComponentCreateOptions<'img'>) {
    super(imageElement ?? 'img', options);
  }

  public getScaleRatio(): ScaleRatio {
    return toScaleRatio(
      new Dimension(this.nodeElement.naturalWidth, this.nodeElement.naturalHeight).scaleBy(
        this.nodeElement.width,
        this.nodeElement.height,
      ),
    );
  }
}
