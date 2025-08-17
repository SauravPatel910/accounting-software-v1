import React from "react";
import { PDFDownloadLink, pdf } from "@react-pdf/renderer";
import type { Invoice, Customer } from "./api";
import InvoicePDF from "../components/invoices/InvoicePDF";

// PDF Generation Service
export const pdfService = {
  // Generate PDF blob for download
  generatePDFBlob: async (invoice: Invoice, customer: Customer): Promise<Blob> => {
    const doc = <InvoicePDF invoice={invoice} customer={customer} />;
    const asPdf = pdf(doc);
    const blob = await asPdf.toBlob();
    return blob;
  },

  // Download PDF file
  downloadPDF: async (invoice: Invoice, customer: Customer, filename?: string): Promise<void> => {
    const blob = await pdfService.generatePDFBlob(invoice, customer);
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename || `invoice-${invoice.invoiceNumber}.pdf`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  },

  // Open PDF in new tab
  openPDFInNewTab: async (invoice: Invoice, customer: Customer): Promise<void> => {
    const blob = await pdfService.generatePDFBlob(invoice, customer);
    const url = URL.createObjectURL(blob);
    window.open(url, "_blank");
    // Note: URL will remain in memory, but will be cleaned up when tab is closed
  },

  // Get PDF as base64 string (useful for email attachments)
  getPDFAsBase64: async (invoice: Invoice, customer: Customer): Promise<string> => {
    const blob = await pdfService.generatePDFBlob(invoice, customer);
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        // Remove data:application/pdf;base64, prefix
        const base64 = result.split(",")[1];
        resolve(base64);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  },
};

// PDF Download Link Component for React
interface PDFDownloadButtonProps {
  invoice: Invoice;
  customer: Customer;
  filename?: string;
  children: React.ReactNode;
  className?: string;
}

export const PDFDownloadButton = ({
  invoice,
  customer,
  filename,
  children,
  className,
}: PDFDownloadButtonProps) => (
  <PDFDownloadLink
    document={<InvoicePDF invoice={invoice} customer={customer} />}
    fileName={filename || `invoice-${invoice.invoiceNumber}.pdf`}
    className={className}>
    {({ loading }) => (loading ? "Generating PDF..." : children)}
  </PDFDownloadLink>
);

// Export default service
export default pdfService;
