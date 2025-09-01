import { Document, Page, Text, View, StyleSheet } from "@react-pdf/renderer";
import type { Invoice, Customer, InvoiceItem } from "../../services/api";
import { formatCurrency } from "../../utils/currency";

// PDF Styles
const styles = StyleSheet.create({
  page: {
    fontFamily: "Helvetica",
    fontSize: 12,
    paddingTop: 30,
    paddingLeft: 60,
    paddingRight: 60,
    paddingBottom: 60,
    lineHeight: 1.5,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#2563eb",
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 5,
    fontWeight: "bold",
  },
  companyInfo: {
    fontSize: 10,
    color: "#6b7280",
    textAlign: "right",
  },
  invoiceNumber: {
    fontSize: 14,
    fontWeight: "bold",
    marginTop: 10,
  },
  billToSection: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 20,
    marginBottom: 20,
  },
  billToBox: {
    width: "45%",
    padding: 15,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    borderRadius: 5,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: "bold",
    marginBottom: 8,
    color: "#374151",
  },
  text: {
    fontSize: 10,
    marginBottom: 3,
    color: "#4b5563",
  },
  table: {
    width: "auto",
    borderStyle: "solid",
    borderWidth: 1,
    borderRightWidth: 0,
    borderBottomWidth: 0,
    borderColor: "#e5e7eb",
    marginTop: 20,
  },
  tableRow: {
    margin: "auto",
    flexDirection: "row",
  },
  tableColHeader: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: "#e5e7eb",
    backgroundColor: "#f3f4f6",
    padding: 8,
  },
  tableCol: {
    width: "25%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: "#e5e7eb",
    padding: 8,
  },
  tableColWide: {
    width: "40%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: "#e5e7eb",
    padding: 8,
  },
  tableColNarrow: {
    width: "20%",
    borderStyle: "solid",
    borderWidth: 1,
    borderLeftWidth: 0,
    borderTopWidth: 0,
    borderColor: "#e5e7eb",
    padding: 8,
  },
  tableHeaderText: {
    fontSize: 10,
    fontWeight: "bold",
    color: "#374151",
  },
  tableCellText: {
    fontSize: 10,
    color: "#4b5563",
  },
  totalsSection: {
    marginTop: 20,
    alignItems: "flex-end",
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: 200,
    marginBottom: 5,
  },
  totalLabel: {
    fontSize: 11,
    color: "#374151",
  },
  totalValue: {
    fontSize: 11,
    fontWeight: "bold",
    color: "#374151",
  },
  grandTotal: {
    fontSize: 14,
    fontWeight: "bold",
    color: "#059669",
  },
  notesSection: {
    marginTop: 30,
    borderTopWidth: 1,
    borderTopColor: "#e5e7eb",
    paddingTop: 15,
  },
  footer: {
    position: "absolute",
    bottom: 30,
    left: 60,
    right: 60,
    textAlign: "center",
    fontSize: 10,
    color: "#9ca3af",
  },
});

// Company information (this would typically come from settings/API)
const COMPANY_INFO = {
  name: "Your Company Name",
  address: "123 Business Street",
  city: "Business City",
  state: "BC",
  zipCode: "12345",
  country: "USA",
  phone: "+1 (555) 123-4567",
  email: "hello@yourcompany.com",
  website: "www.yourcompany.com",
  taxId: "TAX-123456789",
};

// Invoice PDF Document Component
interface InvoicePDFProps {
  invoice: Invoice;
  customer: Customer;
}

