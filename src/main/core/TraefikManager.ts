
import Docker from 'dockerode';
import { platform } from 'os';

export class TraefikManager {
    private docker: Docker;
    private readonly NETWORK_NAME = 'traefik_network';
    private readonly CONTAINER_NAME = 'traefik_gateway';

    constructor() {
        this.docker = new Docker(this.getDockerSocket());
    }

    private getDockerSocket(): Docker.DockerOptions {
        const isWin = platform() === 'win32';
        if (isWin) {
            return { socketPath: '//./pipe/docker_engine' };
        }
        return { socketPath: '/var/run/docker.sock' };
    }

    public async ensureNetwork(): Promise<void> {
        const networks = await this.docker.listNetworks();
        const exists = networks.find(n => n.Name === this.NETWORK_NAME);

        if (!exists) {
            console.log(`[TraefikManager] Creating network: ${this.NETWORK_NAME}`);
            await this.docker.createNetwork({
                Name: this.NETWORK_NAME,
                Driver: 'bridge'
            });
        }
    }

    public async ensureProxyRunning(): Promise<void> {
        console.log('[TraefikManager] Checking Traefik container...');
        // Check if running
        const containers = await this.docker.listContainers({ all: true });
        const existing = containers.find(c => c.Names.some(n => n === `/${this.CONTAINER_NAME}`));

        if (existing) {
            if (existing.State === 'running') {
                console.log('[TraefikManager] Traefik is already running.');
                return;
            }
            console.log('[TraefikManager] Starting existing Traefik container...');
            const container = this.docker.getContainer(existing.Id);
            await container.start();
            return;
        }

        console.log('[TraefikManager] Traefik not found. Pulling image and creating...');
        await this.pullImage('traefik:v2.10');

        // On Windows Docker Desktop, /var/run/docker.sock works as a bind mount source
        const sockPath = '/var/run/docker.sock';

        await this.docker.createContainer({
            Image: 'traefik:v2.10',
            name: this.CONTAINER_NAME,
            HostConfig: {
                NetworkMode: this.NETWORK_NAME,
                PortBindings: {
                    '80/tcp': [{ HostPort: '80' }],
                    '8080/tcp': [{ HostPort: '8080' }]
                },
                Binds: [
                    `${sockPath}:/var/run/docker.sock`
                ]
            },
            Cmd: [
                '--api.insecure=true',
                '--providers.docker=true',
                '--providers.docker.exposedbydefault=false',
                '--entrypoints.web.address=:80'
            ]
        }).then(async (container) => {
            console.log('[TraefikManager] Container created. Starting...');
            await container.start();
            console.log('[TraefikManager] Traefik started successfully.');
        });
    }

    private async pullImage(image: string): Promise<void> {
        return new Promise((resolve, reject) => {
            this.docker.pull(image, (err: any, stream: any) => {
                if (err) return reject(err);
                this.docker.modem.followProgress(stream, onFinished, onProgress);

                function onFinished(err: any, _output: any) {
                    if (err) return reject(err);
                    resolve();
                }
                function onProgress(_event: any) {
                    // Optional: emit log to renderer
                    // console.log(event);
                }
            });
        });
    }
}
