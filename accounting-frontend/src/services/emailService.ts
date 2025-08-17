// Email service for sending invoices and other notifications
import type { EmailInvoiceData, Invoice, Customer } from "./api";

interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

interface EmailAttachment {
  filename: string;
  content: string; // base64 encoded content
  contentType: string;
}

interface SendEmailRequest {
  to: string;
  subject: string;
  html?: string;
  text?: string;
  attachments?: EmailAttachment[];
}

interface EmailServiceConfig {
  apiUrl: string;
  defaultFromName: string;
  defaultFromEmail: string;
}

// Default configuration (this would typically come from environment variables)
const EMAIL_CONFIG: EmailServiceConfig = {
  apiUrl: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001/api",
  defaultFromName: "Your Company Name",
  defaultFromEmail: "noreply@yourcompany.com",
};

// Email templates
const emailTemplates = {
  invoiceCreated: (invoice: Invoice, customer: Customer): EmailTemplate => ({
    subject: `Invoice ${invoice.invoiceNumber} from ${EMAIL_CONFIG.defaultFromName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #2563eb; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Invoice ${invoice.invoiceNumber}</h1>
        </div>

        <div style="padding: 20px; background-color: #f8fafc;">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear ${customer.name},</p>

          <p style="margin-bottom: 20px;">
            We have created a new invoice for your recent purchase. Please find the details below:
          </p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Invoice Number:</td>
                <td style="padding: 8px 0;">${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Issue Date:</td>
                <td style="padding: 8px 0;">${new Date(invoice.issueDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Due Date:</td>
                <td style="padding: 8px 0;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Total Amount:</td>
                <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #059669;">$${invoice.total.toFixed(
                  2
                )}</td>
              </tr>
            </table>
          </div>

          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <h3 style="margin-top: 0; color: #374151;">Items:</h3>
            <table style="width: 100%; border-collapse: collapse;">
              <thead>
                <tr style="background-color: #f1f5f9;">
                  <th style="padding: 12px; text-align: left; border-bottom: 1px solid #e2e8f0;">Description</th>
                  <th style="padding: 12px; text-align: center; border-bottom: 1px solid #e2e8f0;">Qty</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">Price</th>
                  <th style="padding: 12px; text-align: right; border-bottom: 1px solid #e2e8f0;">Total</th>
                </tr>
              </thead>
              <tbody>
                ${invoice.items
                  .map(
                    (item) => `
                  <tr>
                    <td style="padding: 12px; border-bottom: 1px solid #f1f5f9;">${
                      item.description
                    }</td>
                    <td style="padding: 12px; text-align: center; border-bottom: 1px solid #f1f5f9;">${
                      item.quantity
                    }</td>
                    <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9;">$${item.unitPrice.toFixed(
                      2
                    )}</td>
                    <td style="padding: 12px; text-align: right; border-bottom: 1px solid #f1f5f9;">$${item.total.toFixed(
                      2
                    )}</td>
                  </tr>
                `
                  )
                  .join("")}
              </tbody>
            </table>
          </div>

          <p style="margin-bottom: 20px;">
            The invoice is attached to this email as a PDF document. You can also view and pay your invoice online using the link below:
          </p>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/invoices/${invoice.id}"
               style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              View Invoice Online
            </a>
          </div>

          <p style="margin-bottom: 20px;">
            If you have any questions about this invoice, please don't hesitate to contact us.
          </p>

          <p style="margin-bottom: 10px;">
            Best regards,<br>
            ${EMAIL_CONFIG.defaultFromName}
          </p>
        </div>

        <div style="background-color: #f1f5f9; padding: 20px; text-align: center; font-size: 12px; color: #6b7280;">
          <p style="margin: 0;">
            This is an automated message. Please do not reply to this email.
          </p>
          <p style="margin: 10px 0 0 0;">
            ${EMAIL_CONFIG.defaultFromName} | ${EMAIL_CONFIG.defaultFromEmail}
          </p>
        </div>
      </div>
    `,
    text: `
Invoice ${invoice.invoiceNumber} from ${EMAIL_CONFIG.defaultFromName}

Dear ${customer.name},

We have created a new invoice for your recent purchase. Please find the details below:

Invoice Number: ${invoice.invoiceNumber}
Issue Date: ${new Date(invoice.issueDate).toLocaleDateString()}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}
Total Amount: $${invoice.total.toFixed(2)}

Items:
${invoice.items
  .map(
    (item) =>
      `- ${item.description} (Qty: ${item.quantity}) - $${item.unitPrice.toFixed(
        2
      )} each = $${item.total.toFixed(2)}`
  )
  .join("\n")}

Subtotal: $${invoice.subtotal.toFixed(2)}
Tax (${invoice.taxRate}%): $${invoice.taxAmount.toFixed(2)}
Total: $${invoice.total.toFixed(2)}

The invoice is attached to this email as a PDF document. You can also view and pay your invoice online at:
${window.location.origin}/invoices/${invoice.id}

If you have any questions about this invoice, please don't hesitate to contact us.

Best regards,
${EMAIL_CONFIG.defaultFromName}

---
This is an automated message. Please do not reply to this email.
${EMAIL_CONFIG.defaultFromName} | ${EMAIL_CONFIG.defaultFromEmail}
    `.trim(),
  }),

  invoiceReminder: (invoice: Invoice, customer: Customer): EmailTemplate => ({
    subject: `Reminder: Invoice ${invoice.invoiceNumber} - Due ${new Date(
      invoice.dueDate
    ).toLocaleDateString()}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #f59e0b; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Payment Reminder</h1>
        </div>

        <div style="padding: 20px; background-color: #f8fafc;">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear ${customer.name},</p>

          <p style="margin-bottom: 20px;">
            This is a friendly reminder that invoice ${invoice.invoiceNumber} is due on
            <strong>${new Date(invoice.dueDate).toLocaleDateString()}</strong>.
          </p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Invoice Number:</td>
                <td style="padding: 8px 0;">${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Amount Due:</td>
                <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #dc2626;">$${invoice.total.toFixed(
                  2
                )}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Due Date:</td>
                <td style="padding: 8px 0;">${new Date(invoice.dueDate).toLocaleDateString()}</td>
              </tr>
            </table>
          </div>

          <div style="text-align: center; margin: 30px 0;">
            <a href="${window.location.origin}/invoices/${invoice.id}"
               style="background-color: #059669; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">
              Pay Now
            </a>
          </div>

          <p style="margin-bottom: 20px;">
            If you have already made the payment, please disregard this reminder.
            If you have any questions or need to discuss payment arrangements, please contact us.
          </p>

          <p style="margin-bottom: 10px;">
            Thank you for your business!<br>
            ${EMAIL_CONFIG.defaultFromName}
          </p>
        </div>
      </div>
    `,
    text: `
Payment Reminder - Invoice ${invoice.invoiceNumber}

Dear ${customer.name},

This is a friendly reminder that invoice ${invoice.invoiceNumber} is due on ${new Date(
      invoice.dueDate
    ).toLocaleDateString()}.

Invoice Number: ${invoice.invoiceNumber}
Amount Due: $${invoice.total.toFixed(2)}
Due Date: ${new Date(invoice.dueDate).toLocaleDateString()}

You can view and pay your invoice online at:
${window.location.origin}/invoices/${invoice.id}

If you have already made the payment, please disregard this reminder.
If you have any questions or need to discuss payment arrangements, please contact us.

Thank you for your business!
${EMAIL_CONFIG.defaultFromName}
    `.trim(),
  }),

  paymentReceived: (invoice: Invoice, customer: Customer): EmailTemplate => ({
    subject: `Payment Received - Invoice ${invoice.invoiceNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <div style="background-color: #059669; color: white; padding: 20px; text-align: center;">
          <h1 style="margin: 0; font-size: 24px;">Payment Received</h1>
        </div>

        <div style="padding: 20px; background-color: #f8fafc;">
          <p style="font-size: 16px; margin-bottom: 20px;">Dear ${customer.name},</p>

          <p style="margin-bottom: 20px;">
            Thank you! We have received your payment for invoice ${invoice.invoiceNumber}.
          </p>

          <div style="background-color: white; padding: 20px; border-radius: 8px; border: 1px solid #e2e8f0; margin-bottom: 20px;">
            <table style="width: 100%; border-collapse: collapse;">
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Invoice Number:</td>
                <td style="padding: 8px 0;">${invoice.invoiceNumber}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Payment Amount:</td>
                <td style="padding: 8px 0; font-size: 18px; font-weight: bold; color: #059669;">$${(
                  invoice.paidAmount || invoice.total
                ).toFixed(2)}</td>
              </tr>
              <tr>
                <td style="padding: 8px 0; font-weight: bold;">Payment Date:</td>
                <td style="padding: 8px 0;">${
                  invoice.paymentDate
                    ? new Date(invoice.paymentDate).toLocaleDateString()
                    : new Date().toLocaleDateString()
                }</td>
              </tr>
            </table>
          </div>

          <p style="margin-bottom: 20px;">
            This invoice has been marked as paid in our system. If you need a receipt or have any questions, please contact us.
          </p>

          <p style="margin-bottom: 10px;">
            Thank you for your business!<br>
            ${EMAIL_CONFIG.defaultFromName}
          </p>
        </div>
      </div>
    `,
    text: `
Payment Received - Invoice ${invoice.invoiceNumber}

Dear ${customer.name},

Thank you! We have received your payment for invoice ${invoice.invoiceNumber}.

Invoice Number: ${invoice.invoiceNumber}
Payment Amount: $${(invoice.paidAmount || invoice.total).toFixed(2)}
Payment Date: ${
      invoice.paymentDate
        ? new Date(invoice.paymentDate).toLocaleDateString()
        : new Date().toLocaleDateString()
    }

This invoice has been marked as paid in our system. If you need a receipt or have any questions, please contact us.

Thank you for your business!
${EMAIL_CONFIG.defaultFromName}
    `.trim(),
  }),
};

