import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const exportLine = 'export const files = ';
const SERVER_DIR = './server';
const DIST_DIR = './dist';
const OUTPUT = './container/files.js';

// List of files to include into webContainers
const files = ['index.js', 'package.json', 'package-lock.json'];

// List of assets files to include into webContainers
const assetsFiles = existsSync(`./${DIST_DIR}/assets/`)
  ? readdirSync(`./${DIST_DIR}/assets/`)
      .filter((file) => !file.startsWith('main-'))
      .reduce((acc, file) => {
        const buffer = readFileSync(`./${DIST_DIR}/assets/${file}`);
        acc[file] = {
          file: { contents: buffer.toString() },
        };
        return acc;
      }, {})
  : undefined;

const racePage = existsSync(`./${DIST_DIR}/app/pages/race/index.html`)
  ? readFileSync(`./${DIST_DIR}/app/pages/race/index.html`).toString()
  : '<<NoRacePage>>';

const content = {
  public: {
    directory: {
      'race.html': {
        file: { contents: racePage },
      },
      assets: {
        directory: {
          ...assetsFiles,
        },
      },
    },
  },
};

files.forEach((file) => {
  const buffer = readFileSync(`./${SERVER_DIR}/${file}`);
  content[file] = {
    file: {
      contents: buffer.toString(),
    },
  };
});

writeFileSync(OUTPUT, `${exportLine}${JSON.stringify(content, null, 2)}`);
