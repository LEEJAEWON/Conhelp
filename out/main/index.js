"use strict";
const electron = require("electron");
const path = require("path");
const utils = require("@electron-toolkit/utils");
const fixPath = require("fix-path");
const fs = require("fs");
const Docker = require("dockerode");
const os = require("os");
const net = require("net");
const events = require("events");
function _interopNamespaceDefault(e) {
  const n = Object.create(null, { [Symbol.toStringTag]: { value: "Module" } });
  if (e) {
    for (const k in e) {
      if (k !== "default") {
        const d = Object.getOwnPropertyDescriptor(e, k);
        Object.defineProperty(n, k, d.get ? d : {
          enumerable: true,
          get: () => e[k]
        });
      }
    }
  }
  n.default = e;
  return Object.freeze(n);
}
const fs__namespace = /* @__PURE__ */ _interopNamespaceDefault(fs);
class SystemAnalyzer {
  docker;
  constructor() {
    this.docker = new Docker(this.getDockerSocket());
  }
  getDockerSocket() {
    const isWin = os.platform() === "win32";
    if (isWin) {
      return { socketPath: "//./pipe/docker_engine" };
    }
    return { socketPath: "/var/run/docker.sock" };
  }
  /**
   * Check if Docker daemon is accessible
   */
  async checkDockerStatus() {
    try {
      await this.docker.ping();
      return true;
    } catch (error) {
      console.error("Docker connection failed:", error);
      return false;
    }
  }
  /**
   * Check if Port 80 is free to use
   * Returns true if port 80 is FREE, false if OCCUPIED
   */
  async checkPort80() {
    return new Promise((resolve) => {
      const server = net.createServer();
      server.once("error", (err) => {
        if (err.code === "EADDRINUSE") {
          resolve(false);
        } else {
          console.error("Port 80 check error:", err);
          resolve(false);
        }
      });
      server.once("listening", () => {
        server.close();
        resolve(true);
      });
      server.listen(80, "0.0.0.0");
    });
  }
  /**
   * Get the primary local IPv4 address
   */
  getLocalIP() {
    const nets = os.networkInterfaces();
    for (const name of Object.keys(nets)) {
      for (const netInfo of nets[name]) {
        if (netInfo.family === "IPv4" && !netInfo.internal) {
          return netInfo.address;
        }
      }
    }
    return "127.0.0.1";
  }
  /**
   * Check firewall status (Placeholder for now)
   * Real implementation will be in Phase 6 FirewallManager
   */
  async checkFirewall() {
    return true;
  }
}
class TraefikManager {
  docker;
  NETWORK_NAME = "traefik_network";
  CONTAINER_NAME = "traefik_gateway";
  constructor() {
    this.docker = new Docker(this.getDockerSocket());
  }
  getDockerSocket() {
    const isWin = os.platform() === "win32";
    if (isWin) {
      return { socketPath: "//./pipe/docker_engine" };
    }
    return { socketPath: "/var/run/docker.sock" };
  }
  async ensureNetwork() {
    const networks = await this.docker.listNetworks();
    const exists = networks.find((n) => n.Name === this.NETWORK_NAME);
    if (!exists) {
      console.log(`[TraefikManager] Creating network: ${this.NETWORK_NAME}`);
      await this.docker.createNetwork({
        Name: this.NETWORK_NAME,
        Driver: "bridge"
      });
    }
  }
  async ensureProxyRunning() {
    console.log("[TraefikManager] Checking Traefik container...");
    const containers = await this.docker.listContainers({ all: true });
    const existing = containers.find((c) => c.Names.some((n) => n === `/${this.CONTAINER_NAME}`));
    if (existing) {
      if (existing.State === "running") {
        console.log("[TraefikManager] Traefik is already running.");
        return;
      }
      console.log("[TraefikManager] Starting existing Traefik container...");
      const container = this.docker.getContainer(existing.Id);
      await container.start();
      return;
    }
    console.log("[TraefikManager] Traefik not found. Pulling image and creating...");
    await this.pullImage("traefik:v2.10");
    const sockPath = "/var/run/docker.sock";
    await this.docker.createContainer({
      Image: "traefik:v2.10",
      name: this.CONTAINER_NAME,
      HostConfig: {
        NetworkMode: this.NETWORK_NAME,
        PortBindings: {
          "80/tcp": [{ HostPort: "80" }],
          "8080/tcp": [{ HostPort: "8080" }]
        },
        Binds: [
          `${sockPath}:/var/run/docker.sock`
        ]
      },
      Cmd: [
        "--api.insecure=true",
        "--providers.docker=true",
        "--providers.docker.exposedbydefault=false",
        "--entrypoints.web.address=:80"
      ]
    }).then(async (container) => {
      console.log("[TraefikManager] Container created. Starting...");
      await container.start();
      console.log("[TraefikManager] Traefik started successfully.");
    });
  }
  async pullImage(image) {
    return new Promise((resolve, reject) => {
      this.docker.pull(image, (err, stream) => {
        if (err) return reject(err);
        this.docker.modem.followProgress(stream, onFinished, onProgress);
        function onFinished(err2, _output) {
          if (err2) return reject(err2);
          resolve();
        }
        function onProgress(_event) {
        }
      });
    });
  }
}
class DockerManager extends events.EventEmitter {
  docker;
  NETWORK_NAME = "traefik_network";
  constructor() {
    super();
    this.docker = new Docker(this.getDockerSocket());
  }
  getDockerSocket() {
    const isWin = os.platform() === "win32";
    if (isWin) {
      return { socketPath: "//./pipe/docker_engine" };
    }
    return { socketPath: "/var/run/docker.sock" };
  }
  /**
   * Build image for the project
   */
  async buildImage(project) {
    const stream = await this.docker.buildImage({
      context: project.path,
      src: ["Dockerfile", "package.json", "package-lock.json", "requirements.txt", "index.js", "app.py", "src"]
      // Add common files to context
    }, {
      t: `project-${project.id}:latest`
    });
    return new Promise((resolve, reject) => {
      this.docker.modem.followProgress(stream, (err, res) => {
        if (err) return reject(err);
        resolve(res);
      }, (event) => {
        this.emit("build-log", { projectId: project.id, log: event.stream });
      });
    });
  }
  /**
   * Run the project container
   */
  async runProject(project) {
    const containerName = `project-${project.id}`;
    const imageName = `project-${project.id}:latest`;
    const containers = await this.docker.listContainers({ all: true });
    const existing = containers.find((c) => c.Names.includes("/" + containerName));
    if (existing) {
      const c = this.docker.getContainer(existing.Id);
      if (existing.State === "running") {
        await c.stop();
      }
      await c.remove();
    }
    const labels = {
      "traefik.enable": "true",
      [`traefik.http.routers.${project.name}.rule`]: `Host(\`${project.name}.localhost\`)`,
      [`traefik.http.services.${project.name}.loadbalancer.server.port`]: `${project.port}`
    };
    const binds = [
      `${project.path}:/app`
    ];
    const container = await this.docker.createContainer({
      Image: imageName,
      name: containerName,
      Labels: labels,
      HostConfig: {
        NetworkMode: this.NETWORK_NAME,
        Binds: binds
      }
    });
    await container.start();
    return container.id;
  }
  async stopProject(projectId) {
    const containerName = `project-${projectId}`;
    const containers = await this.docker.listContainers({ all: true });
    const existing = containers.find((c) => c.Names.includes("/" + containerName));
    if (existing) {
      const c = this.docker.getContainer(existing.Id);
      if (existing.State === "running") {
        await c.stop();
      }
    }
  }
  async streamLogs(projectId) {
    const containerName = `project-${projectId}`;
    const containers = await this.docker.listContainers({ all: true });
    const existing = containers.find((c) => c.Names.includes("/" + containerName));
    if (!existing) {
      throw new Error(`Container for project ${projectId} not found`);
    }
    const container = this.docker.getContainer(existing.Id);
    return await container.logs({
      follow: true,
      stdout: true,
      stderr: true
    });
  }
}
class DatabaseManager {
  dbPath;
  data;
  constructor() {
    this.dbPath = path.join(electron.app.getPath("userData"), "projects.json");
    console.log(`[DatabaseManager] DB Path: ${this.dbPath}`);
    this.init();
  }
  init() {
    if (fs__namespace.existsSync(this.dbPath)) {
      try {
        const content = fs__namespace.readFileSync(this.dbPath, "utf-8");
        this.data = JSON.parse(content);
      } catch (error) {
        console.error("[DatabaseManager] Failed to read DB, creating new:", error);
        this.data = { projects: [], nextId: 1 };
        this.save();
      }
    } else {
      this.data = { projects: [], nextId: 1 };
      this.save();
    }
  }
  save() {
    fs__namespace.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), "utf-8");
  }
  getAllProjects() {
    return this.data.projects.sort((a, b) => {
      const dateA = new Date(a.created_at || 0).getTime();
      const dateB = new Date(b.created_at || 0).getTime();
      return dateB - dateA;
    });
  }
  addProject(project) {
    const newProject = {
      ...project,
      id: this.data.nextId++,
      created_at: (/* @__PURE__ */ new Date()).toISOString()
    };
    this.data.projects.push(newProject);
    this.save();
    return newProject.id;
  }
  getProject(id) {
    return this.data.projects.find((p) => p.id === id);
  }
  updateProjectUrl(id, publicUrl) {
    const project = this.data.projects.find((p) => p.id === id);
    if (project) {
      project.public_url = publicUrl;
      this.save();
    }
  }
  deleteProject(id) {
    this.data.projects = this.data.projects.filter((p) => p.id !== id);
    this.save();
  }
}
class TemplateEngine {
  generateDockerfile(type, version = "latest") {
    switch (type) {
      case "node":
        return this.getNodeDockerfile(version);
      case "python":
        return this.getPythonDockerfile(version);
      case "static":
        return this.getStaticDockerfile();
      default:
        throw new Error(`Unsupported project type: ${type}`);
    }
  }
  getNodeDockerfile(version) {
    const nodeVersion = version === "latest" ? "18-alpine" : version;
    return `
FROM node:${nodeVersion}

WORKDIR /app

# Install dependencies
COPY package*.json ./
RUN npm install

# Copy source (will be overlaid by volume in dev)
COPY . .

EXPOSE 3000

# Default command for development
CMD ["npm", "run", "dev"]
`.trim();
  }
  getPythonDockerfile(version) {
    const pythonVersion = version === "latest" ? "3.9-slim" : version;
    return `
FROM python:${pythonVersion}

WORKDIR /app

COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["python", "app.py"]
`.trim();
  }
  getStaticDockerfile() {
    return `
FROM nginx:alpine

COPY . /usr/share/nginx/html

EXPOSE 80
`.trim();
  }
}
let systemAnalyzer;
let traefikManager;
let dockerManager;
let dbManager;
let templateEngine;
function createWindow() {
  const mainWindow = new electron.BrowserWindow({
    width: 1200,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    webPreferences: {
      preload: path.join(__dirname, "../preload/index.js"),
      sandbox: false
    }
  });
  mainWindow.on("ready-to-show", () => {
    mainWindow.show();
  });
  mainWindow.webContents.setWindowOpenHandler((details) => {
    electron.shell.openExternal(details.url);
    return { action: "deny" };
  });
  if (utils.is.dev && process.env["ELECTRON_RENDERER_URL"]) {
    mainWindow.loadURL(process.env["ELECTRON_RENDERER_URL"]);
  } else {
    mainWindow.loadFile(path.join(__dirname, "../renderer/index.html"));
  }
}
electron.app.whenReady().then(async () => {
  fixPath();
  utils.electronApp.setAppUserModelId("com.connection-helper.app");
  electron.app.on("browser-window-created", (_, window) => {
    utils.optimizer.watchWindowShortcuts(window);
  });
  systemAnalyzer = new SystemAnalyzer();
  traefikManager = new TraefikManager();
  dockerManager = new DockerManager();
  dbManager = new DatabaseManager();
  templateEngine = new TemplateEngine();
  console.log("[Main] Initializing services...");
  try {
    await traefikManager.ensureNetwork();
    await traefikManager.ensureProxyRunning();
  } catch (error) {
    console.error("[Main] Traefik Setup Failed:", error);
  }
  electron.ipcMain.handle("get-system-status", async () => {
    const docker = await systemAnalyzer.checkDockerStatus();
    const port80 = await systemAnalyzer.checkPort80();
    const ip = systemAnalyzer.getLocalIP();
    return { docker, port80, ip };
  });
  electron.ipcMain.handle("get-projects", () => {
    return dbManager.getAllProjects();
  });
  electron.ipcMain.handle("add-project", async (_e, projectData) => {
    console.log("[Main] Adding project:", projectData);
    const dockerfile = path.join(projectData.path, "Dockerfile");
    if (!fs__namespace.existsSync(dockerfile)) {
      console.log("[Main] Generating Dockerfile...");
      const content = templateEngine.generateDockerfile(projectData.type);
      fs__namespace.writeFileSync(dockerfile, content);
    }
    const id = dbManager.addProject(projectData);
    return id;
  });
  electron.ipcMain.handle("delete-project", async (_e, id) => {
    console.log("[Main] Deleting project:", id);
    await dockerManager.stopProject(String(id)).catch(console.error);
    dbManager.deleteProject(id);
  });
  electron.ipcMain.handle("start-project", async (_e, id) => {
    console.log("[Main] Starting project:", id);
    const project = dbManager.getProject(id);
    if (!project) throw new Error("Project not found");
    console.log("[Main] Building image...");
    await dockerManager.buildImage({
      id: String(project.id),
      name: project.name,
      path: project.path,
      type: project.type,
      port: project.port
    });
    console.log("[Main] Running container...");
    const containerId = await dockerManager.runProject({
      id: String(project.id),
      name: project.name,
      path: project.path,
      type: project.type,
      port: project.port
    });
    return containerId;
  });
  electron.ipcMain.handle("stop-project", async (_e, id) => {
    console.log("[Main] Stopping project:", id);
    await dockerManager.stopProject(String(id));
  });
  dockerManager.on("build-log", (data) => {
    electron.BrowserWindow.getAllWindows().forEach((win) => {
      win.webContents.send("project-log", {
        projectId: data.projectId,
        msg: data.log?.toString()
      });
    });
  });
  createWindow();
  electron.app.on("activate", function() {
    if (electron.BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});
electron.app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    electron.app.quit();
  }
});
