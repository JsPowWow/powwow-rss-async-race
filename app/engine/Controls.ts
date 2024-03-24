export type ControlType = 'SELF' | 'KEYS';

export class Controls {
  private left: boolean;

  private right: boolean;

  private forward: boolean;

  private reverse: boolean;

  constructor(type: ControlType) {
    this.forward = false;
    this.left = false;
    this.right = false;
    this.reverse = false;

    switch (type) {
      case 'KEYS':
        this.addKeyboardListeners();
        break;
      case 'SELF':
        this.forward = true;
        break;
      default:
      // do nothing
    }
  }

  public get moveForward(): boolean {
    return this.forward;
  }

  public get moveReverse(): boolean {
    return this.reverse;
  }

  public get moveLeft(): boolean {
    return this.left;
  }

  public get moveRight(): boolean {
    return this.right;
  }

  private addKeyboardListeners(): void {
    document.onkeydown = (event): void => {
      switch (event.key) {
        case 'ArrowLeft':
          this.left = true;
          break;
        case 'ArrowRight':
          this.right = true;
          break;
        case 'ArrowUp':
          this.forward = true;
          break;
        case 'ArrowDown':
          this.reverse = true;
          break;
        default:
        // do nothing
      }
    };
    document.onkeyup = (event): void => {
      switch (event.key) {
        case 'ArrowLeft':
          this.left = false;
          break;
        case 'ArrowRight':
          this.right = false;
          break;
        case 'ArrowUp':
          this.forward = false;
          break;
        case 'ArrowDown':
          this.reverse = false;
          break;
        default:
        // do nothing
      }
    };
  }
}
