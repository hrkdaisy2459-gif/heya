// へや — デスクトップ用の小さな常駐ウィンドウ（Electron）
const { app, BrowserWindow, ipcMain, screen } = require('electron');
const path = require('path');
const fs = require('fs');

const stateFile = () => path.join(app.getPath('userData'), 'window.json');
const readState = () => { try { return JSON.parse(fs.readFileSync(stateFile(), 'utf8')); } catch { return {}; } };
const writeState = s => { try { fs.writeFileSync(stateFile(), JSON.stringify(s)); } catch { /* 保存できなくても続行 */ } };

let win;
function create() {
  const st = readState();
  const { workArea } = screen.getPrimaryDisplay();
  const width = st.width || 480, height = st.height || 280;
  const pinned = st.pinned !== false;

  win = new BrowserWindow({
    width, height,
    x: st.x ?? workArea.x + workArea.width - width - 16,
    y: st.y ?? workArea.y + workArea.height - height - 16,
    minWidth: 300, minHeight: 180,
    frame: false,
    alwaysOnTop: pinned,
    backgroundColor: '#23212b',
    title: 'へや',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      backgroundThrottling: false,               // 裏にいてもタイマー・アラームを正確に
      autoplayPolicy: 'no-user-gesture-required', // 起動直後でもアラーム音を鳴らせる
    },
  });
  if (pinned) win.setAlwaysOnTop(true, 'floating');
  win.loadFile(path.join(__dirname, '..', 'index.html'));

  win.on('close', () => writeState({ ...win.getBounds(), pinned: win.isAlwaysOnTop() }));
}

ipcMain.handle('pin:get', () => win.isAlwaysOnTop());
ipcMain.handle('pin:toggle', () => {
  const v = !win.isAlwaysOnTop();
  win.setAlwaysOnTop(v, 'floating');
  return v;
});
ipcMain.on('win:minimize', () => win.minimize());
ipcMain.on('win:close', () => win.close());
ipcMain.on('win:attention', () => {
  if (win.isMinimized()) win.restore();
  win.showInactive();
  win.flashFrame(true);
  setTimeout(() => win && !win.isDestroyed() && win.flashFrame(false), 4000);
});

app.setAppUserModelId('com.heya.companion'); // Windowsで通知を出すため
app.whenReady().then(create);
app.on('window-all-closed', () => app.quit());
