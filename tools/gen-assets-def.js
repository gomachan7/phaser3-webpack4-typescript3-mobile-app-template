// WIP: only for image file yet
const fs = require('fs');
const path = require('path');
const exec = require('child_process').exec;

const scriptRootDir = path.join(__dirname, '../src');
const sourceDir = path.join(scriptRootDir, 'assets');
const outDir = path.join(scriptRootDir, 'scripts/Assets');

const resourceDefStr = makeResourceDefinition(path.join(sourceDir, 'images'), [
  'png',
  'jpg',
  'gif'
]);

const outPath = path.join(outDir, 'ImageAssets.ts');
fs.writeFileSync(outPath, resourceDefStr, 'utf-8');

exec(`prettier ${outPath} --write`);

function makeResourceDefinition(rootDirPath, targetExp) {
  return (
    `// !DO NOT EDIT (generated by tools/${path.basename(__filename)})\n` +
    "import { Resource } from 'Core/Resource';\n" +
    '\n' +
    'export namespace ImageAssets {' +
    makeResourceList(rootDirPath, targetExp) +
    '}\n'
  );
}

function makeResourceList(dirPath, targetExp) {
  const targetExpStr = targetExp.join('|');

  return fs
    .readdirSync(dirPath)
    .filter(name => /^[^.].*$/i.test(name)) // skip invisible file
    .map(name => {
      // get full path and is directory or not.
      return {
        name: name.replace('-', '_'),
        path: path.join(dirPath, name),
        isDir: isDir(path.join(dirPath, name))
      };
    })
    .filter(
      p =>
        isDir(p.path) ||
        (!isDir(p.path) && new RegExp('.+.(' + targetExpStr + ')$', 'i').test(p.name))
    )
    .sort((a, b) => a.isDir - b.isDir)
    .reduce((result, e) => {
      if (!e.isDir) {
        const key = e.name.replace(new RegExp('.(' + targetExpStr + ')$', 'i'), '');
        return (
          result +
          'export const ' +
          key +
          " = new Resource('" +
          key +
          "', '" +
          path.relative(scriptRootDir, e.path) +
          "');\n"
        );
      } else {
        return (
          result +
          'export namespace ' +
          e.name +
          ' {\n' +
          makeResourceList(e.path, targetExp) +
          '}\n'
        );
      }
    }, '');
}

function isDir(path) {
  return fs.existsSync(path) && fs.statSync(path).isDirectory();
}
