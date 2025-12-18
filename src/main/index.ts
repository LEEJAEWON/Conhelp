import { app, shell, BrowserWindow, ipcMain } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fixPath from 'fix-path'
import * as fs from 'fs'
import { SystemAnalyzer } from './core/SystemAnalyzer'
import { TraefikManager } from './core/TraefikManager'
import { DockerManager } from './core/DockerManager'
import { DatabaseManager } from './core/DatabaseManager'
import { TemplateEngine } from './core/TemplateEngine'

let systemAnalyzer: SystemAnalyzer
let traefikManager: TraefikManager
let dockerManager: DockerManager
let dbManager: DatabaseManager
let templateEngine: TemplateEngine

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  // Fix path for GUI apps (essential for macOS, harmless on Windows)
  fixPath()

  // Set app user model id for windows
  electronApp.setAppUserModelId('com.connection-helper.app')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Initialize Core Modules
  systemAnalyzer = new SystemAnalyzer()
  traefikManager = new TraefikManager()
  dockerManager = new DockerManager()
  dbManager = new DatabaseManager()
  templateEngine = new TemplateEngine()

  console.log('[Main] Initializing services...')

  // Setup Network & Traefik
  try {
    await traefikManager.ensureNetwork()
    await traefikManager.ensureProxyRunning()
  } catch (error) {
    console.error('[Main] Traefik Setup Failed:', error)
  }

  // Register IPC Handlers
  ipcMain.handle('get-system-status', async () => {
    const docker = await systemAnalyzer.checkDockerStatus()
    const port80 = await systemAnalyzer.checkPort80()
    const ip = systemAnalyzer.getLocalIP()
    return { docker, port80, ip }
  })

  ipcMain.handle('get-projects', () => {
    return dbManager.getAllProjects()
  })

  ipcMain.handle('add-project', async (_e, projectData: any) => {
    console.log('[Main] Adding project:', projectData)
    // 1. Generate Dockerfile if requested/needed
    // Check if Dockerfile exists in path
    const dockerfile = join(projectData.path, 'Dockerfile')
    if (!fs.existsSync(dockerfile)) {
      console.log('[Main] Generating Dockerfile...')
      const content = templateEngine.generateDockerfile(projectData.type)
      fs.writeFileSync(dockerfile, content)
    }

    // 2. Add to DB
    const id = dbManager.addProject(projectData)
    return id
  })

  ipcMain.handle('delete-project', async (_e, id: number) => {
    console.log('[Main] Deleting project:', id)
    await dockerManager.stopProject(String(id)).catch(console.error)
    dbManager.deleteProject(id)
  })

  ipcMain.handle('start-project', async (_e, id: number) => {
    console.log('[Main] Starting project:', id)
    const project = dbManager.getProject(id)
    if (!project) throw new Error('Project not found')

    // Ensure image is built
    console.log('[Main] Building image...')
    await dockerManager.buildImage({
      id: String(project.id),
      name: project.name,
      path: project.path,
      type: project.type,
      port: project.port
    })

    console.log('[Main] Running container...')
    const containerId = await dockerManager.runProject({
      id: String(project.id),
      name: project.name,
      path: project.path,
      type: project.type,
      port: project.port
    })

    // Update DB with logs? Or just status.
    return containerId
  })

  ipcMain.handle('stop-project', async (_e, id: number) => {
    console.log('[Main] Stopping project:', id)
    await dockerManager.stopProject(String(id))
  })

  // Log Forwarding
  dockerManager.on('build-log', (data) => {
    BrowserWindow.getAllWindows().forEach(win => {
      win.webContents.send('project-log', {
        projectId: data.projectId,
        msg: data.log?.toString()
      })
    })
  })

  createWindow()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
