# Email MCP Server

This project provides a Model Context Protocol (MCP) server for sending emails via a single tool, `send_email`.

## Features
- Exposes a single MCP tool: `send_email` (send an email via SMTP)
- Uses `nodemailer` for SMTP email delivery

## Environment Variables
Set the following environment variables before running the server:

- `SMTP_HOST` (required): SMTP server hostname
- `SMTP_PORT` (optional, default: 587): SMTP server port
- `SMTP_SECURE` (optional, default: false): Set to `true` for port 465, otherwise `false`
- `SMTP_USER` (required): SMTP username
- `SMTP_PASS` (required): SMTP password
- `SMTP_FROM` (optional): Sender email address (defaults to `SMTP_USER`)

## Installation

```
npm install
```

## Running the Server

```
npm start
```

The server will start and listen for MCP requests on stdio.

## Integration with Claude Desktop

To integrate this server with Claude Desktop, add the following to your `claude_desktop_config.json`:

```json
{
    "mcpServers": {
        "email-mcp": {
            "command": "node",
            "args": [
                "D:\\projects\\Bitsol Projects\\email-mcp\\dist\\src\\index.js"
            ],
            "env": {
                "SMTP_HOST": "smtp.gmail.com",
                "SMTP_PORT": "587",
                "SMTP_SECURE": "false",
                "SMTP_USER": "<your_email>",
                "SMTP_PASS": "<your_app_password>"
            }
        }
    }
}
```

Replace `<your_email>` and `<your_app_password>` with your actual SMTP credentials.

## Tool: send_email

### Arguments
- `to` (string, required): Recipient email address
- `subject` (string, required): Subject of the email
- `text` (string, required): Plain text body of the email
- `html` (string, optional): HTML body of the email

### Example Call
```
{
  "name": "send_email",
  "arguments": {
    "to": "recipient@example.com",
    "subject": "Hello",
    "text": "This is a test email."
  }
}
``` 