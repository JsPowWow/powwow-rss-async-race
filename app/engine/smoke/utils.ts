import type { Point, Size } from '@/geometry';
import type { Nullable } from '@/utils';
import { assertIsInstanceOf, assertIsNonNullable, getLogger, isInstanceOf } from '@/utils';

const logger = getLogger('WebGL::Smoke');

const getWebGl2Ctx = (
  gl: WebGL2RenderingContext,
): {
  supportLinearFiltering: OES_texture_float_linear | null;
  halfFloatTexType: number;
} => {
  gl.getExtension('EXT_color_buffer_float');
  const supportLinearFiltering = gl.getExtension('OES_texture_float_linear');
  const halfFloatTexType = gl.HALF_FLOAT;
  return {
    supportLinearFiltering,
    halfFloatTexType,
  };
};

const getWebGlCtx = (
  gl: WebGLRenderingContext,
): { supportLinearFiltering: OES_texture_half_float_linear | null; halfFloatTexType: number } => {
  const halfFloat = gl.getExtension('OES_texture_half_float');
  const supportLinearFiltering = gl.getExtension('OES_texture_half_float_linear');
  assertIsNonNullable(halfFloat);
  const halfFloatTexType = halfFloat.HALF_FLOAT_OES;
  return { supportLinearFiltering, halfFloatTexType };
};

type InternalFormat =
  | WebGL2RenderingContext['R16F']
  | WebGL2RenderingContext['RG16F']
  | WebGL2RenderingContext['RGBA16F']
  | WebGLRenderingContext['RGBA'];

function supportRenderTextureFormat(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  internalFormat: InternalFormat,
  format: number,
  type: number,
): boolean {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, 4, 4, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);

  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  return status === gl.FRAMEBUFFER_COMPLETE;
}

type FormatOutput = { internalFormat: InternalFormat; format: number } | null;
function getSupportedFormat(
  gl: WebGL2RenderingContext | WebGLRenderingContext,
  internalFormat: InternalFormat,
  format: number,
  type: number,
): FormatOutput {
  if (isInstanceOf(WebGL2RenderingContext, gl) && !supportRenderTextureFormat(gl, internalFormat, format, type)) {
    switch (internalFormat) {
      case gl.R16F:
        return getSupportedFormat(gl, gl.RG16F, gl.RG, type);
      case gl.RG16F:
        return getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, type);
      default:
        return null;
    }
  }

  return {
    internalFormat,
    format,
  };
}

export type WebGLContextOutput = {
  gl: WebGL2RenderingContext | WebGLRenderingContext;
  ext: {
    formatRGBA: FormatOutput;
    formatRG: FormatOutput;
    formatR: FormatOutput;
    halfFloatTexType: number;
    supportLinearFiltering: OES_texture_float_linear | null;
  };
};
export function getWebGLContext(canvas: HTMLCanvasElement): WebGLContextOutput {
  const params = { alpha: true, depth: false, stencil: false, antialias: false, preserveDrawingBuffer: false };

  let gl = canvas.getContext('webgl2', params);
  const isWebGL2 = !!gl;
  if (!isWebGL2) {
    gl = canvas.getContext('webgl', params) || canvas.getContext('experimental-webgl', params);
  }

  if (isWebGL2) {
    assertIsInstanceOf(WebGL2RenderingContext, gl);
    const { halfFloatTexType, supportLinearFiltering } = getWebGl2Ctx(gl);
    const formatRGBA = getSupportedFormat(gl, gl.RGBA16F, gl.RGBA, halfFloatTexType);
    const formatRG = getSupportedFormat(gl, gl.RG16F, gl.RG, halfFloatTexType);
    const formatR = getSupportedFormat(gl, gl.R16F, gl.RED, halfFloatTexType);
    gl.clearColor(0.0, 0.0, 0.0, 1.0);
    return {
      gl,
      ext: {
        formatRGBA,
        formatRG,
        formatR,
        halfFloatTexType,
        supportLinearFiltering,
      },
    };
  }
  assertIsInstanceOf(WebGLRenderingContext, gl);
  const { halfFloatTexType, supportLinearFiltering } = getWebGlCtx(gl);
  const formatRGBA = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
  const formatRG = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
  const formatR = getSupportedFormat(gl, gl.RGBA, gl.RGBA, halfFloatTexType);
  gl.clearColor(0.0, 0.0, 0.0, 1.0);
  return {
    gl,
    ext: {
      formatRGBA,
      formatRG,
      formatR,
      halfFloatTexType,
      supportLinearFiltering,
    },
  };
}

