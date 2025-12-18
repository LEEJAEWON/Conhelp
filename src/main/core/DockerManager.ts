
import Docker from 'dockerode';
import { platform } from 'os';
import { EventEmitter } from 'events';


export interface Project {
    id: string;
    name: string;
    path: string;
    type: string;
    port: number;
}

export class DockerManager extends EventEmitter {
    private docker: Docker;
    private readonly NETWORK_NAME = 'traefik_network';

    constructor() {
        super();
        this.docker = new Docker(this.getDockerSocket());
    }

    private getDockerSocket(): Docker.DockerOptions {
        const isWin = platform() === 'win32';
        if (isWin) {
            return { socketPath: '//./pipe/docker_engine' };
        }
        return { socketPath: '/var/run/docker.sock' };
    }

    /**
     * Build image for the project
     */
    public async buildImage(project: Project): Promise<void> {
        const stream = await this.docker.buildImage({
            context: project.path,
            src: ['Dockerfile', 'package.json', 'package-lock.json', 'requirements.txt', 'index.js', 'app.py', 'src'] // Add common files to context
        }, {
            t: `project-${project.id}:latest`
        });

        return new Promise((resolve, reject) => {
            this.docker.modem.followProgress(stream, (err: any, res: any) => {
                if (err) return reject(err);
                resolve(res);
            }, (event: any) => {
                this.emit('build-log', { projectId: project.id, log: event.stream });
            });
        });
    }

    /**
     * Run the project container
     */
    public async runProject(project: Project): Promise<string> {
        const containerName = `project-${project.id}`;
        const imageName = `project-${project.id}:latest`;

        // Check if container exists and remove it
        const containers = await this.docker.listContainers({ all: true });
        const existing = containers.find(c => c.Names.includes('/' + containerName));
        if (existing) {
            const c = this.docker.getContainer(existing.Id);
            if (existing.State === 'running') {
                await c.stop();
            }
            await c.remove();
        }

        // Traefik labels
        const labels = {
            'traefik.enable': 'true',
            [`traefik.http.routers.${project.name}.rule`]: `Host(\`${project.name}.localhost\`)`,
            [`traefik.http.services.${project.name}.loadbalancer.server.port`]: `${project.port}`,
        };

        // Create container
        // We bind mount the source code for hot reload
        const binds = [
            `${project.path}:/app`
        ];

        // For Windows, ensure path formats are correct if needed, but dockerode handles standard paths well if volume sharing is enabled.

        const container = await this.docker.createContainer({
            Image: imageName,
            name: containerName,
            Labels: labels,
            HostConfig: {
                NetworkMode: this.NETWORK_NAME,
                Binds: binds,
            }
        });

        await container.start();
        return container.id;
    }

    public async stopProject(projectId: string): Promise<void> {
        const containerName = `project-${projectId}`;
        const containers = await this.docker.listContainers({ all: true });
        const existing = containers.find(c => c.Names.includes('/' + containerName));

        if (existing) {
            const c = this.docker.getContainer(existing.Id);
            if (existing.State === 'running') {
                await c.stop();
            }
        }
    }

    public async streamLogs(projectId: string): Promise<NodeJS.ReadableStream> {
        const containerName = `project-${projectId}`;
        const containers = await this.docker.listContainers({ all: true });
        const existing = containers.find(c => c.Names.includes('/' + containerName));

        if (!existing) {
            throw new Error(`Container for project ${projectId} not found`);
        }

        const container = this.docker.getContainer(existing.Id);
        return await container.logs({
            follow: true,
            stdout: true,
            stderr: true
        }) as any; // Cast because types might mismatch depending on stream version
    }
}
