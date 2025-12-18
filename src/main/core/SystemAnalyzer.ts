
import Docker from 'dockerode';
import { platform, networkInterfaces } from 'os';
import net from 'net';

export class SystemAnalyzer {
    private docker: Docker;

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

    /**
     * Check if Docker daemon is accessible
     */
    public async checkDockerStatus(): Promise<boolean> {
        try {
            await this.docker.ping();
            return true;
        } catch (error) {
            console.error('Docker connection failed:', error);
            return false;
        }
    }

    /**
     * Check if Port 80 is free to use
     * Returns true if port 80 is FREE, false if OCCUPIED
     */
    public async checkPort80(): Promise<boolean> {
        return new Promise((resolve) => {
            const server = net.createServer();
            server.once('error', (err: any) => {
                if (err.code === 'EADDRINUSE') {
                    resolve(false); // Port is occupied
                } else {
                    // Other errors might also mean we can't usage it, but strictly EADDRINUSE is the check.
                    // We'll treat other errors as 'not free' to be safe.
                    console.error('Port 80 check error:', err);
                    resolve(false);
                }
            });
            server.once('listening', () => {
                server.close();
                resolve(true); // Port is free
            });
            server.listen(80, '0.0.0.0');
        });
    }

    /**
     * Get the primary local IPv4 address
     */
    public getLocalIP(): string {
        const nets = networkInterfaces();
        for (const name of Object.keys(nets)) {
            for (const netInfo of nets[name]!) {
                // Skip over non-IPv4 and internal (i.e. 127.0.0.1) addresses
                if (netInfo.family === 'IPv4' && !netInfo.internal) {
                    return netInfo.address;
                }
            }
        }
        return '127.0.0.1';
    }

    /**
     * Check firewall status (Placeholder for now)
     * Real implementation will be in Phase 6 FirewallManager
     */
    public async checkFirewall(): Promise<boolean> {
        // Current valid check: just return true, or maybe check OS firewall status if possible without admin
        // For now, we assume true as detailed management comes later.
        return true;
    }
}
