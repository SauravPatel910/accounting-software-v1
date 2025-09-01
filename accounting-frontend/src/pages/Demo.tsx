import { useState } from "react";
// prettier-ignore
import { Container, Title, Tabs, Grid, Card, Text, Stack, Group, Button, Badge, Box, Paper, Modal } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
// prettier-ignore
import { IconCash, IconFileInvoice, IconUsers, IconBuilding, IconChartBar, IconShoppingCart, IconCreditCard, IconSettings, IconPlus, IconEye } from "@tabler/icons-react";
import { motion } from "motion/react";
// Import all components for testing
import { CustomerList } from "../components/customers";
import { ProductList } from "../components/products";
import { InvoiceList, InvoiceForm } from "../components/invoices";
import VendorList from "../components/vendors/VendorList";
import VendorForm from "../components/vendors/VendorForm";
import { BillList, ExpenseList } from "../components/expenses";
import { BankAccountList, TransactionList } from "../components/banking";
import { ProfitLoss, BalanceSheet, ReportExport } from "../components/reports";
import { CurrencyDisplay } from "../components/ui/CurrencyDisplay";
import { CurrencySettings } from "../components/settings";

// Mock data types for demo
interface DemoProduct {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
}

const ComponentShowcase = ({ title, children }: { title: string; children: React.ReactNode }) => (
  <Card shadow="sm" padding="lg" radius="md" withBorder>
    <Card.Section withBorder inheritPadding py="xs">
      <Text fw={500}>{title}</Text>
    </Card.Section>
    <Box mt="md">{children}</Box>
  </Card>
);

