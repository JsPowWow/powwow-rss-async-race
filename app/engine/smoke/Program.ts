import type { Uniforms } from './utils.ts';
import { createProgram, getUniforms } from './utils.ts';

export class Program {
  private gl: WebGLRenderingContext;

  public program: WebGLProgram;

  public uniforms: Uniforms;

  constructor(gl: WebGLRenderingContext, vertexShader: WebGLShader, fragmentShader: WebGLShader) {
    this.gl = gl;
    this.uniforms = {};
    this.program = createProgram(gl, vertexShader, fragmentShader);
    this.uniforms = getUniforms(gl, this.program);
  }

  public bind(): void {
    this.gl.useProgram(this.program);
  }
}
