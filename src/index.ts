#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import dotenv from "dotenv";
import { createStatefulServer } from "@smithery/sdk/server/stateful.js";
import nodemailer from "nodemailer";
import { SendEmailArgs } from "./types.js";

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

const { app } = createStatefulServer<{}>(() => {
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    console.error("Please set SMTP_HOST, SMTP_USER, SMTP_PASS environment variables");
    process.exit(1);
  }

  console.log("Starting Email MCP Server...");
  const server = new McpServer({
    name: "Email MCP Server",
    version: "1.0.0",
  });

  const emailClient = new EmailClient();

  server.tool(
    "send_email",
    {
      to: z.string().describe("Recipient email address"),
      subject: z.string().describe("Subject of the email"),
      text: z.string().describe("Plain text body of the email"),
      html: z.string().optional().describe("HTML body of the email (optional)"),
    },
    { description: "Send an email to a recipient" },
    async (args: SendEmailArgs) => {
      if (!args.to || !args.subject || !args.text) {
        throw new Error("Missing required arguments: to, subject, and text");
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
  );

  return server.server;
});

const PORT = process.env.PORT || 8081;
app.listen(PORT, () => {
  console.log(`MCP server running on port ${PORT}`);
});
