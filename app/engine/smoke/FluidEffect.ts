import type { Nullable } from '@/utils';
import { assertIsNonNullable, isNil } from '@/utils';

import type { RGBColor } from './colorUtils.ts';
import { generateColor, normalizeColor } from './colorUtils.ts';
import { Material } from './Material.ts';
import type { Pointer } from './Pointer.ts';
import { Program } from './Program.ts';
import {
  advectionShader,
  baseVertexShader,
  bloomBlurShader,
  bloomFinalShader,
  bloomPrefilterShader,
  blurShader,
  blurVertexShader,
  checkerboardShader,
  clearShader,
  colorShader,
  copyShader,
  curlShader,
  displayShaderSource,
  divergenceShader,
  gradientSubtractShader,
  pressureShader,
  splatShader,
  sunraysMaskShader,
  sunraysShader,
  vorticityShader,
} from './Shaders.ts';
import type { DoubleFBO, FBO, TextureData, WebGLContextOutput } from './utils.ts';
import {
  createDoubleFBO,
  createFBO,
  createTextureAsync,
  getResolution,
  getTextureScale,
  getWebGLContext,
  isMobile,
  wrap,
} from './utils.ts';

const config = {
  SIM_RESOLUTION: 64, // 32,64,128,256
  DYE_RESOLUTION: 128, // 1024,
  CAPTURE_RESOLUTION: 512,
  DENSITY_DISSIPATION: 1,
  VELOCITY_DISSIPATION: 0.2,
  PRESSURE: 0.8,
  PRESSURE_ITERATIONS: 20,
  CURL: 30,
  SPLAT_RADIUS: 0.1, // 0.25,
  SPLAT_FORCE: 6000,
  SHADING: true,
  COLORFUL: false, // true,
  COLOR: { r: 32, g: 32, b: 32 }, // if not COLORFUL
  COLOR_UPDATE_SPEED: 10,
  PAUSED: false,
  BACK_COLOR: { r: 0, g: 0, b: 0 },
  TRANSPARENT: false,
  BLOOM: false, // true,
  BLOOM_ITERATIONS: 8,
  BLOOM_RESOLUTION: 256,
  BLOOM_INTENSITY: 0.8,
  BLOOM_THRESHOLD: 0.6,
  BLOOM_SOFT_KNEE: 0.7,
  SUNRAYS: false, // true,
  SUNRAYS_RESOLUTION: 196,
  SUNRAYS_WEIGHT: 1.0,
  INITIAL_SPLASH: false,
};

type FrameBuffers = Record<'dye' | 'velocity' | 'pressure', DoubleFBO> & Record<'divergence' | 'curl', FBO>;
type BloomFrameBuffers = { bloom: FBO; frameBuffers: Array<FBO> };
type SunRaysFrameBuffers = { sunrays: FBO; sunraysTemp: FBO };

export class FluidEffect {
  private readonly gl: WebGLRenderingContext;

  private readonly ext: WebGLContextOutput['ext'];

  public canvas: HTMLCanvasElement;

  private pointers: Array<Pointer> = [];

  private splatStack: Array<number> = [];

  private displayMaterial: Material;

  private lastUpdateTime = Date.now();

  private colorUpdateTimer = 0.0;

  private frameBuffers: FrameBuffers;

  private bloomBuffers: BloomFrameBuffers;

  private sunRaysBuffers: SunRaysFrameBuffers;

  private ditheringTexture: TextureData;

  private blurProgram: Program;

  private copyProgram: Program;

  private sunraysMaskProgram: Program;

  private bloomFinalProgram: Program;

  private bloomPrefilterProgram: Program;

  private bloomBlurProgram: Program;

  private gradientSubtractProgram: Program;

  private checkerboardProgram: Program;

  private colorProgram: Program;

  private clearProgram: Program;

  private sunraysProgram: Program;

  private splatProgram: Program;

  private advectionProgram: Program;

  private divergenceProgram: Program;

  private curlProgram: Program;

  private vorticityProgram: Program;

  private pressureProgram: Program;

  private readonly blit: (target: Nullable<FBO>, clear?: boolean) => void;

