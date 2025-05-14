import { Tool } from "@modelcontextprotocol/sdk/types.js";

// Tool definition
export const sendEmailTool: Tool = {
  name: "send_email",
  description: "Send an email to a recipient",
  inputSchema: {
    type: "object",
    properties: {
      to: {
        type: "string",
        description: "Recipient email address",
      },
      subject: {
        type: "string",
        description: "Subject of the email",
      },
      text: {
        type: "string",
        description: "Plain text body of the email",
      },
      html: {
        type: "string",
        description: "HTML body of the email (optional)",
      },
    },
    required: ["to", "subject", "text"],
  },
};