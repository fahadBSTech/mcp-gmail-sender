#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import {
  CallToolRequest,
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from "@modelcontextprotocol/sdk/types.js";
import nodemailer from "nodemailer";
import { SendEmailArgs } from "./types.js";
import { sendEmailTool } from "./constant.js";
import { z } from "zod";
import dotenv from "dotenv";
import {zodToJsonSchema} from "zod-to-json-schema";


// Schema definitions
const SendEmailSchema = z.object({
  to: z.array(z.string()).describe("List of recipient email addresses"),
  subject: z.string().describe("Email subject"),
  body: z.string().describe("Email body content (used for text/plain or when htmlBody not provided)"),
  htmlBody: z.string().optional().describe("HTML version of the email body"),
  mimeType: z.enum(['text/plain', 'text/html', 'multipart/alternative']).optional().default('text/plain').describe("Email content type"),
  cc: z.array(z.string()).optional().describe("List of CC recipients"),
  bcc: z.array(z.string()).optional().describe("List of BCC recipients"),
  threadId: z.string().optional().describe("Thread ID to reply to"),
  inReplyTo: z.string().optional().describe("Message ID being replied to"),
});

dotenv.config();

class EmailClient {
  private readonly transporter: nodemailer.Transporter;

  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true", // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  async sendEmail(args: SendEmailArgs): Promise<any> {
    const mailOptions = {
      from: process.env.SMTP_FROM || process.env.SMTP_USER,
      to: args.to,
      subject: args.subject,
      text: args.text,
      html: args.html,
    };
    return this.transporter.sendMail(mailOptions);
  }
}

async function main() {
  if (
    !process.env.SMTP_HOST ||
    !process.env.SMTP_USER ||
    !process.env.SMTP_PASS
  ) {
    console.error(
      "Please set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables"
    );
    process.exit(1);
  }

  console.error("Starting Email MCP Server...");
  const server = new Server({
    name: "Email MCP Server",
    version: "1.0.0",
  }, {
    capabilities: {
      tools: {
        send_email: sendEmailTool,
      },
    },
  });

  const emailClient = new EmailClient();

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    console.error("Received ListToolsRequest");
    return {
      tools: [{
        name: "send_email",
        description: "Send an email",
        parameters: zodToJsonSchema(SendEmailSchema),
      }],
    };
  });

  server.setRequestHandler(
    CallToolRequestSchema,
    async (request: CallToolRequest) => {
      console.error("Received CallToolRequest:", request);
      const {name, arguments: args} = request.params;
      try {
        if (!args) {
          throw new Error("No arguments provided");
        }

        switch (name) {
          case "send_email": {
            const args = request.params.arguments as unknown as SendEmailArgs;
            if (!args.to || !args.subject || !args.text) {
              throw new Error(
                "Missing required arguments: to, subject, and text"
              );
            }
            const response = await emailClient.sendEmail(args);
            return {
              content: [
                {
                  type: "text",
                  text: JSON.stringify({
                    messageId: response.messageId,
                    accepted: response.accepted,
                    rejected: response.rejected,
                  }),
                },
              ],
            };
          }
          default:
            throw new Error(`Unknown tool: ${request.params.name}`);
        }
      } catch (error) {
        console.error("Error executing tool:", error);
        return {
          content: [
            {
              type: "text",
              text: JSON.stringify({
                error: error instanceof Error ? error.message : String(error),
              }),
            },
          ],
        };
      }
    }
  );

 

  const transport = new StdioServerTransport();
  console.error("Email MCP Server running on stdio");
  await server.connect(transport);
}

main().catch((error) => {
  console.error("Fatal error in main():", error);
  process.exit(1);
});
