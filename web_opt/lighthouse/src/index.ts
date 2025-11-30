#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import express, { Express } from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { exec } from "child_process";
import { promisify } from "util";
import puppeteer from 'puppeteer-core';

const execAsync = promisify(exec);

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEMP_DIR = path.join(__dirname, "../temp");
const DEFAULT_PORT = 8080;

class WebOptEnvServer {
  private server: Server;
  private expressApp: Express | null = null;
  private expressServer: any = null;
  private currentPort: number = DEFAULT_PORT;
  private currentHtmlFile: string | null = null;

  constructor() {
    this.server = new Server(
      {
        name: "web-opt-env-mcp",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      }
    );

    this.setupHandlers();
    this.ensureTempDir();
  }

  private async ensureTempDir() {
    try {
      await fs.mkdir(TEMP_DIR, { recursive: true });
    } catch (error) {
      console.error("Failed to create temp directory:", error);
    }
  }

  private setupHandlers() {
    this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
      tools: [
        {
          name: "deploy_zip",
          description:
            "Accept a base64-encoded zip file, extract it, and serve the application. Automatically detects and handles Node.js projects or static sites.",
          inputSchema: {
            type: "object",
            properties: {
              zip_content: {
                type: "string",
                description: "Base64-encoded zip file content",
              },
              port: {
                type: "number",
                description: `Optional port number (defaults to ${DEFAULT_PORT})`,
              },
            },
            required: ["zip_content"],
          },
        },
        {
          name: "serve_html",
          description:
            "Accept an HTML file and serve it on a local web server. Returns the URL where the file is being served.",
          inputSchema: {
            type: "object",
            properties: {
              html_content: {
                type: "string",
                description: "The HTML content to serve",
              },
              filename: {
                type: "string",
                description: "Optional filename (defaults to index.html)",
              },
              port: {
                type: "number",
                description: `Optional port number (defaults to ${DEFAULT_PORT})`,
              },
            },
            required: ["html_content"],
          },
        },
        {
          name: "audit_with_lighthouse",
          description:
            "Run a Lighthouse audit on the currently served HTML file. The file must be served first using serve_html.",
          inputSchema: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "The URL to audit (defaults to the currently served file)",
              },
              categories: {
                type: "array",
                items: {
                  type: "string",
                  enum: ["performance", "accessibility", "best-practices", "seo", "pwa"],
                },
                description:
                  "Lighthouse categories to audit (defaults to all)",
              },
            },
          },
        },
        {
          name: "stop_server",
          description: "Stop the currently running web server.",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
        {
          name: "capture_screenshot",
          description: "Capture a screenshot of a given URL and return it as a base64-encoded PNG.",
          inputSchema: {
            type: "object",
            properties: {
              url: {
                type: "string",
                description: "The URL to capture"
              },
              width: {
                type: "number",
                description: "Viewport width in pixels (default: 1280)"
              },
              height: {
                type: "number",
                description: "Viewport height in pixels (default: 800)"
              }
            },
            required: ["url"]
          }
        },
      ],
    }));

    this.server.setRequestHandler(CallToolRequestSchema, async (request) => {
      switch (request.params.name) {
        case "deploy_zip":
          return await this.handleDeployZip(request.params.arguments);
        case "serve_html":
          return await this.handleServeHtml(request.params.arguments);
        case "audit_with_lighthouse":
          return await this.handleAuditWithLighthouse(request.params.arguments);
        case "stop_server":
          return await this.handleStopServer();
        case "capture_screenshot":
          return await this.handleCaptureScreenshot(request.params.arguments);
        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    });
  }

  private async handleDeployZip(args: any) {
    console.error('[DeployZip] Starting deployment process');
    try {
      const zipContent = args.zip_content as string;
      const port = (args.port as number) || DEFAULT_PORT;
      console.error(`[DeployZip] Port: ${port}, Zip content size: ${zipContent.length} bytes`);

      // Stop existing server if running
      if (this.expressServer) {
        await this.stopServer();
      }

      // Create a unique directory for this deployment
      const deployDir = path.join(TEMP_DIR, `deploy-${Date.now()}`);
      console.error(`[DeployZip] Creating deployment directory: ${deployDir}`);
      await fs.mkdir(deployDir, { recursive: true });

      // Save zip file to temp location
      const zipPath = path.join(deployDir, "deploy.zip");
      const zipBuffer = Buffer.from(zipContent, "base64");
      console.error(`[DeployZip] Writing zip file to: ${zipPath}`);
      await fs.writeFile(zipPath, zipBuffer);
      console.error(`[DeployZip] Zip file written, size: ${zipBuffer.length} bytes`);

      // Unzip the file
      console.error(`[DeployZip] Extracting zip file`);
      await execAsync(`unzip -q ${zipPath} -d ${deployDir}`);
      console.error(`[DeployZip] Zip extraction complete`);

      // Find the root directory (assuming the zip contains a single directory)
      const files = await fs.readdir(deployDir);
      console.error(`[DeployZip] Files in deployment directory: ${files.join(', ')}`);
      // const rootDir = files.find(e => e != '__MACOSX' && e !='deploy.zip');
      const rootDir = '';
      const appPath = path.join(deployDir, rootDir || '');
      console.error(`[DeployZip] Application path: ${appPath}`);

      // Read project name from package.json
      let projectName = 'unknown';
      try {
        const packageJsonPath = path.join(appPath, 'package.json');
        const packageJsonContent = await fs.readFile(packageJsonPath, 'utf-8');
        const packageJson = JSON.parse(packageJsonContent);
        projectName = packageJson.name || 'unknown';
        console.error(`[DeployZip] Project name: ${projectName}`);
      } catch (err) {
        console.error(`[DeployZip] Could not read project name from package.json`);
      }

      // Install dependencies and build
      console.error(`[DeployZip] Installing dependencies in ${appPath}...`);
      const installStart = Date.now();
      await execAsync('npm install', { cwd: appPath });
      console.error(`[DeployZip] Dependencies installed in ${Date.now() - installStart}ms`);

      console.error(`[DeployZip] Building application...`);
      const buildStart = Date.now();
      await execAsync('npm run build', { cwd: appPath });
      console.error(`[DeployZip] Build completed in ${Date.now() - buildStart}ms`);

      // Use Express to serve the built files instead of npx serve
      const distPath = path.join(appPath, 'dist');
      console.error(`[DeployZip] Looking for dist directory at: ${distPath}`);

      // Check if dist directory exists
      try {
        await fs.access(distPath);
        console.error(`[DeployZip] Dist directory exists at ${distPath}`);
        const distContents = await fs.readdir(distPath);
        console.error(`[DeployZip] Project "${projectName}" build directory contains: ${distContents.join(', ')}`);
      } catch (err) {
        console.error(`[DeployZip] ERROR: Build directory not found at ${distPath}`);
        throw new Error(`Build directory not found at ${distPath}`);
      }

      console.error(`[DeployZip] Creating Express app`);
      this.expressApp = express();
      this.expressApp.use(express.static(distPath));
      console.error(`[DeployZip] Express app configured to serve static files from ${distPath}`);

      console.error(`[DeployZip] Starting Express server on 0.0.0.0:${port}`);
      await new Promise<void>((resolve, reject) => {
        this.expressServer = this.expressApp!.listen(port, '0.0.0.0', () => {
          this.currentPort = port;
          console.error(`[DeployZip] ✓ Express server started successfully on 0.0.0.0:${port} serving ${distPath}`);
          console.error(`[DeployZip] Server accessible at http://localhost:${port}`);
          resolve();
        });
        this.expressServer.on("error", (err: Error) => {
          console.error(`[DeployZip] ERROR: Express server error: ${err.message}`);
          console.error(`[DeployZip] Error stack: ${err.stack}`);
          reject(err);
        });
      });
      console.error(`[DeployZip] Deployment complete and server running`);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                port: port,
                message: `Application built and serving from ${path.join(appPath, 'build')} on port ${port}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error: any) {
      console.error(`[DeployZip] ERROR: Deployment failed`);
      console.error(`[DeployZip] Error message: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[DeployZip] Error stack: ${error.stack}`);
      if (error.stderr) {
        console.error(`[DeployZip] Stderr: ${error.stderr}`);
      }
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: error instanceof Error ? error.message : String(error),
                stderr: error.stderr || "",
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  private async handleServeHtml(args: any) {
    try {
      const htmlContent = args.html_content as string;
      const filename = (args.filename as string) || "index.html";
      const port = (args.port as number) || DEFAULT_PORT;

      // Stop existing server if running
      if (this.expressServer) {
        await this.stopServer();
      }

      // Save HTML file
      const filePath = path.join(TEMP_DIR, filename);
      await fs.writeFile(filePath, htmlContent, "utf-8");
      this.currentHtmlFile = filePath;

      // Start express server
      this.expressApp = express();
      this.expressApp.use(express.static(TEMP_DIR));

      await new Promise<void>((resolve, reject) => {
        this.expressServer = this.expressApp!.listen(port, '0.0.0.0', () => {
          this.currentPort = port;
          resolve();
        });
        this.expressServer.on("error", reject);
      });

      const url = `http://localhost:${port}/${filename}`;

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                url: url,
                port: port,
                filename: filename,
                message: `Server started successfully. HTML file is being served at ${url}`,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: error instanceof Error ? error.message : String(error),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  private async handleAuditWithLighthouse(args: any) {
    console.error('[Lighthouse] Starting audit');
    try {
      let url = args.url as string | undefined;

      // If no URL provided, use the currently served file
      if (!url) {
        if (!this.expressServer) {
          console.error('[Lighthouse] ERROR: No server is currently running');
          throw new Error(
            "No server is currently running. Please deploy first using deploy_zip."
          );
        }
        url = `http://localhost:${this.currentPort}`;
        console.error(`[Lighthouse] Using default URL: ${url}`);
      } else {
        console.error(`[Lighthouse] Using provided URL: ${url}`);
      }


      const categories = (args.categories as string[]) || [
        "performance",
        "accessibility",
        "best-practices",
        "seo",
        "pwa",
      ];
      console.error(`[Lighthouse] Audit categories: ${categories.join(', ')}`);

      // Launch Chrome and run Lighthouse
      console.error('[Lighthouse] Launching Chrome...');
      const chrome = await chromeLauncher.launch({
        chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox"],
      });
      console.error(`[Lighthouse] Chrome launched on port ${chrome.port}`);

      const options = {
        logLevel: "info" as const,
        output: "json" as const,
        onlyCategories: categories,
        port: chrome.port,
      };

      console.error(`[Lighthouse] Running Lighthouse audit on ${url}...`);
      const auditStart = Date.now();
      const runnerResult = await lighthouse(url, options);
      console.error(`[Lighthouse] Audit completed in ${Date.now() - auditStart}ms`);

      console.error('[Lighthouse] Closing Chrome...');
      await chrome.kill();
      console.error('[Lighthouse] Chrome closed');

      if (!runnerResult) {
        console.error('[Lighthouse] ERROR: Lighthouse audit failed to produce results');
        throw new Error("Lighthouse audit failed to produce results");
      }
      console.error('[Lighthouse] Processing audit results...');

      // Extract key metrics
      const report = runnerResult.lhr;
      const results: any = {
        url: url,
        fetchTime: report.fetchTime,
        scores: {},
        metrics: {},
      };

      // Collect category scores
      for (const [category, data] of Object.entries(report.categories)) {
        results.scores[category] = {
          score: data.score ? Math.round(data.score * 100) : 0,
          title: data.title,
        };
      }

      // Collect performance metrics if available
      if (report.audits) {
        const metricsToExtract = [
          "first-contentful-paint",
          "largest-contentful-paint",
          "total-blocking-time",
          "cumulative-layout-shift",
          "speed-index",
        ];

        for (const metricKey of metricsToExtract) {
          if (report.audits[metricKey]) {
            const audit = report.audits[metricKey];
            results.metrics[metricKey] = {
              title: audit.title,
              displayValue: audit.displayValue,
              score: audit.score,
            };
          }
        }
      }

      // Collect opportunities and diagnostics
      results.opportunities = [];
      results.diagnostics = [];

      for (const [key, audit] of Object.entries(report.audits)) {
        if (audit.details && audit.details.type === "opportunity") {
          results.opportunities.push({
            title: audit.title,
            description: audit.description,
            score: audit.score,
            displayValue: audit.displayValue,
          });
        } else if (audit.scoreDisplayMode === "informative" && audit.score !== null && audit.score < 1) {
          results.diagnostics.push({
            title: audit.title,
            description: audit.description,
            score: audit.score,
          });
        }
      }
      console.error(`[Lighthouse] Found ${results.opportunities.length} opportunities and ${results.diagnostics.length} diagnostics`);
      console.error(`[Lighthouse] Audit complete with scores: Performance=${results.scores.performance?.score || 'N/A'}, Accessibility=${results.scores.accessibility?.score || 'N/A'}, SEO=${results.scores.seo?.score || 'N/A'}`);

      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                audit: results,
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: error instanceof Error ? error.message : String(error),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  private async handleCaptureScreenshot(args: any) {
    console.error('[Screenshot] Starting screenshot capture');
    try {
      const url = args.url as string;
      const width = args.width || 1280;
      const height = args.height || 800;
      console.error(`[Screenshot] URL: ${url}, Viewport: ${width}x${height}`);

      // Launch Chrome
      console.error('[Screenshot] Launching Chrome...');
      const chrome = await chromeLauncher.launch({
        chromeFlags: ['--headless', '--disable-gpu', '--no-sandbox', '--disable-dev-shm-usage']
      });
      console.error(`[Screenshot] Chrome launched on port ${chrome.port}`);

      try {
        // Connect to Chrome
        console.error('[Screenshot] Connecting to Chrome via WebSocket...');
        const response = await fetch(`http://localhost:${chrome.port}/json/version`);
        const { webSocketDebuggerUrl } = await response.json();
        const browser = await puppeteer.connect({
          browserWSEndpoint: webSocketDebuggerUrl.replace('localhost', '127.0.0.1')
        });
        console.error('[Screenshot] Connected to Chrome');

        try {
          console.error('[Screenshot] Creating new page...');
          const page = await browser.newPage();
          await page.setViewport({ width, height });
          console.error('[Screenshot] Viewport set');

          // Navigate to the URL and wait until the network is idle
          console.error(`[Screenshot] Navigating to ${url}...`);
          await page.goto(url, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });
          console.error('[Screenshot] Page loaded, waiting for lazy content...');

          // Wait a bit more for any lazy-loaded content
          await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));
          console.error('[Screenshot] Lazy content wait complete');

          // Take full page screenshot
          console.error('[Screenshot] Capturing screenshot...');
          const screenshot = await page.screenshot({
            type: 'png',
            fullPage: true,
            encoding: 'base64'
          });
          console.error(`[Screenshot] Screenshot captured, size: ${screenshot.length} bytes`);

          const pageWidth = await page.evaluate(() => document.documentElement.scrollWidth);
          const pageHeight = await page.evaluate(() => document.documentElement.scrollHeight);
          console.error(`[Screenshot] Page dimensions: ${pageWidth}x${pageHeight}`);
          console.error('[Screenshot] Screenshot capture complete');

          return {
            content: [{
              type: 'text',
              text: JSON.stringify({
                success: true,
                screenshot: `data:image/png;base64,${screenshot}`,
                width: pageWidth,
                height: pageHeight
              })
            }]
          };
        } finally {
          console.error('[Screenshot] Disconnecting browser...');
          await browser.disconnect();
          console.error('[Screenshot] Browser disconnected');
        }
      } finally {
        console.error('[Screenshot] Closing Chrome...');
        await chrome.kill();
        console.error('[Screenshot] Chrome closed');
      }
    } catch (error) {
      console.error('[Screenshot] ERROR: Screenshot capture failed');
      console.error(`[Screenshot] Error message: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[Screenshot] Error stack: ${error instanceof Error ? error.stack : 'N/A'}`);
      return {
        content: [{
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: error instanceof Error ? error.message : String(error)
          })
        }],
        isError: true
      };
    }
  }

  private async handleStopServer() {
    console.error('[StopServer] Stopping server...');
    try {
      await this.stopServer();
      console.error('[StopServer] Server stopped successfully');
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: true,
                message: "Server stopped successfully",
              },
              null,
              2
            ),
          },
        ],
      };
    } catch (error) {
      console.error('[StopServer] ERROR: Failed to stop server');
      console.error(`[StopServer] Error: ${error instanceof Error ? error.message : String(error)}`);
      console.error(`[StopServer] Error stack: ${error instanceof Error ? error.stack : 'N/A'}`);
      return {
        content: [
          {
            type: "text",
            text: JSON.stringify(
              {
                success: false,
                error: error instanceof Error ? error.message : String(error),
              },
              null,
              2
            ),
          },
        ],
        isError: true,
      };
    }
  }

  private async stopServer(): Promise<void> {
    if (this.expressServer) {
      console.error('[StopServer] Closing Express server...');
      await new Promise<void>((resolve) => {
        this.expressServer.close(() => {
          console.error('[StopServer] Express server closed');
          resolve();
        });
      });
      this.expressServer = null;
      this.expressApp = null;
      console.error('[StopServer] Express server references cleared');
    }

    // Clean up temp files
    if (this.currentHtmlFile) {
      console.error(`[StopServer] Cleaning up temp file: ${this.currentHtmlFile}`);
      try {
        await fs.unlink(this.currentHtmlFile);
        console.error('[StopServer] Temp file removed');
      } catch (error) {
        console.error(`[StopServer] Warning: Failed to remove temp file: ${error}`);
        // Ignore errors when cleaning up
      }
      this.currentHtmlFile = null;
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    console.error("WebOptEnv MCP server running on stdio");
  }
}

const server = new WebOptEnvServer();
server.run().catch(console.error);
