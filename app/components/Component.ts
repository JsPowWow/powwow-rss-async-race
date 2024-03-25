import type { Dimension, Rectangle } from '@/geometry';
import { getElementRelativeBounds, getElementRelativeSize } from '@/geometry';
import type { ConstructorOf, Nullable } from '@/utils';
import { isHTMLElementTag, isInstanceOf, isSome } from '@/utils';

export type HTMLElementTag = keyof HTMLElementTagNameMap;
export type HTMLElementInstance = HTMLElementTagNameMap[HTMLElementTag];

export type ComponentCreateOptions<Tag extends HTMLElementTag> = {
  className?: string;
  text?: string;
  id?: string;
  element?: HTMLElementTagNameMap[Tag];
};

const elementToComponentMap: WeakMap<
  HTMLElementTagNameMap[HTMLElementTag] | ChildNode,
  Component<HTMLElementTag>
> = new WeakMap();

/**
 * Represents a component for creating and managing HTML elements with additional functionalities.
 * @class
 */
export class Component<Tag extends HTMLElementTag> {
  /**
   * Sets styles on the provided component's HTML node.
   * @param {HTMLElement} element - The component to set styles.
   * @param {CSSStyleDeclaration} styles - The styles to set.
   */
  public static setStyles(element: HTMLElement, styles: Partial<CSSStyleDeclaration>): void {
    Object.assign(element.style, { ...styles });
  }

  /**
   * @description Returns a Component instance associated with provided Element or undefined.
   */
  public static findComponentOf<C extends Component<HTMLElementTag>>(element: ChildNode): C | undefined {
    const c = elementToComponentMap.get(element);
    if (isSome<C>(c)) {
      return c;
    }
    return undefined;
  }

  /**
   * @description The HTML node element associated with the component.
   */
  protected readonly nodeElement: HTMLElementTagNameMap[Tag];

  /**
   * @description The ResizeObserver associated with the component.
   */
  private resizeObserver: Nullable<ResizeObserver>;

  /**
   * Creates a new Component.
   * @constructor
   * @param entity HTML element tag or element (default is 'div')
   * @param {Object=} options - The options for creating the component.
   * @param {string=} options.className - CSS class name for the element.
   * @param {string=} options.text - Text content of the element.
   * @param {string=} options.id - id of the element.
   */
  constructor(entity: Tag | HTMLElementTagNameMap[Tag], options?: ComponentCreateOptions<Tag>) {
    const { className = '', text = '', id = undefined } = options ?? {};

    if (!isHTMLElementTag<Tag>(entity) && isSome<HTMLElementInstance>(entity) && Component.findComponentOf(entity)) {
      throw new Error(`Component of ${String(entity)} already exists`);
    }
    const node = isHTMLElementTag<Tag>(entity) ? document.createElement<Tag>(entity) : entity;

    if (id) {
      node.id = id;
    }

    node.className = className;
    node.textContent = text;
    this.nodeElement = node;
    // TODO AR allow to append children here as well
    elementToComponentMap.set(this.nodeElement, this);
  }

  /**
   * Appends a child component to the current component.
   * @param {Component} child - The child component to be appended.
   */
  public appendChild<Child extends Component<HTMLElementTag>>(child: Child): Child {
    this.nodeElement.appendChild(child.nodeElement);
    return child;
  }

  /**
   * Appends an array of child components to the current component.
   * @param {Array<Component>} children - Array of child components to be appended.
   */
  public appendChildren(children: Array<Component<HTMLElementTag>>): typeof this {
    children.forEach((c) => {
      this.appendChild(c);
    });
    return this;
  }

  /**
   * Returns the HTML node style associated with the component.
   */
  public get style(): CSSStyleDeclaration {
    return this.nodeElement.style;
  }

  /**
   * Returns the HTML node associated with the component.
   */
  public get element(): HTMLElementTagNameMap[Tag] {
    return this.nodeElement;
  }

  /**
   * Returns a child component per provided index.
   */
  public getChildAt(index: number): Component<HTMLElementTag> | undefined {
    return this.getChildren()[index];
  }

  /**
   * Returns a component element relative bounds.
   */
  public getBounds(): Rectangle<typeof this.nodeElement> {
    return getElementRelativeBounds(this.nodeElement);
  }

  /**
   * Returns a component element relative size.
   */
  public getSize(): Dimension<typeof this.nodeElement> {
    return getElementRelativeSize(this.nodeElement);
  }

  /**
   * Returns an array of child components.
   */
  public getChildren(): Array<Component<HTMLElementTag>>;
  public getChildren<Child extends Component<HTMLElementTag>>(childType: ConstructorOf<Child>): Array<Child>;
  public getChildren<Child extends Component<HTMLElementTag>>(
    childType?: ConstructorOf<Child>,
  ): Component<HTMLElementTag>[] {
    const children = Array.from(this.nodeElement.childNodes)
      .map((elt) => Component.findComponentOf(elt))
      .filter((child): child is Component<HTMLElementTag> => isSome(child));

    if (isSome(childType)) {
      return children.filter((child) => isInstanceOf(childType, child));
    }
    return children;
  }

  /**
   * Returns length of the children.
   */
  public get childrenCount(): number {
    return this.nodeElement.childNodes.length;
  }

  /**
   * Sets the text content of the component.
   * @param {string} content - The text content to be set.
   */
  public setTextContent(content: string): typeof this {
    this.nodeElement.textContent = content;
    return this;
  }

  /**
   * Sets an attribute on the component's HTML node.
   * @param {string} attribute - The attribute to set.
   * @param {string} value - The value to set for the attribute.
   */
  public setAttribute(attribute: string, value: string): typeof this {
    this.nodeElement.setAttribute(attribute, value);
    return this;
  }

  /**
   * Sets styles on the component's HTML node.
   * @param {CSSStyleDeclaration} styles - The styles to set.
   */
  public setStyles(styles: Partial<CSSStyleDeclaration>): typeof this {
    Component.setStyles(this.nodeElement, styles);
    return this;
  }

  /**
   * Removes an attribute from the component's HTML node.
   * @param {string} attribute - The attribute to remove.
   */
  public removeAttribute(attribute: string): void {
    this.nodeElement.removeAttribute(attribute);
  }

  /**
   * Toggles the presence of a CSS class on the component's HTML node.
   */
  public toggleClass(className: string, force?: boolean): typeof this {
    if (className) {
      this.nodeElement.classList.toggle(className, force);
    }
    return this;
  }

  public observe(onResize: (entry: ResizeObserverEntry) => void): typeof this {
    this.unobserve();
    this.resizeObserver = new ResizeObserver((entries) => onResize(entries[0]));
    this.resizeObserver.observe(this.nodeElement);
    return this;
  }

  public unobserve(): typeof this {
    if (isSome(this.resizeObserver)) {
      this.resizeObserver.disconnect();
      this.resizeObserver = null;
    }
    return this;
  }

  /**
   * Destroys the current component and removes its HTML node from the DOM.
   */
  public destroy(): void {
    this.unobserve();
    this.destroyChildren();
    this.nodeElement.remove();
  }

  /**
   * Destroys all child components associated with the current component.
   */
  protected destroyChildren(): void {
    this.getChildren().forEach((child) => {
      child.destroy();
    });
  }
}
