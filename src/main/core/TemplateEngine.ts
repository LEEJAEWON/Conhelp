
export class TemplateEngine {
    public generateDockerfile(type: 'node' | 'python' | 'static', version: string = 'latest'): string {
        switch (type) {
            case 'node':
                return this.getNodeDockerfile(version);
            case 'python':
                return this.getPythonDockerfile(version);
            case 'static':
                return this.getStaticDockerfile();
            default:
                throw new Error(`Unsupported project type: ${type}`);
        }
    }

    private getNodeDockerfile(version: string): string {
        const nodeVersion = version === 'latest' ? '18-alpine' : version;
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

    private getPythonDockerfile(version: string): string {
        const pythonVersion = version === 'latest' ? '3.9-slim' : version;
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

    private getStaticDockerfile(): string {
        return `
FROM nginx:alpine

COPY . /usr/share/nginx/html

EXPOSE 80
`.trim();
    }
}
