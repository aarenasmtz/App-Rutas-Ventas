// Local UI preview: always uses the read-only fixture API, never the cloud URL.
const { spawn } = require('node:child_process');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const env = { ...process.env, EXPO_PUBLIC_API_URL: `http://127.0.0.1:${Number(process.env.PREVIEW_API_PORT || 8911)}/api/v1`, EXPO_NO_TELEMETRY: '1', EXPO_OFFLINE: '1' };
delete env.CI;
const child = spawn(process.execPath, [path.join(root, 'node_modules/expo/bin/cli'), 'start', '--web', '--localhost', '--port', String(Number(process.env.PREVIEW_WEB_PORT || 8091)), '--max-workers', '2'], { cwd: root, env, stdio: 'inherit', windowsHide: true });
child.on('exit', code => { process.exitCode = code || 0; });