// Email service class
class EmailService {
  private apiUrl: string;

  constructor(config: EmailServiceConfig) {
    this.apiUrl = config.apiUrl;
  }

  // Send email via API
  private async sendEmail(request: SendEmailRequest): Promise<void> {
    const response = await fetch(`${this.apiUrl}/email/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("auth-token")}`,
      },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.message || "Failed to send email");
    }
  }

  // Send invoice email with PDF attachment
  async sendInvoiceEmail(
    invoice: Invoice,
    customer: Customer,
    emailData: EmailInvoiceData,
    pdfBase64?: string
  ): Promise<void> {
    const attachments: EmailAttachment[] = [];

    // Add PDF attachment if provided
    if (pdfBase64) {
      attachments.push({
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        content: pdfBase64,
        contentType: "application/pdf",
      });
    }

    await this.sendEmail({
      to: emailData.to,
      subject: emailData.subject,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p style="white-space: pre-wrap;">${emailData.message}</p>
        </div>
      `,
      text: emailData.message,
      attachments,
    });
  }

  // Send invoice created notification
  async sendInvoiceCreatedEmail(
    invoice: Invoice,
    customer: Customer,
    pdfBase64?: string
  ): Promise<void> {
    const template = emailTemplates.invoiceCreated(invoice, customer);
    const attachments: EmailAttachment[] = [];

    if (pdfBase64) {
      attachments.push({
        filename: `invoice-${invoice.invoiceNumber}.pdf`,
        content: pdfBase64,
        contentType: "application/pdf",
      });
    }

    await this.sendEmail({
      to: customer.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
      attachments,
    });
  }

  // Send payment reminder
  async sendPaymentReminder(invoice: Invoice, customer: Customer): Promise<void> {
    const template = emailTemplates.invoiceReminder(invoice, customer);

    await this.sendEmail({
      to: customer.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Send payment received confirmation
  async sendPaymentConfirmation(invoice: Invoice, customer: Customer): Promise<void> {
    const template = emailTemplates.paymentReceived(invoice, customer);

    await this.sendEmail({
      to: customer.email,
      subject: template.subject,
      html: template.html,
      text: template.text,
    });
  }

  // Send custom email
  async sendCustomEmail(
    to: string,
    subject: string,
    message: string,
    attachments?: EmailAttachment[]
  ): Promise<void> {
    await this.sendEmail({
      to,
      subject,
      html: `
        <div style="font-family: Arial, sans-serif;">
          <p style="white-space: pre-wrap;">${message}</p>
        </div>
      `,
      text: message,
      attachments,
    });
  }
}

// Create and export email service instance
export const emailService = new EmailService(EMAIL_CONFIG);

// Export types and templates for external use
export { emailTemplates };
export type { EmailTemplate, EmailAttachment, SendEmailRequest, EmailServiceConfig };

// Export the service class for potential custom instances
export { EmailService };

// Export default service instance
export default emailService;