export function isMobile(): boolean {
  return /Mobi|Android/i.test(navigator.userAgent);
}

export function addKeywords(source: string, keywords?: Nullable<Array<string>>): string {
  if (!keywords) {
    return source;
  }
  let keywordsString = '';
  keywords.forEach((keyword) => {
    keywordsString += `#define ${keyword}\n`;
  });
  return keywordsString + source;
}

export function compileShader(
  gl: WebGLRenderingContext,
  type: number,
  source: string,
  keywords?: Nullable<Array<string>>,
): WebGLShader {
  const shader = gl.createShader(type);
  assertIsNonNullable(shader);
  gl.shaderSource(shader, addKeywords(source, keywords));
  gl.compileShader(shader);

  if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
    logger.warn('getShaderParameter::COMPILE_STATUS', gl.getShaderInfoLog(shader));
  }

  return shader;
}

export type Uniforms = Record<string, WebGLUniformLocation | null>;
export function getUniforms(gl: WebGLRenderingContext, program: WebGLProgram): Uniforms {
  const uniforms: Uniforms = {};
  // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
  const uniformCount: number = gl.getProgramParameter(program, gl.ACTIVE_UNIFORMS);
  for (let i = 0; i < uniformCount; i++) {
    const activeUniform = gl.getActiveUniform(program, i);
    if (activeUniform) {
      const uniformName = activeUniform.name;
      uniforms[uniformName] = gl.getUniformLocation(program, uniformName);
    }
  }
  return uniforms;
}

export function createProgram(
  gl: WebGLRenderingContext,
  vertexShader: WebGLShader,
  fragmentShader: WebGLShader,
): WebGLProgram {
  const program = gl.createProgram();
  assertIsNonNullable(program);
  gl.attachShader(program, vertexShader);
  gl.attachShader(program, fragmentShader);
  gl.linkProgram(program);

  if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
    logger.warn('program::LINK_STATUS', gl.getProgramInfoLog(program));
  }

  return program;
}

export type TextureData = { texture: WebGLTexture | null; width: number; height: number; attach(id: number): number };
export function createTextureAsync(gl: WebGLRenderingContext, url: string): TextureData {
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
  gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, 1, 1, 0, gl.RGB, gl.UNSIGNED_BYTE, new Uint8Array([255, 255, 255]));

  const obj = {
    texture,
    width: 1,
    height: 1,
    attach(id: number): number {
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return id;
    },
  };

  const image = new Image();
  image.onload = (): void => {
    obj.width = image.width;
    obj.height = image.height;
    gl.bindTexture(gl.TEXTURE_2D, texture);
    gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGB, gl.RGB, gl.UNSIGNED_BYTE, image);
  };
  image.src = url;

  return obj;
}

export function scaleByPixelRatio(input: number): number {
  const pixelRatio = window.devicePixelRatio || 1;
  return Math.floor(input * pixelRatio);
}

export function getTextureScale(texture: Size, width: number, height: number): Point {
  return {
    x: width / texture.width,
    y: height / texture.height,
  };
}

export function wrap(value: number, min: number, max: number): number {
  const range = max - min;
  if (range === 0) {
    return min;
  }
  return ((value - min) % range) + min;
}

export function getResolution(gl: WebGLRenderingContext, resolution: number): Size {
  let aspectRatio = gl.drawingBufferWidth / gl.drawingBufferHeight;
  if (aspectRatio < 1) {
    aspectRatio = 1.0 / aspectRatio;
  }

  const min = Math.round(resolution);
  const max = Math.round(resolution * aspectRatio);

  if (gl.drawingBufferWidth > gl.drawingBufferHeight) {
    return { width: max, height: min };
  }
  return { width: min, height: max };
}

export function textureToCanvas(texture: ArrayLike<number>, width: number, height: number): HTMLCanvasElement {
  const captureCanvas = document.createElement('canvas');
  const ctx = captureCanvas.getContext('2d');
  assertIsNonNullable(ctx);
  captureCanvas.width = width;
  captureCanvas.height = height;

  const imageData = ctx.createImageData(width, height);
  imageData.data.set(texture);
  ctx.putImageData(imageData, 0, 0);

  return captureCanvas;
}