  // eslint-disable-next-line max-lines-per-function
  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.resizeCanvas();
    const { gl, ext } = getWebGLContext(canvas);
    this.gl = gl;
    this.ext = ext;
    gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, -1, 1, 1, 1, 1, -1]), gl.STATIC_DRAW);
    gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, gl.createBuffer());
    gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array([0, 1, 2, 0, 2, 3]), gl.STATIC_DRAW);
    gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
    gl.enableVertexAttribArray(0);

    this.blit = (target: Nullable<FBO>, clear = false): void => {
      if (!target) {
        gl.viewport(0, 0, gl.drawingBufferWidth, gl.drawingBufferHeight);
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      } else {
        gl.viewport(0, 0, target.width, target.height);
        gl.bindFramebuffer(gl.FRAMEBUFFER, target.fbo);
      }
      if (clear) {
        gl.clearColor(0.0, 0.0, 0.0, 1.0);
        gl.clear(gl.COLOR_BUFFER_BIT);
      }
      // CHECK_FRAMEBUFFER_STATUS();
      gl.drawElements(gl.TRIANGLES, 6, gl.UNSIGNED_SHORT, 0);
    };

    if (isMobile()) {
      config.DYE_RESOLUTION = 512;
    }
    if (!ext.supportLinearFiltering) {
      config.DYE_RESOLUTION = 512;
      config.SHADING = false;
      config.BLOOM = false;
      config.SUNRAYS = false;
    }

    // ===========
    this.displayMaterial = new Material(gl, baseVertexShader(gl), displayShaderSource);
    this.ditheringTexture = createTextureAsync(gl, 'LDR_LLL1_0.png');

    this.blurProgram = new Program(gl, blurVertexShader(gl), blurShader(gl));
    this.copyProgram = new Program(gl, baseVertexShader(gl), copyShader(gl));
    this.clearProgram = new Program(gl, baseVertexShader(gl), clearShader(gl));
    this.colorProgram = new Program(gl, baseVertexShader(gl), colorShader(gl));
    this.checkerboardProgram = new Program(gl, baseVertexShader(gl), checkerboardShader(gl));
    this.bloomPrefilterProgram = new Program(gl, baseVertexShader(gl), bloomPrefilterShader(gl));
    this.bloomBlurProgram = new Program(gl, baseVertexShader(gl), bloomBlurShader(gl));
    this.bloomFinalProgram = new Program(gl, baseVertexShader(gl), bloomFinalShader(gl));
    this.sunraysMaskProgram = new Program(gl, baseVertexShader(gl), sunraysMaskShader(gl));
    this.sunraysProgram = new Program(gl, baseVertexShader(gl), sunraysShader(gl));
    this.splatProgram = new Program(gl, baseVertexShader(gl), splatShader(gl));
    this.advectionProgram = new Program(gl, baseVertexShader(gl), advectionShader(gl, this.ext));
    this.divergenceProgram = new Program(gl, baseVertexShader(gl), divergenceShader(gl));
    this.curlProgram = new Program(gl, baseVertexShader(gl), curlShader(gl));
    this.vorticityProgram = new Program(gl, baseVertexShader(gl), vorticityShader(gl));
    this.pressureProgram = new Program(gl, baseVertexShader(gl), pressureShader(gl));
    this.gradientSubtractProgram = new Program(gl, baseVertexShader(gl), gradientSubtractShader(gl));

    this.updateKeywords();

    this.frameBuffers = this.initFrameBuffers();
    this.bloomBuffers = this.initBloomFrameBuffers();
    this.sunRaysBuffers = this.initSunRaysFrameBuffers();

    this.initialize();
  }

  public initialize(): void {
    if (config.INITIAL_SPLASH) {
      this.multipleSplats(Math.random() * 20 + 5);
    }

    this.update();
  }

  public findPointer = (id: number): Pointer | undefined => this.pointers.find((p) => p.id === id);

  public addPointer = (pointer: Pointer): Pointer => {
    this.pointers.push(pointer);
    return pointer;
  };

  private correctDeltaX(delta: number): number {
    const aspectRatio = this.canvas.width / this.canvas.height;
    if (aspectRatio < 1) {
      return delta * aspectRatio;
    }
    return delta;
  }

  private correctDeltaY(delta: number): number {
    const aspectRatio = this.canvas.width / this.canvas.height;
    if (aspectRatio > 1) {
      return delta / aspectRatio;
    }
    return delta;
  }

  public updatePointerMoveData(pointer: Pointer, posX: number, posY: number, color?: RGBColor): void {
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.texcoordX = posX / this.canvas.width;
    pointer.texcoordY = 1.0 - posY / this.canvas.height;
    pointer.deltaX = this.correctDeltaX(pointer.texcoordX - pointer.prevTexcoordX);
    pointer.deltaY = this.correctDeltaY(pointer.texcoordY - pointer.prevTexcoordY);
    pointer.moved = Math.abs(pointer.deltaX) > 0 || Math.abs(pointer.deltaY) > 0;
    if (color) {
      pointer.color = normalizeColor(color);
    }
  }

  public updatePointerDownData(pointer: Pointer, id: number, posX: number, posY: number, color?: RGBColor): void {
    pointer.id = id;
    pointer.down = true;
    pointer.moved = false;
    pointer.texcoordX = posX / this.canvas.width;
    pointer.texcoordY = 1.0 - posY / this.canvas.height;
    pointer.prevTexcoordX = pointer.texcoordX;
    pointer.prevTexcoordY = pointer.texcoordY;
    pointer.deltaX = 0;
    pointer.deltaY = 0;
    if (config.COLORFUL) {
      pointer.color = generateColor();
    } else if (color) {
      pointer.color = normalizeColor(color);
    } else {
      pointer.color = normalizeColor(config.COLOR);
    }
  }

  // eslint-disable-next-line class-methods-use-this
  public updatePointerUpData(pointer: Pointer): void {
    pointer.down = false;
  }

  private updateColors(dt: number): void {
    if (!config.COLORFUL) {
      return;
    }

    this.colorUpdateTimer += dt * config.COLOR_UPDATE_SPEED;
    if (this.colorUpdateTimer >= 1) {
      this.colorUpdateTimer = wrap(this.colorUpdateTimer, 0, 1);
      this.pointers.forEach((p) => {
        p.color = generateColor();
      });
    }
  }

  private updateKeywords(): void {
    const displayKeywords = [];
    if (config.SHADING) {
      displayKeywords.push('SHADING');
    }
    if (config.BLOOM) {
      displayKeywords.push('BLOOM');
    }
    if (config.SUNRAYS) {
      displayKeywords.push('SUNRAYS');
    }
    this.displayMaterial.setKeywords(displayKeywords);
  }

  private calcDeltaTime(): number {
    const now = Date.now();
    let dt = (now - this.lastUpdateTime) / 1000;
    dt = Math.min(dt, 0.016666);
    this.lastUpdateTime = now;
    return dt;
  }

  // eslint-disable-next-line max-lines-per-function
  private initFrameBuffers(): FrameBuffers {
    const { gl, ext, frameBuffers: { velocity, dye } = {} } = this;
    const simRes = getResolution(gl, config.SIM_RESOLUTION);
    const dyeRes = getResolution(gl, config.DYE_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    const rg = ext.formatRG;
    const r = ext.formatR;

    assertIsNonNullable(rgba);
    assertIsNonNullable(rg);
    assertIsNonNullable(r);
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    gl.disable(gl.BLEND);

    const buffers: Partial<FrameBuffers> = {};

    if (!dye) {
      buffers.dye = createDoubleFBO(
        gl,
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering,
      );
    } else {
      buffers.dye = this.resizeDoubleFBO(
        dye,
        dyeRes.width,
        dyeRes.height,
        rgba.internalFormat,
        rgba.format,
        texType,
        filtering,
      );
    }

    if (!velocity) {
      buffers.velocity = createDoubleFBO(
        gl,
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering,
      );
    } else {
      buffers.velocity = this.resizeDoubleFBO(
        velocity,
        simRes.width,
        simRes.height,
        rg.internalFormat,
        rg.format,
        texType,
        filtering,
      );
    }

    buffers.divergence = createFBO(gl, simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    buffers.curl = createFBO(gl, simRes.width, simRes.height, r.internalFormat, r.format, texType, gl.NEAREST);
    buffers.pressure = createDoubleFBO(
      gl,
      simRes.width,
      simRes.height,
      r.internalFormat,
      r.format,
      texType,
      gl.NEAREST,
    );

    if (!this.frameBuffers) {
      this.frameBuffers = {
        dye: buffers.dye,
        curl: buffers.curl,
        velocity: buffers.velocity,
        divergence: buffers.divergence,
        pressure: buffers.pressure,
      };
    } else {
      Object.assign(this.frameBuffers, buffers);
    }

    return this.frameBuffers;
  }

  private resizeFBO(
    target: FBO,
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number,
  ): FBO {
    const newFBO = createFBO(this.gl, w, h, internalFormat, format, type, param);
    this.copyProgram.bind();
    this.gl.uniform1i(this.copyProgram.uniforms.uTexture, target.attach(0));
    this.blit(newFBO);
    return newFBO;
  }

  private resizeDoubleFBO(
    target: DoubleFBO,
    w: number,
    h: number,
    internalFormat: number,
    format: number,
    type: number,
    param: number,
  ): DoubleFBO {
    if (target.width === w && target.height === h) {
      return target;
    }
    target.read = this.resizeFBO(target.read, w, h, internalFormat, format, type, param);
    target.write = createFBO(this.gl, w, h, internalFormat, format, type, param);
    target.width = w;
    target.height = h;
    target.texelSizeX = 1.0 / w;
    target.texelSizeY = 1.0 / h;
    return target;
  }

  // eslint-disable-next-line max-lines-per-function
  private step(dt: number): void {
    const {
      gl,
      curlProgram,
      vorticityProgram,
      divergenceProgram,
      pressureProgram,
      clearProgram,
      gradientSubtractProgram,
      advectionProgram,
      frameBuffers: { velocity, dye, pressure, divergence, curl },
    } = this;
    gl.disable(gl.BLEND);

    curlProgram.bind();
    gl.uniform2f(curlProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(curlProgram.uniforms.uVelocity, velocity.read.attach(0));
    this.blit(curl);

    vorticityProgram.bind();
    gl.uniform2f(vorticityProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(vorticityProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(vorticityProgram.uniforms.uCurl, curl.attach(1));
    gl.uniform1f(vorticityProgram.uniforms.curl, config.CURL);
    gl.uniform1f(vorticityProgram.uniforms.dt, dt);
    this.blit(velocity.write);
    velocity.swap();

    divergenceProgram.bind();
    gl.uniform2f(divergenceProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(divergenceProgram.uniforms.uVelocity, velocity.read.attach(0));
    this.blit(divergence);

    clearProgram.bind();
    gl.uniform1i(clearProgram.uniforms.uTexture, pressure.read.attach(0));
    gl.uniform1f(clearProgram.uniforms.value, config.PRESSURE);
    this.blit(pressure.write);
    pressure.swap();

    pressureProgram.bind();
    gl.uniform2f(pressureProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(pressureProgram.uniforms.uDivergence, divergence.attach(0));
    for (let i = 0; i < config.PRESSURE_ITERATIONS; i++) {
      gl.uniform1i(pressureProgram.uniforms.uPressure, pressure.read.attach(1));
      this.blit(pressure.write);
      pressure.swap();
    }

    gradientSubtractProgram.bind();
    gl.uniform2f(gradientSubtractProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    gl.uniform1i(gradientSubtractProgram.uniforms.uPressure, pressure.read.attach(0));
    gl.uniform1i(gradientSubtractProgram.uniforms.uVelocity, velocity.read.attach(1));
    this.blit(velocity.write);
    velocity.swap();

    advectionProgram.bind();
    gl.uniform2f(advectionProgram.uniforms.texelSize, velocity.texelSizeX, velocity.texelSizeY);
    if (!this.ext.supportLinearFiltering) {
      gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, velocity.texelSizeX, velocity.texelSizeY);
    }
    const velocityId = velocity.read.attach(0);
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocityId);
    gl.uniform1i(advectionProgram.uniforms.uSource, velocityId);
    gl.uniform1f(advectionProgram.uniforms.dt, dt);
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.VELOCITY_DISSIPATION);
    this.blit(velocity.write);
    velocity.swap();

    if (!this.ext.supportLinearFiltering) {
      gl.uniform2f(advectionProgram.uniforms.dyeTexelSize, dye.texelSizeX, dye.texelSizeY);
    }
    gl.uniform1i(advectionProgram.uniforms.uVelocity, velocity.read.attach(0));
    gl.uniform1i(advectionProgram.uniforms.uSource, dye.read.attach(1));
    gl.uniform1f(advectionProgram.uniforms.dissipation, config.DENSITY_DISSIPATION);
    this.blit(dye.write);
    dye.swap();
  }

  public update = (): void => {
    const dt = this.calcDeltaTime();
    if (this.resizeCanvas()) {
      this.initFrameBuffers();
    }
    this.updateColors(dt);
    this.applyInputs();
    if (!config.PAUSED) {
      this.step(dt);
    }
    this.render(null);
    // requestAnimationFrame(this.update);
  };

  private resizeCanvas(): boolean {
    const { canvas } = this;
    // TODO FOR MOUSE
    // const width = scaleByPixelRatio(canvas.clientWidth);
    // const height = scaleByPixelRatio(canvas.clientHeight);

    const width = canvas.clientWidth;
    const height = canvas.clientHeight;

    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
      return true;
    }
    return false;
  }

  private applyInputs(): void {
    if (this.splatStack.length > 0) {
      const amt = this.splatStack.pop();
      if (!isNil(amt)) {
        this.multipleSplats(amt);
      }
    }

    this.pointers.forEach((p) => {
      if (p.moved) {
        p.moved = false;
        this.splatPointer(p);
      }
    });
  }

  private render(target: Nullable<FBO>): void {
    const {
      gl,
      frameBuffers: { dye },
      bloomBuffers: { bloom },
      sunRaysBuffers: { sunrays, sunraysTemp },
    } = this;
    if (config.BLOOM) {
      this.applyBloom(dye.read, bloom);
    }
    if (config.SUNRAYS) {
      this.applySunrays(dye.read, dye.write, sunrays);
      this.blur(sunrays, sunraysTemp, 1);
    }

    if (!target || !config.TRANSPARENT) {
      gl.blendFunc(gl.ONE, gl.ONE_MINUS_SRC_ALPHA);
      gl.enable(gl.BLEND);
    } else {
      gl.disable(gl.BLEND);
    }

    if (!config.TRANSPARENT) {
      this.drawColor(target, normalizeColor(config.BACK_COLOR));
    }
    if (!target && config.TRANSPARENT) {
      this.drawCheckerboard(target);
    }
    this.drawDisplay(target);
  }

  private drawDisplay(target: Nullable<FBO>): void {
    const {
      gl,
      displayMaterial,
      frameBuffers: { dye },
      bloomBuffers: { bloom },
      sunRaysBuffers: { sunrays },
      ditheringTexture,
    } = this;
    const width = !target ? gl.drawingBufferWidth : target.width;
    const height = !target ? gl.drawingBufferHeight : target.height;

    displayMaterial.bind();
    if (config.SHADING) {
      gl.uniform2f(displayMaterial.uniforms.texelSize, 1.0 / width, 1.0 / height);
    }
    gl.uniform1i(displayMaterial.uniforms.uTexture, dye.read.attach(0));
    if (config.BLOOM) {
      gl.uniform1i(displayMaterial.uniforms.uBloom, bloom.attach(1));
      gl.uniform1i(displayMaterial.uniforms.uDithering, ditheringTexture.attach(2));
      const scale = getTextureScale(ditheringTexture, width, height);
      gl.uniform2f(displayMaterial.uniforms.ditherScale, scale.x, scale.y);
    }
    if (config.SUNRAYS) {
      gl.uniform1i(displayMaterial.uniforms.uSunrays, sunrays.attach(3));
    }
    this.blit(target);
  }

  private drawColor(target: Nullable<FBO>, color: RGBColor): void {
    const { gl, colorProgram } = this;
    this.colorProgram.bind();
    gl.uniform4f(colorProgram.uniforms.color, color.r, color.g, color.b, 1);
    this.blit(target);
  }

  private drawCheckerboard(target: Nullable<FBO>): void {
    const { gl, checkerboardProgram, canvas } = this;
    checkerboardProgram.bind();
    gl.uniform1f(checkerboardProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    this.blit(target);
  }

  private initBloomFrameBuffers(): BloomFrameBuffers {
    const { gl, ext } = this;
    const res = getResolution(gl, config.BLOOM_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const rgba = ext.formatRGBA;
    assertIsNonNullable(rgba);
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    const bloom = createFBO(gl, res.width, res.height, rgba.internalFormat, rgba.format, texType, filtering);
    if (this.bloomBuffers) {
      this.bloomBuffers.frameBuffers.length = 0;
    }
    const bloomFrameBuffers: Array<FBO> = [];
    for (let i = 0; i < config.BLOOM_ITERATIONS; i++) {
      // eslint-disable-next-line no-bitwise
      const width = res.width >> (i + 1);
      // eslint-disable-next-line no-bitwise
      const height = res.height >> (i + 1);

      if (width < 2 || height < 2) {
        break;
      }

      const fbo = createFBO(gl, width, height, rgba.internalFormat, rgba.format, texType, filtering);
      bloomFrameBuffers.push(fbo);
    }

    this.bloomBuffers = {
      bloom,
      frameBuffers: bloomFrameBuffers,
    };
    return this.bloomBuffers;
  }

  private initSunRaysFrameBuffers(): SunRaysFrameBuffers {
    const { gl, ext } = this;
    const res = getResolution(gl, config.SUNRAYS_RESOLUTION);

    const texType = ext.halfFloatTexType;
    const r = ext.formatR;
    assertIsNonNullable(r);
    const filtering = ext.supportLinearFiltering ? gl.LINEAR : gl.NEAREST;

    this.sunRaysBuffers = {
      sunrays: createFBO(gl, res.width, res.height, r.internalFormat, r.format, texType, filtering),
      sunraysTemp: createFBO(gl, res.width, res.height, r.internalFormat, r.format, texType, filtering),
    };

    return this.sunRaysBuffers;
  }

  // eslint-disable-next-line max-lines-per-function
  private applyBloom(source: FBO, destination: FBO): void {
    const {
      gl,
      bloomBuffers: { frameBuffers },
      bloomPrefilterProgram,
      bloomBlurProgram,
      bloomFinalProgram,
    } = this;
    if (frameBuffers.length < 2) {
      return;
    }

    let last = destination;

    gl.disable(gl.BLEND);
    bloomPrefilterProgram.bind();
    const knee = config.BLOOM_THRESHOLD * config.BLOOM_SOFT_KNEE + 0.0001;
    const curve0 = config.BLOOM_THRESHOLD - knee;
    const curve1 = knee * 2;
    const curve2 = 0.25 / knee;
    gl.uniform3f(bloomPrefilterProgram.uniforms.curve, curve0, curve1, curve2);
    gl.uniform1f(bloomPrefilterProgram.uniforms.threshold, config.BLOOM_THRESHOLD);
    gl.uniform1i(bloomPrefilterProgram.uniforms.uTexture, source.attach(0));
    this.blit(last);

    bloomBlurProgram.bind();
    for (let i = 0; i < frameBuffers.length; i++) {
      const dest = frameBuffers[i];
      gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
      gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
      this.blit(dest);
      last = dest;
    }

    gl.blendFunc(gl.ONE, gl.ONE);
    gl.enable(gl.BLEND);

    for (let i = frameBuffers.length - 2; i >= 0; i--) {
      const baseTex = frameBuffers[i];
      gl.uniform2f(bloomBlurProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
      gl.uniform1i(bloomBlurProgram.uniforms.uTexture, last.attach(0));
      gl.viewport(0, 0, baseTex.width, baseTex.height);
      this.blit(baseTex);
      last = baseTex;
    }

    gl.disable(gl.BLEND);
    bloomFinalProgram.bind();
    gl.uniform2f(bloomFinalProgram.uniforms.texelSize, last.texelSizeX, last.texelSizeY);
    gl.uniform1i(bloomFinalProgram.uniforms.uTexture, last.attach(0));
    gl.uniform1f(bloomFinalProgram.uniforms.intensity, config.BLOOM_INTENSITY);
    this.blit(destination);
  }

  private applySunrays(source: FBO, mask: FBO, destination: FBO): void {
    const { gl, sunraysMaskProgram, sunraysProgram } = this;
    gl.disable(gl.BLEND);
    sunraysMaskProgram.bind();
    gl.uniform1i(sunraysMaskProgram.uniforms.uTexture, source.attach(0));
    this.blit(mask);

    sunraysProgram.bind();
    gl.uniform1f(sunraysProgram.uniforms.weight, config.SUNRAYS_WEIGHT);
    gl.uniform1i(sunraysProgram.uniforms.uTexture, mask.attach(0));
    this.blit(destination);
  }

  private blur(target: FBO, temp: FBO, iterations: number): void {
    const { gl, blurProgram } = this;
    blurProgram.bind();
    for (let i = 0; i < iterations; i++) {
      gl.uniform2f(blurProgram.uniforms.texelSize, target.texelSizeX, 0.0);
      gl.uniform1i(blurProgram.uniforms.uTexture, target.attach(0));
      this.blit(temp);

      gl.uniform2f(blurProgram.uniforms.texelSize, 0.0, target.texelSizeY);
      gl.uniform1i(blurProgram.uniforms.uTexture, temp.attach(0));
      this.blit(target);
    }
  }

  private splatPointer(pointer: Pointer): void {
    const dx = pointer.deltaX * config.SPLAT_FORCE;
    const dy = pointer.deltaY * config.SPLAT_FORCE;
    this.splat(pointer.texcoordX, pointer.texcoordY, dx, dy, pointer.color);
  }

  private multipleSplats(amount: number): void {
    for (let i = 0; i < amount; i++) {
      const color = generateColor();
      color.r *= 10.0;
      color.g *= 10.0;
      color.b *= 10.0;
      const x = Math.random();
      const y = Math.random();
      const dx = 1000 * (Math.random() - 0.5);
      const dy = 1000 * (Math.random() - 0.5);
      this.splat(x, y, dx, dy, color);
    }
  }

  private splat(x: number, y: number, dx: number, dy: number, color: RGBColor): void {
    const {
      gl,
      splatProgram,
      frameBuffers: { dye, velocity },
      canvas,
    } = this;
    splatProgram.bind();
    gl.uniform1i(splatProgram.uniforms.uTarget, velocity.read.attach(0));
    gl.uniform1f(splatProgram.uniforms.aspectRatio, canvas.width / canvas.height);
    gl.uniform2f(splatProgram.uniforms.point, x, y);
    gl.uniform3f(splatProgram.uniforms.color, dx, dy, 0.0);
    gl.uniform1f(splatProgram.uniforms.radius, this.correctRadius(config.SPLAT_RADIUS / 100.0));
    this.blit(velocity.write);
    velocity.swap();

    gl.uniform1i(splatProgram.uniforms.uTarget, dye.read.attach(0));
    gl.uniform3f(splatProgram.uniforms.color, color.r, color.g, color.b);
    this.blit(dye.write);
    dye.swap();
  }

  private correctRadius(radius: number): number {
    const aspectRatio = this.canvas.width / this.canvas.height;
    if (aspectRatio > 1) {
      return radius * aspectRatio;
    }
    return radius;
  }
}

// canvas.addEventListener('touchstart', (e) => {
//   e.preventDefault();
//   const touches = e.targetTouches;
//   while (touches.length >= pointers.length) {
//     pointers.push(new pointerPrototype());
//   }
//   for (let i = 0; i < touches.length; i++) {
//     const posX = scaleByPixelRatio(touches[i].pageX);
//     const posY = scaleByPixelRatio(touches[i].pageY);
//     updatePointerDownData(pointers[i + 1], touches[i].identifier, posX, posY);
//   }
// });

// canvas.addEventListener(
//   'touchmove',
//   (e) => {
//     e.preventDefault();
//     const touches = e.targetTouches;
//     for (let i = 0; i < touches.length; i++) {
//       const pointer = pointers[i + 1];
//       if (!pointer.down) {
//         continue;
//       }
//       const posX = scaleByPixelRatio(touches[i].pageX);
//       const posY = scaleByPixelRatio(touches[i].pageY);
//       updatePointerMoveData(pointer, posX, posY);
//     }
//   },
//   false,
// );

// window.addEventListener('touchend', (e) => {
//   const touches = e.changedTouches;
//   for (let i = 0; i < touches.length; i++) {
//     const pointer = pointers.find((p) => p.id == touches[i].identifier);
//     if (pointer == null) {
//       continue;
//     }
//     updatePointerUpData(pointer);
//   }
// });

// window.addEventListener('keydown', (e) => {
//   if (e.code === 'KeyP') {
//     config.PAUSED = !config.PAUSED;
//   }
//   if (e.key === ' ') {
//     splatStack.push(parseInt(Math.random() * 20) + 5);
//   }
// });

// startGUI();
//
// function startGUI() {
//   const gui = new dat.GUI({ width: 300 });
//   gui
//     .add(config, 'DYE_RESOLUTION', { high: 1024, medium: 512, low: 256, 'very low': 128 })
//     .name('quality')
//     .onFinishChange(initFramebuffers);
//   gui
//     .add(config, 'SIM_RESOLUTION', { '32': 32, '64': 64, '128': 128, '256': 256 })
//     .name('sim resolution')
//     .onFinishChange(initFramebuffers);
//   gui.add(config, 'DENSITY_DISSIPATION', 0, 4.0).name('density diffusion');
//   gui.add(config, 'VELOCITY_DISSIPATION', 0, 4.0).name('velocity diffusion');
//   gui.add(config, 'PRESSURE', 0.0, 1.0).name('pressure');
//   gui.add(config, 'CURL', 0, 50).name('vorticity').step(1);
//   gui.add(config, 'SPLAT_RADIUS', 0.01, 1.0).name('splat radius');
//   gui.add(config, 'SHADING').name('shading').onFinishChange(updateKeywords);
//   gui.add(config, 'COLORFUL').name('colorful');
//   gui.add(config, 'PAUSED').name('paused').listen();
//
//   gui
//     .add(
//       {
//         fun: () => {
//           splatStack.push(parseInt(Math.random() * 20) + 5);
//         },
//       },
//       'fun',
//     )
//     .name('Random splats');
//
//   const bloomFolder = gui.addFolder('Bloom');
//   bloomFolder.add(config, 'BLOOM').name('enabled').onFinishChange(updateKeywords);
//   bloomFolder.add(config, 'BLOOM_INTENSITY', 0.1, 2.0).name('intensity');
//   bloomFolder.add(config, 'BLOOM_THRESHOLD', 0.0, 1.0).name('threshold');
//
//   const sunraysFolder = gui.addFolder('Sunrays');
//   sunraysFolder.add(config, 'SUNRAYS').name('enabled').onFinishChange(updateKeywords);
//   sunraysFolder.add(config, 'SUNRAYS_WEIGHT', 0.3, 1.0).name('weight');
//
//   const captureFolder = gui.addFolder('Capture');
//   captureFolder.addColor(config, 'BACK_COLOR').name('background color');
//   captureFolder.add(config, 'TRANSPARENT').name('transparent');
//   captureFolder.add({ fun: captureScreenshot }, 'fun').name('take screenshot');
//
//   const github = gui
//     .add(
//       {
//         fun: () => {
//           window.open('https://github.com/PavelDoGreat/WebGL-Fluid-Simulation');
//           ga('send', 'event', 'link button', 'github');
//         },
//       },
//       'fun',
//     )
//     .name('Github');
//   github.__li.className = 'cr function bigFont';
//   github.__li.style.borderLeft = '3px solid #8C8C8C';
//   const githubIcon = document.createElement('span');
//   github.domElement.parentElement.appendChild(githubIcon);
//   githubIcon.className = 'icon github';
//
//   const twitter = gui
//     .add(
//       {
//         fun: () => {
//           ga('send', 'event', 'link button', 'twitter');
//           window.open('https://twitter.com/PavelDoGreat');
//         },
//       },
//       'fun',
//     )
//     .name('Twitter');
//   twitter.__li.className = 'cr function bigFont';
//   twitter.__li.style.borderLeft = '3px solid #8C8C8C';
//   const twitterIcon = document.createElement('span');
//   twitter.domElement.parentElement.appendChild(twitterIcon);
//   twitterIcon.className = 'icon twitter';
//
//   const discord = gui
//     .add(
//       {
//         fun: () => {
//           ga('send', 'event', 'link button', 'discord');
//           window.open('https://discordapp.com/invite/CeqZDDE');
//         },
//       },
//       'fun',
//     )
//     .name('Discord');
//   discord.__li.className = 'cr function bigFont';
//   discord.__li.style.borderLeft = '3px solid #8C8C8C';
//   const discordIcon = document.createElement('span');
//   discord.domElement.parentElement.appendChild(discordIcon);
//   discordIcon.className = 'icon discord';
//
//   const app = gui
//     .add(
//       {
//         fun: () => {
//           ga('send', 'event', 'link button', 'app');
//           window.open('http://onelink.to/5b58bn');
//         },
//       },
//       'fun',
//     )
//     .name('Check out mobile app');
//   app.__li.className = 'cr function appBigFont';
//   app.__li.style.borderLeft = '3px solid #00FF7F';
//   const appIcon = document.createElement('span');
//   app.domElement.parentElement.appendChild(appIcon);
//   appIcon.className = 'icon app';
//
//   if (isMobile()) {
//     gui.close();
//   }
// }

// const promoPopup = document.getElementsByClassName('promo')[0];
// const promoPopupClose = document.getElementsByClassName('promo-close')[0];
//
// if (isMobile()) {
//   setTimeout(() => {
//     promoPopup.style.display = 'table';
//   }, 20000);
// }
