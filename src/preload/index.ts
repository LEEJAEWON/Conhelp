import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
    getSystemStatus: () => ipcRenderer.invoke('get-system-status'),
    getProjects: () => ipcRenderer.invoke('get-projects'),
    addProject: (project: any) => ipcRenderer.invoke('add-project', project),
    deleteProject: (id: number) => ipcRenderer.invoke('delete-project', id),
    startProject: (id: number) => ipcRenderer.invoke('start-project', id),
    stopProject: (id: number) => ipcRenderer.invoke('stop-project', id),
    onLog: (callback: (data: any) => void) => {
        // Clean up previous listeners to avoid duplicates if re-registered broadly?
        // Better to let component manage cleanup or use a specific channel per project
        // For simplicity:
        ipcRenderer.on('project-log', (_event, data) => callback(data))
    },
    removeLogListener: () => {
        ipcRenderer.removeAllListeners('project-log')
    }
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
    try {
        contextBridge.exposeInMainWorld('electron', electronAPI)
        contextBridge.exposeInMainWorld('api', api)
    } catch (error) {
        console.error(error)
    }
} else {
    // @ts-ignore (define in dts)
    window.electron = electronAPI
    // @ts-ignore (define in dts)
    window.api = api
}
