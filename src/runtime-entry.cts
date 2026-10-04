import path = require('node:path');
import url = require('node:url');

// The installed launcher still invokes root/index.js as CommonJS. Native ESM
// owns the application graph; this promise is the only application startup path.
const entryUrl = url.pathToFileURL(path.join(__dirname, 'app/runtime/index.js'));
module.exports = import(entryUrl.href).then((entry: unknown) => {
  if (typeof entry !== 'object' || entry === null || !('main' in entry) || typeof entry.main !== 'function') {
    throw new TypeError('The compiled exec-daemon entry does not export main');
  }
  const main = entry.main as typeof import('./runtime/index.js').main;
  return main(process.argv);
});
// Do not add a catch/exit policy here. Once initialized, the application owns
// unhandled-rejection logging; import failures retain Node's default behavior.
