// Type definitions for tool arguments
export interface SendEmailArgs {
  to: string[];
  subject: string;
  text: string;
  html?: string;
}