export function Demo() {
  const [activeTab, setActiveTab] = useState<string | null>("overview");
  const [vendorModalOpened, { open: openVendorModal, close: closeVendorModal }] =
    useDisclosure(false);
  const [invoiceModalOpened, { open: openInvoiceModal, close: closeInvoiceModal }] =
    useDisclosure(false);
  const [, setSelectedProduct] = useState<DemoProduct | null>(null);

  // Mock customers for demo
  const mockCustomers = [
    {
      id: "CUST-001",
      name: "John Smith",
      company: "Acme Corporation",
      email: "john.smith@acmecorp.com",
      address: "123 Business St",
      city: "New York",
      country: "USA",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: "CUST-002",
      name: "Sarah Johnson",
      company: "TechStart Inc",
      email: "sarah@techstart.io",
      address: "456 Innovation Ave",
      city: "San Francisco",
      country: "USA",
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];

  // Mock handlers for demo purposes
  const handleCustomerEdit = (customer: unknown) => {
    console.log("Edit customer:", customer);
  };

  const handleCustomerDelete = (customer: unknown) => {
    console.log("Delete customer:", customer);
  };

  const handleCreateInvoice = (customer: unknown) => {
    console.log("Create invoice for:", customer);
    openInvoiceModal();
  };

  const handleVendorCreate = () => {
    openVendorModal();
  };

  const handleVendorEdit = (vendor: unknown) => {
    console.log("Edit vendor:", vendor);
    openVendorModal();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}>
      <Container size="xl" py="xl">
        <Stack gap="xl">
          {/* Header */}
          <Box>
            <Title order={1} mb="md">
              Component Demo & Testing Center
            </Title>
            <Text size="lg" c="dimmed">
              Test and showcase all enhanced components in your accounting software
            </Text>
          </Box>

          {/* Component Status Overview */}
          <Paper p="lg" withBorder>
            <Title order={3} mb="md">
              Component Status Overview
            </Title>
            <Grid>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Group>
                  <Badge color="green" variant="light" size="lg">
                    ✓ Complete
                  </Badge>
                  <Text>Customer Management</Text>
                </Group>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Group>
                  <Badge color="green" variant="light" size="lg">
                    ✓ Complete
                  </Badge>
                  <Text>Product Management</Text>
                </Group>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Group>
                  <Badge color="green" variant="light" size="lg">
                    ✓ Complete
                  </Badge>
                  <Text>Invoice System</Text>
                </Group>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Group>
                  <Badge color="green" variant="light" size="lg">
                    ✓ Complete
                  </Badge>
                  <Text>Vendor Management</Text>
                </Group>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Group>
                  <Badge color="green" variant="light" size="lg">
                    ✓ Complete
                  </Badge>
                  <Text>Expense Tracking</Text>
                </Group>
              </Grid.Col>
              <Grid.Col span={{ base: 12, sm: 6, md: 4 }}>
                <Group>
                  <Badge color="green" variant="light" size="lg">
                    ✓ Complete
                  </Badge>
                  <Text>Banking & Reports</Text>
                </Group>
              </Grid.Col>
            </Grid>
          </Paper>

          {/* Main Demo Interface */}
          <Tabs value={activeTab} onChange={setActiveTab} orientation="horizontal">
            <Tabs.List grow>
              <Tabs.Tab value="overview" leftSection={<IconChartBar size={16} />}>
                Overview
              </Tabs.Tab>
              <Tabs.Tab value="customers" leftSection={<IconUsers size={16} />}>
                Customers
              </Tabs.Tab>
              <Tabs.Tab value="products" leftSection={<IconShoppingCart size={16} />}>
                Products
              </Tabs.Tab>
              <Tabs.Tab value="invoices" leftSection={<IconFileInvoice size={16} />}>
                Invoices
              </Tabs.Tab>
              <Tabs.Tab value="vendors" leftSection={<IconBuilding size={16} />}>
                Vendors
              </Tabs.Tab>
              <Tabs.Tab value="expenses" leftSection={<IconCreditCard size={16} />}>
                Expenses
              </Tabs.Tab>
              <Tabs.Tab value="banking" leftSection={<IconCash size={16} />}>
                Banking
              </Tabs.Tab>
              <Tabs.Tab value="reports" leftSection={<IconChartBar size={16} />}>
                Reports
              </Tabs.Tab>
              <Tabs.Tab value="settings" leftSection={<IconSettings size={16} />}>
                Settings
              </Tabs.Tab>
            </Tabs.List>

            {/* Overview Tab */}
            <Tabs.Panel value="overview" pt="md">
              <Grid>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <ComponentShowcase title="Currency Display Component">
                    <Stack gap="md">
                      <Group>
                        <Text>Amount: </Text>
                        <CurrencyDisplay amount={1234.56} />
                      </Group>
                      <Group>
                        <Text>Large Amount: </Text>
                        <CurrencyDisplay amount={1234567.89} />
                      </Group>
                      <Group>
                        <Text>Negative Amount: </Text>
                        <CurrencyDisplay amount={-500.25} />
                      </Group>
                    </Stack>
                  </ComponentShowcase>
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 6 }}>
                  <ComponentShowcase title="Demo Statistics">
                    <Stack gap="md">
                      <Group justify="space-between">
                        <Text>Total Components</Text>
                        <Badge color="blue">25+</Badge>
                      </Group>
                      <Group justify="space-between">
                        <Text>Modules Completed</Text>
                        <Badge color="green">8/8</Badge>
                      </Group>
                      <Group justify="space-between">
                        <Text>Test Coverage</Text>
                        <Badge color="teal">Interactive</Badge>
                      </Group>
                    </Stack>
                  </ComponentShowcase>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            {/* Customers Tab */}
            <Tabs.Panel value="customers" pt="md">
              <ComponentShowcase title="Customer Management Component">
                <CustomerList
                  onEdit={handleCustomerEdit}
                  onDelete={handleCustomerDelete}
                  onCreateInvoice={handleCreateInvoice}
                />
              </ComponentShowcase>
            </Tabs.Panel>

            {/* Products Tab */}
            <Tabs.Panel value="products" pt="md">
              <ComponentShowcase title="Product Management Component">
                <ProductList
                  onProductSelect={(product) => setSelectedProduct(product)}
                  selectionMode={false}
                />
              </ComponentShowcase>
            </Tabs.Panel>

            {/* Invoices Tab */}
            <Tabs.Panel value="invoices" pt="md">
              <ComponentShowcase title="Invoice Management Component">
                <InvoiceList />
              </ComponentShowcase>
            </Tabs.Panel>

            {/* Vendors Tab */}
            <Tabs.Panel value="vendors" pt="md">
              <ComponentShowcase title="Vendor Management Component">
                <VendorList onCreateVendor={handleVendorCreate} onEditVendor={handleVendorEdit} />
              </ComponentShowcase>
            </Tabs.Panel>

            {/* Expenses Tab */}
            <Tabs.Panel value="expenses" pt="md">
              <Grid>
                <Grid.Col span={12}>
                  <ComponentShowcase title="Bill Management Component">
                    <BillList />
                  </ComponentShowcase>
                </Grid.Col>
                <Grid.Col span={12}>
                  <ComponentShowcase title="Expense Management Component">
                    <ExpenseList />
                  </ComponentShowcase>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            {/* Banking Tab */}
            <Tabs.Panel value="banking" pt="md">
              <Grid>
                <Grid.Col span={12}>
                  <ComponentShowcase title="Bank Account Management">
                    <BankAccountList />
                  </ComponentShowcase>
                </Grid.Col>
                <Grid.Col span={12}>
                  <ComponentShowcase title="Transaction List">
                    <TransactionList />
                  </ComponentShowcase>
                </Grid.Col>
              </Grid>
            </Tabs.Panel>

            {/* Reports Tab */}
            <Tabs.Panel value="reports" pt="md">
              <Tabs defaultValue="profit-loss" orientation="horizontal">
                <Tabs.List>
                  <Tabs.Tab value="profit-loss">Profit & Loss</Tabs.Tab>
                  <Tabs.Tab value="balance-sheet">Balance Sheet</Tabs.Tab>
                  <Tabs.Tab value="export">Export Tools</Tabs.Tab>
                </Tabs.List>

                <Tabs.Panel value="profit-loss" pt="md">
                  <ComponentShowcase title="Profit & Loss Report">
                    <ProfitLoss />
                  </ComponentShowcase>
                </Tabs.Panel>

                <Tabs.Panel value="balance-sheet" pt="md">
                  <ComponentShowcase title="Balance Sheet Report">
                    <BalanceSheet />
                  </ComponentShowcase>
                </Tabs.Panel>

                <Tabs.Panel value="export" pt="md">
                  <ComponentShowcase title="Report Export Component">
                    <Group>
                      <ReportExport
                        reportType="profit-loss"
                        reportData={{}}
                        onExport={async (data) => {
                          console.log("Exporting:", data);
                        }}
                      />
                      <ReportExport
                        reportType="balance-sheet"
                        reportData={{}}
                        onExport={async (data) => {
                          console.log("Exporting:", data);
                        }}
                        buttonVariant="outline"
                      />
                    </Group>
                  </ComponentShowcase>
                </Tabs.Panel>
              </Tabs>
            </Tabs.Panel>

            {/* Settings Tab */}
            <Tabs.Panel value="settings" pt="md">
              <ComponentShowcase title="Currency Settings Component">
                <CurrencySettings />
              </ComponentShowcase>
            </Tabs.Panel>
          </Tabs>

          {/* Action Buttons */}
          <Paper p="lg" withBorder>
            <Title order={4} mb="md">
              Quick Actions
            </Title>
            <Group>
              <Button leftSection={<IconPlus size={16} />} onClick={openVendorModal}>
                Test Vendor Form
              </Button>
              <Button leftSection={<IconFileInvoice size={16} />} onClick={openInvoiceModal}>
                Test Invoice Form
              </Button>
              <Button variant="outline" leftSection={<IconEye size={16} />}>
                View All Components
              </Button>
            </Group>
          </Paper>
        </Stack>

        {/* Modals for Testing */}
        <Modal
          opened={vendorModalOpened}
          onClose={closeVendorModal}
          title="Test Vendor Form"
          size="lg">
          <VendorForm
            opened={vendorModalOpened}
            onClose={closeVendorModal}
            onSuccess={() => {
              console.log("Vendor created successfully");
              closeVendorModal();
            }}
          />
        </Modal>

        <Modal
          opened={invoiceModalOpened}
          onClose={closeInvoiceModal}
          title="Test Invoice Form"
          size="xl">
          <InvoiceForm
            customers={mockCustomers}
            onSubmit={(data) => {
              console.log("Invoice form submitted:", data);
              closeInvoiceModal();
            }}
            onCancel={closeInvoiceModal}
          />
        </Modal>
      </Container>
    </motion.div>
  );
}
