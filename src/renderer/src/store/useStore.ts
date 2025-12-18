
import { create } from 'zustand'
import { Project, SystemState, ServiceStatus } from '../types'

interface AppState {
    projects: Project[]
    systemStatus: SystemState | null
    isLoading: boolean

    loadSystemStatus: () => Promise<void>
    loadProjects: () => Promise<void>
    addProject: (project: Omit<Project, 'id' | 'status' | 'domain' | 'lastSync'>) => Promise<void>
    deleteProject: (id: string) => Promise<void>
    startProject: (id: string) => Promise<void>
    stopProject: (id: string) => Promise<void>

    // Log handling could be here or in component
}

const api = (window as any).api

export const useStore = create<AppState>((set, get) => ({
    projects: [],
    systemStatus: null,
    isLoading: false,

    loadSystemStatus: async () => {
        try {
            const status = await api.getSystemStatus()

            const systemState: SystemState = {
                docker: {
                    running: status.docker,
                    version: 'Unknown'
                },
                traefik: {
                    // If port 80 is in usage (occupied), it might be Traefik.
                    // Ideally we check if container is running via API.
                    // For now, assume if docker is up, we try to run Traefik.
                    status: ServiceStatus.RUNNING,
                    dashboardUrl: 'http://localhost:8080/dashboard/',
                    port80Available: status.port80 // returns true if free
                },
                firewall: {
                    active: true // Placeholder
                },
                projects: get().projects
            }

            set({ systemStatus: systemState })
        } catch (e) {
            console.error('Failed to load system status', e)
        }
    },

    loadProjects: async () => {
        try {
            set({ isLoading: true })
            const rawProjects = await api.getProjects()
            const projects: Project[] = rawProjects.map((p: any) => ({
                id: String(p.id),
                name: p.name,
                path: p.path,
                type: p.type as any,
                internalPort: p.port,
                status: ServiceStatus.STOPPED, // We need to check actual status from Docker
                domain: p.domain_url || `${p.name}.localhost`,
                publicUrl: p.public_url,
                lastSync: p.created_at
            }))
            set({ projects, isLoading: false })
        } catch (e) {
            console.error('Failed to load projects', e)
            set({ isLoading: false })
        }
    },

    addProject: async (projectData) => {
        try {
            // Map frontend model to backend expected
            const payload = {
                name: projectData.name,
                path: projectData.path,
                type: projectData.type,
                port: projectData.internalPort,
                domain_url: `${projectData.name}.localhost` // Default
            }
            await api.addProject(payload)
            get().loadProjects()
        } catch (e) {
            console.error('Failed to add project', e)
        }
    },

    deleteProject: async (id) => {
        try {
            await api.deleteProject(Number(id))
            get().loadProjects()
        } catch (e) {
            console.error('Failed to delete project', e)
        }
    },

    startProject: async (id) => {
        try {
            await api.startProject(Number(id))
            set(state => ({
                projects: state.projects.map(p =>
                    p.id === id ? { ...p, status: ServiceStatus.RUNNING } : p
                )
            }))
        } catch (e) {
            console.error('Failed to start project', e)
        }
    },

    stopProject: async (id) => {
        try {
            await api.stopProject(Number(id))
            set(state => ({
                projects: state.projects.map(p =>
                    p.id === id ? { ...p, status: ServiceStatus.STOPPED } : p
                )
            }))
        } catch (e) {
            console.error('Failed to stop project', e)
        }
    }
}))
