import { readFileSync, writeFileSync } from 'node:fs'

const INPUT = 'server'
const OUTPUT = 'files.js'
// List of files to include into webContainers
const files = ['index.js', 'package.json', 'package-lock.json']
const exportLine = 'export const files = '


const page = readFileSync(`./${INPUT}/public/index.html`).toString()

const content = {'public':{'directory':{'index.html': {'file':{'contents': page}}}}}
//const content = {}

files.forEach(file => {
    const buffer = readFileSync(`./${INPUT}/${file}`)
    content[file] = {
        file: {
            contents: buffer.toString()
        }
    }
})

writeFileSync(OUTPUT, `${exportLine}${JSON.stringify(content, null, 2)}`)
