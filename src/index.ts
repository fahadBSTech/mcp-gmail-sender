#!/usr/bin/env node
import {
  McpServer,
} from "@modelcontextprotocol/sdk/server/mcp.js";
import nodemailer from "nodemailer";

import { createStatefulServer } from "@smithery/sdk/server/stateful.js";
import { z } from "zod";
import { SendEmailArgs } from "./types.js";

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

// Create stateful server with Slack client configuration
const { app } = createStatefulServer<{
  token: string;
  signingSecret?: string;
  appToken?: string;
}>(({ config }) => {
  try {
    console.log("Starting Email MCP Server...");
    const emailClient = new EmailClient();
    // Create a new MCP server with the higher-level API
    const server = new McpServer({
      name: "Slack MCP Server",
      version: "1.0.0",
    });

    // List channels tool
    server.tool(
      "send_email",
      "Send an email to a recipient",
      {
        to: z.array(z.string()).describe("List of recipient email addresses"),
        subject: z.string().describe("Email subject"),
        body: z
          .string()
          .describe(
            "Email body content (used for text/plain or when htmlBody not provided)"
          ),
      },
      async ({ to, subject, body }: { to: string[]; subject: string; body: string }) => {
        const response = await emailClient.sendEmail({to, subject, text: body});
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
    );

    return server.server;
  } catch (e) {
    console.error(e);
    throw e;
  }
});

// Start the server
const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`MCP server running on port ${PORT}`);
});
