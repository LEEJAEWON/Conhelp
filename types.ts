
export enum ServiceStatus {
  RUNNING = 'RUNNING',
  STOPPED = 'STOPPED',
  ERROR = 'ERROR',
  STARTING = 'STARTING'
}

export type ThemeMode = 'dark' | 'middle' | 'white';

export interface Project {
  id: string;
  name: string;
  path: string;
  type: 'node' | 'python' | 'go' | 'static';
  internalPort: number;
  status: ServiceStatus;
  domain: string;
  publicUrl?: string; // Phase 6: Tunneling URL
  lastSync?: string;
}

export interface SystemState {
  docker: {
    running: boolean;
    version: string;
  };
  traefik: {
    status: ServiceStatus;
    dashboardUrl: string;
    port80Available: boolean;
  };
  firewall: {
    active: boolean;
  };
  projects: Project[];
}

export interface LogEntry {
  id: string;
  timestamp: string;
  message: string;
  level: 'info' | 'warn' | 'error' | 'success' | 'debug';
}
