import { Dimension } from './Dimension';
import { Position } from './Position';
import { Rectangle } from './Rectangle';
import type { ScaleRatio, Size } from './types';

export const getElementBounds = <T extends Element>(element: T): Rectangle<T> => {
  const clientRect = element.getBoundingClientRect();
  return new Rectangle<T>(clientRect.left, clientRect.top, clientRect.width, clientRect.height, element);
};

export const getElementRelativeSize = <T extends HTMLElement>(element: T): Dimension<T> => {
  return new Dimension<T>(element.offsetWidth, element.offsetHeight, element);
};

export const getElementRelativeOffset = <T extends HTMLElement>(element: T): Position<T> => {
  return new Position<T>(element.offsetLeft, element.offsetTop, element);
};

export const getElementRelativeBounds = <T extends HTMLElement>(element: T): Rectangle<T> => {
  const pos = getElementRelativeOffset<T>(element);
  const size = getElementRelativeSize<T>(element);
  return new Rectangle(pos.x, pos.y, size.width, size.height, element);
};

export const toScaleRatio = (size: Size): ScaleRatio => {
  return { scaleX: size.width, scaleY: size.height };
};
