import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const exportLine = 'export const files = ';
const SERVER_DIR = './server';
const DIST_DIR = './dist';
const OUTPUT = './container/files.js';

// List of files to include into webContainers
const files = ['index.js', 'package.json', 'package-lock.json'];

const isAssetsExists = existsSync(`./${DIST_DIR}/assets/`);
// List of assets files to include into webContainers
const assetsFiles = isAssetsExists
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

const isRacePageExists = existsSync(`./${DIST_DIR}/app/pages/race/index.html`);

const racePage = isRacePageExists
  ? readFileSync(`./${DIST_DIR}/app/pages/race/index.html`).toString()
  : '<<NoRacePage>>';

if (!isRacePageExists) {
  console.error('No Race Page Found !!!', readdirSync(`.`));
} else {
  console.info('Ok', readdirSync(`.`));
}

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
