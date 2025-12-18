"use strict";
const electron = require("electron");
const preload = require("@electron-toolkit/preload");
const api = {
  getSystemStatus: () => electron.ipcRenderer.invoke("get-system-status"),
  getProjects: () => electron.ipcRenderer.invoke("get-projects"),
  addProject: (project) => electron.ipcRenderer.invoke("add-project", project),
  deleteProject: (id) => electron.ipcRenderer.invoke("delete-project", id),
  startProject: (id) => electron.ipcRenderer.invoke("start-project", id),
  stopProject: (id) => electron.ipcRenderer.invoke("stop-project", id),
  onLog: (callback) => {
    electron.ipcRenderer.on("project-log", (_event, data) => callback(data));
  },
  removeLogListener: () => {
    electron.ipcRenderer.removeAllListeners("project-log");
  }
};
if (process.contextIsolated) {
  try {
    electron.contextBridge.exposeInMainWorld("electron", preload.electronAPI);
    electron.contextBridge.exposeInMainWorld("api", api);
  } catch (error) {
    console.error(error);
  }
} else {
  window.electron = preload.electronAPI;
  window.api = api;
}
