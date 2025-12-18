
import { join } from 'path';
import { app } from 'electron';
import * as fs from 'fs';

export interface ProjectData {
    id?: number; // DB ID
    name: string;
    path: string;
    type: string;
    port: number;
    domain_url?: string;
    public_url?: string;
    created_at?: string;
}

interface DatabaseSchema {
    projects: ProjectData[];
    nextId: number;
}

export class DatabaseManager {
    private dbPath: string;
    private data: DatabaseSchema;

    constructor() {
        // Save DB in user data directory
        this.dbPath = join(app.getPath('userData'), 'projects.json');
        console.log(`[DatabaseManager] DB Path: ${this.dbPath}`);
        this.init();
    }

    private init() {
        if (fs.existsSync(this.dbPath)) {
            try {
                const content = fs.readFileSync(this.dbPath, 'utf-8');
                this.data = JSON.parse(content);
            } catch (error) {
                console.error('[DatabaseManager] Failed to read DB, creating new:', error);
                this.data = { projects: [], nextId: 1 };
                this.save();
            }
        } else {
            this.data = { projects: [], nextId: 1 };
            this.save();
        }
    }

    private save() {
        fs.writeFileSync(this.dbPath, JSON.stringify(this.data, null, 2), 'utf-8');
    }

    public getAllProjects(): ProjectData[] {
        return this.data.projects.sort((a, b) => {
            const dateA = new Date(a.created_at || 0).getTime();
            const dateB = new Date(b.created_at || 0).getTime();
            return dateB - dateA;
        });
    }

    public addProject(project: ProjectData): number {
        const newProject: ProjectData = {
            ...project,
            id: this.data.nextId++,
            created_at: new Date().toISOString()
        };
        this.data.projects.push(newProject);
        this.save();
        return newProject.id!;
    }

    public getProject(id: number): ProjectData | undefined {
        return this.data.projects.find(p => p.id === id);
    }

    public updateProjectUrl(id: number, publicUrl: string): void {
        const project = this.data.projects.find(p => p.id === id);
        if (project) {
            project.public_url = publicUrl;
            this.save();
        }
    }

    public deleteProject(id: number): void {
        this.data.projects = this.data.projects.filter(p => p.id !== id);
        this.save();
    }
}
