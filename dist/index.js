#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema, } from "@modelcontextprotocol/sdk/types.js";
import express from "express";
import { promises as fs } from "fs";
import path from "path";
import { fileURLToPath } from "url";
import lighthouse from "lighthouse";
import * as chromeLauncher from "chrome-launcher";
import { exec } from "child_process";
import { promisify } from "util";
const execAsync = promisify(exec);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const TEMP_DIR = path.join(__dirname, "../temp");
const DEFAULT_PORT = 8080;
class WebOptEnvServer {
    server;
    expressApp = null;
    expressServer = null;
    currentPort = DEFAULT_PORT;
    currentHtmlFile = null;
    constructor() {
        this.server = new Server({
            name: "web-opt-env-mcp",
            version: "1.0.0",
        }, {
            capabilities: {
                tools: {},
            },
        });
        this.setupHandlers();
        this.ensureTempDir();
    }
    async ensureTempDir() {
        try {
            await fs.mkdir(TEMP_DIR, { recursive: true });
        }
        catch (error) {
            console.error("Failed to create temp directory:", error);
        }
    }
    setupHandlers() {
        this.server.setRequestHandler(ListToolsRequestSchema, async () => ({
            tools: [
                {
                    name: "deploy_zip",
                    description: "Accept a base64-encoded zip file, extract it, and serve the application. Automatically detects and handles Node.js projects or static sites.",
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
                    description: "Accept an HTML file and serve it on a local web server. Returns the URL where the file is being served.",
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
                    description: "Run a Lighthouse audit on the currently served HTML file. The file must be served first using serve_html.",
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
                                description: "Lighthouse categories to audit (defaults to all)",
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
                default:
                    throw new Error(`Unknown tool: ${request.params.name}`);
            }
        });
    }
    async handleDeployZip(args) {
        try {
            const zipContent = args.zip_content;
            const port = args.port || DEFAULT_PORT;
            // Stop existing server if running
            if (this.expressServer) {
                await this.stopServer();
            }
            // Save zip file to temp location
            const zipPath = path.join(TEMP_DIR, "deploy.zip");
            const zipBuffer = Buffer.from(zipContent, "base64");
            await fs.writeFile(zipPath, zipBuffer);
            // Use the deploy-and-serve script
            const { stdout, stderr } = await execAsync(`/usr/local/bin/deploy-and-serve --zip "${zipPath}" --port ${port}`);
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            port: port,
                            message: `Application deployed and serving on port ${port}`,
                            output: stdout,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : String(error),
                            stderr: error.stderr || "",
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    }
    async handleServeHtml(args) {
        try {
            const htmlContent = args.html_content;
            const filename = args.filename || "index.html";
            const port = args.port || DEFAULT_PORT;
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
            await new Promise((resolve, reject) => {
                this.expressServer = this.expressApp.listen(port, () => {
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
                        text: JSON.stringify({
                            success: true,
                            url: url,
                            port: port,
                            filename: filename,
                            message: `Server started successfully. HTML file is being served at ${url}`,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : String(error),
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    }
    async handleAuditWithLighthouse(args) {
        try {
            let url = args.url;
            // If no URL provided, use the currently served file
            if (!url) {
                if (!this.expressServer || !this.currentHtmlFile) {
                    throw new Error("No server is currently running. Please serve an HTML file first using serve_html.");
                }
                const filename = path.basename(this.currentHtmlFile);
                url = `http://localhost:${this.currentPort}/${filename}`;
            }
            const categories = args.categories || [
                "performance",
                "accessibility",
                "best-practices",
                "seo",
                "pwa",
            ];
            // Launch Chrome and run Lighthouse
            const chrome = await chromeLauncher.launch({
                chromeFlags: ["--headless", "--disable-gpu", "--no-sandbox"],
            });
            const options = {
                logLevel: "info",
                output: "json",
                onlyCategories: categories,
                port: chrome.port,
            };
            const runnerResult = await lighthouse(url, options);
            await chrome.kill();
            if (!runnerResult) {
                throw new Error("Lighthouse audit failed to produce results");
            }
            // Extract key metrics
            const report = runnerResult.lhr;
            const results = {
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
                }
                else if (audit.scoreDisplayMode === "informative" && audit.score !== null && audit.score < 1) {
                    results.diagnostics.push({
                        title: audit.title,
                        description: audit.description,
                        score: audit.score,
                    });
                }
            }
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            audit: results,
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : String(error),
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    }
    async handleStopServer() {
        try {
            await this.stopServer();
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: true,
                            message: "Server stopped successfully",
                        }, null, 2),
                    },
                ],
            };
        }
        catch (error) {
            return {
                content: [
                    {
                        type: "text",
                        text: JSON.stringify({
                            success: false,
                            error: error instanceof Error ? error.message : String(error),
                        }, null, 2),
                    },
                ],
                isError: true,
            };
        }
    }
    async stopServer() {
        if (this.expressServer) {
            await new Promise((resolve) => {
                this.expressServer.close(() => resolve());
            });
            this.expressServer = null;
            this.expressApp = null;
        }
        // Clean up temp files
        if (this.currentHtmlFile) {
            try {
                await fs.unlink(this.currentHtmlFile);
            }
            catch (error) {
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