export type FBO = {
  texture: WebGLTexture | null;
  fbo: WebGLFramebuffer | null;
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  attach(id: number): number;
};

export function createFBO(
  gl: WebGLRenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  param: number,
): FBO {
  gl.activeTexture(gl.TEXTURE0);
  const texture = gl.createTexture();
  gl.bindTexture(gl.TEXTURE_2D, texture);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, param);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, param);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texImage2D(gl.TEXTURE_2D, 0, internalFormat, w, h, 0, format, type, null);

  const fbo = gl.createFramebuffer();
  gl.bindFramebuffer(gl.FRAMEBUFFER, fbo);
  gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, texture, 0);
  gl.viewport(0, 0, w, h);
  gl.clear(gl.COLOR_BUFFER_BIT);

  const texelSizeX = 1.0 / w;
  const texelSizeY = 1.0 / h;

  return {
    texture,
    fbo,
    width: w,
    height: h,
    texelSizeX,
    texelSizeY,
    attach(id: number): number {
      gl.activeTexture(gl.TEXTURE0 + id);
      gl.bindTexture(gl.TEXTURE_2D, texture);
      return id;
    },
  };
}

export type DoubleFBO = {
  width: number;
  height: number;
  texelSizeX: number;
  texelSizeY: number;
  read: FBO;
  write: FBO;
  swap: () => void;
};
export function createDoubleFBO(
  gl: WebGLRenderingContext,
  w: number,
  h: number,
  internalFormat: number,
  format: number,
  type: number,
  param: number,
): DoubleFBO {
  let fbo1 = createFBO(gl, w, h, internalFormat, format, type, param);
  let fbo2 = createFBO(gl, w, h, internalFormat, format, type, param);

  return {
    width: w,
    height: h,
    texelSizeX: fbo1.texelSizeX,
    texelSizeY: fbo1.texelSizeY,
    get read(): FBO {
      return fbo1;
    },
    set read(value) {
      fbo1 = value;
    },
    get write(): FBO {
      return fbo2;
    },
    set write(value) {
      fbo2 = value;
    },
    swap(): void {
      const temp = fbo1;
      fbo1 = fbo2;
      fbo2 = temp;
    },
  };
}

export const CHECK_FRAMEBUFFER_STATUS = (gl: WebGLRenderingContext): void => {
  const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
  if (status !== gl.FRAMEBUFFER_COMPLETE) {
    logger.error(`Framebuffer error: ${status}`);
  }
};

// export function framebufferToTexture(gl: WebGLRenderingContext, target) {
//   gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
//   const length = target.width * target.height * 4;
//   const texture = new Float32Array(length);
//   gl.readPixels(0, 0, target.width, target.height, gl.RGBA, gl.FLOAT, texture);
//   return texture;
// }

// function normalizeTexture(texture, width, height) {
//   const result = new Uint8Array(texture.length);
//   let id = 0;
//   for (let i = height - 1; i >= 0; i--) {
//     for (let j = 0; j < width; j++) {
//       const nid = i * width * 4 + j * 4;
//       result[nid + 0] = clamp01(texture[id + 0]) * 255;
//       result[nid + 1] = clamp01(texture[id + 1]) * 255;
//       result[nid + 2] = clamp01(texture[id + 2]) * 255;
//       result[nid + 3] = clamp01(texture[id + 3]) * 255;
//       id += 4;
//     }
//   }
//   return result;
// }

// function captureScreenshot() {
//   const res = getResolution(config.CAPTURE_RESOLUTION);
//   const target = createFBO(
//     res.width,
//     res.height,
//     ext.formatRGBA.internalFormat,
//     ext.formatRGBA.format,
//     ext.halfFloatTexType,
//     gl.NEAREST,
//   );
//   render(target);
//
//   let texture = framebufferToTexture(target);
//   texture = normalizeTexture(texture, target.width, target.height);
//
//   const captureCanvas = textureToCanvas(texture, target.width, target.height);
//   const datauri = captureCanvas.toDataURL();
//   downloadURI('fluid.png', datauri);
//   URL.revokeObjectURL(datauri);
// }

// function downloadURI(filename, uri) {
//   const link = document.createElement('a');
//   link.download = filename;
//   link.href = uri;
//   document.body.appendChild(link);
//   link.click();
//   document.body.removeChild(link);
// }
