import { type Uniforms, compileShader, createProgram, getUniforms } from './utils.ts';

function hashCode(s: string): number {
  if (s.length === 0) {
    return 0;
  }
  let hash = 0;
  for (let i = 0; i < s.length; i++) {
    // eslint-disable-next-line no-bitwise
    hash = (hash << 5) - hash + s.charCodeAt(i);
    // eslint-disable-next-line no-bitwise
    hash |= 0; // Convert to 32bit integer
  }
  return hash;
}

export class Material {
  private programs: Array<WebGLProgram> = [];

  private activeProgram: WebGLProgram | null = null;

  public uniforms: Uniforms = {};

  constructor(
    private gl: WebGLRenderingContext,
    private vertexShader: WebGLShader,
    private fragmentShaderSource: string,
  ) {}

  public setKeywords(keywords: Array<string>): void {
    let hash = 0;
    for (let i = 0; i < keywords.length; i++) {
      hash += hashCode(keywords[i]);
    }

    let program = this.programs[hash];
    if (program == null) {
      const fragmentShader = compileShader(this.gl, this.gl.FRAGMENT_SHADER, this.fragmentShaderSource, keywords);
      program = createProgram(this.gl, this.vertexShader, fragmentShader);
      this.programs[hash] = program;
    }

    if (program === this.activeProgram) {
      return;
    }

    this.uniforms = getUniforms(this.gl, program);
    this.activeProgram = program;
  }

  public bind(): void {
    this.gl.useProgram(this.activeProgram);
  }
}
