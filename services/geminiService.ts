
import { GoogleGenAI, Type } from "@google/genai";
import { Project } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY || '' });

export const generateDockerConfig = async (project: Project) => {
  const prompt = `Generate a standard docker-compose.yml file for a ${project.type} project named "${project.name}". 
  The project is located at "${project.path}". 
  It runs internally on port ${project.internalPort}. 
  Include Traefik labels to route traffic for host "${project.domain}" to this internal port. 
  The Traefik network is named "traefik_network". 
  Ensure it supports hot reloading by mounting the local volume.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a cloud infrastructure expert specializing in Docker and Traefik. Provide only the YAML content without conversational filler.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating configuration.";
  }
};

export const troubleshootProject = async (project: Project, logs: string[]) => {
  const prompt = `The following project is failing to start or route traffic correctly:
  Project: ${JSON.stringify(project)}
  Recent Logs:
  ${logs.join('\n')}
  
  Provide a concise troubleshooting guide and potential fixes.`;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: prompt,
      config: {
        systemInstruction: "You are a senior DevOps engineer. Analyze the logs and provide actionable solutions.",
      }
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Error generating troubleshooting guide.";
  }
};