const InvoicePDF = ({ invoice, customer }: InvoicePDFProps) => (
  <Document>
    <Page size="A4" style={styles.page}>
      {/* Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>INVOICE</Text>
          <Text style={styles.invoiceNumber}>#{invoice.invoiceNumber}</Text>
          <View style={{ marginTop: 10 }}>
            <Text style={styles.text}>
              Issue Date: {new Date(invoice.issueDate).toLocaleDateString()}
            </Text>
            <Text style={styles.text}>
              Due Date: {new Date(invoice.dueDate).toLocaleDateString()}
            </Text>
            <Text style={styles.text}>Status: {invoice.status.toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.companyInfo}>
          <Text style={styles.subtitle}>{COMPANY_INFO.name}</Text>
          <Text style={styles.text}>{COMPANY_INFO.address}</Text>
          <Text style={styles.text}>
            {COMPANY_INFO.city}, {COMPANY_INFO.state} {COMPANY_INFO.zipCode}
          </Text>
          <Text style={styles.text}>{COMPANY_INFO.country}</Text>
          <Text style={styles.text}>Phone: {COMPANY_INFO.phone}</Text>
          <Text style={styles.text}>Email: {COMPANY_INFO.email}</Text>
          <Text style={styles.text}>{COMPANY_INFO.website}</Text>
        </View>
      </View>

      {/* Bill To Section */}
      <View style={styles.billToSection}>
        <View style={styles.billToBox}>
          <Text style={styles.sectionTitle}>Bill To:</Text>
          <Text style={[styles.text, { fontWeight: "bold" }]}>{customer.name}</Text>
          <Text style={styles.text}>{customer.company}</Text>
          <Text style={styles.text}>{customer.email}</Text>
          {customer.phone && <Text style={styles.text}>{customer.phone}</Text>}
          <Text style={styles.text}>{customer.address}</Text>
          <Text style={styles.text}>
            {customer.city}
            {customer.state && `, ${customer.state}`}
            {customer.zipCode && ` ${customer.zipCode}`}
          </Text>
          <Text style={styles.text}>{customer.country}</Text>
        </View>
        <View style={styles.billToBox}>
          <Text style={styles.sectionTitle}>Invoice Details:</Text>
          <Text style={styles.text}>Description: {invoice.description}</Text>
          {invoice.paymentDate && (
            <Text style={[styles.text, { color: "#059669" }]}>
              Paid on: {new Date(invoice.paymentDate).toLocaleDateString()}
            </Text>
          )}
          {COMPANY_INFO.taxId && <Text style={styles.text}>Tax ID: {COMPANY_INFO.taxId}</Text>}
        </View>
      </View>

      {/* Items Table */}
      <View style={styles.table}>
        {/* Table Header */}
        <View style={styles.tableRow}>
          <View style={[styles.tableColHeader, styles.tableColWide]}>
            <Text style={styles.tableHeaderText}>Description</Text>
          </View>
          <View style={[styles.tableColHeader, styles.tableColNarrow]}>
            <Text style={styles.tableHeaderText}>Quantity</Text>
          </View>
          <View style={[styles.tableColHeader, styles.tableColNarrow]}>
            <Text style={styles.tableHeaderText}>Unit Price</Text>
          </View>
          <View style={[styles.tableColHeader, styles.tableColNarrow]}>
            <Text style={styles.tableHeaderText}>Total</Text>
          </View>
        </View>

        {/* Table Rows */}
        {invoice.items.map((item: InvoiceItem, index: number) => (
          <View style={styles.tableRow} key={index}>
            <View style={[styles.tableCol, styles.tableColWide]}>
              <Text style={styles.tableCellText}>{item.description}</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColNarrow]}>
              <Text style={styles.tableCellText}>{item.quantity}</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColNarrow]}>
              <Text style={styles.tableCellText}>{formatCurrency(item.unitPrice)}</Text>
            </View>
            <View style={[styles.tableCol, styles.tableColNarrow]}>
              <Text style={styles.tableCellText}>{formatCurrency(item.total)}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* Totals Section */}
      <View style={styles.totalsSection}>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Subtotal:</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.subtotal)}</Text>
        </View>
        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Tax ({invoice.taxRate}%):</Text>
          <Text style={styles.totalValue}>{formatCurrency(invoice.taxAmount)}</Text>
        </View>
        <View
          style={[
            styles.totalRow,
            { borderTopWidth: 1, borderTopColor: "#e5e7eb", paddingTop: 5 },
          ]}>
          <Text style={[styles.totalLabel, styles.grandTotal]}>Total:</Text>
          <Text style={[styles.totalValue, styles.grandTotal]}>
            {formatCurrency(invoice.total)}
          </Text>
        </View>
        {invoice.paidAmount && invoice.paidAmount > 0 && (
          <>
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, { color: "#059669" }]}>Paid:</Text>
              <Text style={[styles.totalValue, { color: "#059669" }]}>
                {formatCurrency(invoice.paidAmount)}
              </Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Balance Due:</Text>
              <Text style={styles.totalValue}>
                {formatCurrency(invoice.total - invoice.paidAmount)}
              </Text>
            </View>
          </>
        )}
      </View>

      {/* Notes Section */}
      {invoice.notes && (
        <View style={styles.notesSection}>
          <Text style={styles.sectionTitle}>Notes:</Text>
          <Text style={styles.text}>{invoice.notes}</Text>
        </View>
      )}

      {/* Footer */}
      <View style={styles.footer}>
        <Text>Thank you for your business!</Text>
        <Text>
          Tax ID: {COMPANY_INFO.taxId} | {COMPANY_INFO.website}
        </Text>
      </View>
    </Page>
  </Document>
);

export default InvoicePDF;
export type { InvoicePDFProps };
