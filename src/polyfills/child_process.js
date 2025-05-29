// Polyfill for child_process module in browser
const spawn = () => ({
  on: () => {},
  stdout: { on: () => {} },
  stderr: { on: () => {} },
  kill: () => {},
  pid: Math.random()
});

const exec = (command, callback) => {
  if (callback) callback(null, '', '');
  return spawn();
};

const execSync = () => '';
const fork = spawn;

export { spawn, exec, execSync, fork };
export default { spawn, exec, execSync, fork }; 