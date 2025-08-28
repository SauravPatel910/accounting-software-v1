import { useState } from "react";
import { useForm } from "@mantine/form";
// prettier-ignore
import { Box, TextInput, Textarea, Button, Group, Paper, Title, Select, Grid, Stack, Table, ActionIcon, NumberInput, Text, Divider, Card } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX, IconPlus, IconTrash, IconCalculator } from "@tabler/icons-react";
import Decimal from "decimal.js";
import type { Invoice, Customer, InvoiceItem, CreateInvoiceData } from "../../services/api";

interface InvoiceFormProps {
  invoice?: Partial<Invoice>;
  customers: Customer[];
  onSubmit: (data: CreateInvoiceData) => void;
  onCancel: () => void;
  loading?: boolean;
}

// Mock customers data
const mockCustomers: Customer[] = [
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

export function InvoiceForm({
  invoice,
  customers = mockCustomers,
  onSubmit,
  onCancel,
  loading = false,
}: InvoiceFormProps) {
  const [items, setItems] = useState<InvoiceItem[]>(
    invoice?.items || [
      {
        id: "1",
        description: "",
        quantity: 1,
        unitPrice: 0,
        total: 0,
      },
    ]
  );

  const form = useForm<CreateInvoiceData>({
    validate: {
      customerId: (value: string) => (!value ? "Please select a customer" : null),
      invoiceNumber: (value: string) => (!value ? "Invoice number is required" : null),
      issueDate: (value: Date) => (!value ? "Issue date is required" : null),
      dueDate: (value: Date) => (!value ? "Due date is required" : null),
      description: (value: string) => (!value ? "Description is required" : null),
    },
    initialValues: {
      customerId: invoice?.customerId || "",
      invoiceNumber:
        invoice?.invoiceNumber || `INV-${new Date().getFullYear()}-${String(Date.now()).slice(-3)}`,
      issueDate: invoice?.issueDate || new Date(),
      dueDate: invoice?.dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: invoice?.description || "",
      notes: invoice?.notes || "",
      status: invoice?.status || "draft",
      items: [],
      taxRate: 10, // Default 10% tax
    },
  });

  // Calculate totals using Decimal.js for precision
  const calculateTotals = (currentItems: InvoiceItem[], taxRate: number) => {
    const subtotal = currentItems.reduce((sum, item) => {
      const itemTotal = new Decimal(item.quantity).mul(item.unitPrice);
      return sum.add(itemTotal);
    }, new Decimal(0));

    const taxAmount = subtotal.mul(taxRate).div(100);
    const total = subtotal.add(taxAmount);

    return {
      subtotal: subtotal.toNumber(),
      taxAmount: taxAmount.toNumber(),
      total: total.toNumber(),
    };
  };

  // Update item and recalculate totals
  const updateItem = (index: number, field: keyof InvoiceItem, value: string | number) => {
    const newItems = [...items];
    const item = newItems[index];

    if (field === "quantity" || field === "unitPrice") {
      const quantity = field === "quantity" ? Number(value) : item.quantity;
      const unitPrice = field === "unitPrice" ? Number(value) : item.unitPrice;

      if (field === "quantity") {
        item.quantity = Number(value);
      } else {
        item.unitPrice = Number(value);
      }
      item.total = new Decimal(quantity).mul(unitPrice).toNumber();
    } else if (field === "description") {
      item.description = value as string;
    }

    setItems(newItems);

    // Update form totals
    const totals = calculateTotals(newItems, form.values.taxRate);
    form.setValues({
      ...form.values,
      ...totals,
      items: newItems,
    });
  };

  // Add new item
  const addItem = () => {
    const newItem: InvoiceItem = {
      id: Date.now().toString(),
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
    };

    const newItems = [...items, newItem];
    setItems(newItems);
  };

  // Remove item
  const removeItem = (index: number) => {
    if (items.length > 1) {
      const newItems = items.filter((_, i) => i !== index);
      setItems(newItems);

      const totals = calculateTotals(newItems, form.values.taxRate);
      form.setValues({
        ...form.values,
        ...totals,
        items: newItems,
      });
    }
  };

  // Update tax rate
  const updateTaxRate = (taxRate: number) => {
    const totals = calculateTotals(items, taxRate);
    form.setValues({
      ...form.values,
      taxRate,
      ...totals,
    });
  };

  // Get selected customer details
  const selectedCustomer = customers.find((c) => c.id === form.values.customerId);

  const handleSubmit = (values: CreateInvoiceData) => {
    try {
      const submissionData = {
        ...values,
        items: items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
        })),
        ...calculateTotals(items, values.taxRate),
      };

      onSubmit(submissionData);
      notifications.show({
        title: invoice ? "Invoice Updated" : "Invoice Created",
        message: invoice
          ? "Invoice has been updated successfully"
          : "New invoice has been created successfully",
        color: "green",
        icon: <IconCheck size={16} />,
      });
    } catch {
      notifications.show({
        title: "Error",
        message: "Something went wrong. Please try again.",
        color: "red",
        icon: <IconX size={16} />,
      });
    }
  };

  const customerOptions = customers.map((customer) => ({
    value: customer.id,
    label: `${customer.name} - ${customer.company}`,
  }));

  return (
    <Paper shadow="xs" radius="md" p="md" withBorder>
      <Title order={3} mb="lg">
        {invoice ? "Edit Invoice" : "Create New Invoice"}
      </Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="xl">
          {/* Invoice Header */}
          <Box>
            <Title order={5} mb="sm" c="dimmed">
              Invoice Information
            </Title>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Customer"
                  placeholder="Select a customer"
                  data={customerOptions}
                  required
                  searchable
                  {...form.getInputProps("customerId")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Invoice Number"
                  placeholder="Enter invoice number"
                  required
                  {...form.getInputProps("invoiceNumber")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <DateInput
                  label="Issue Date"
                  placeholder="Select issue date"
                  required
                  {...form.getInputProps("issueDate")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <DateInput
                  label="Due Date"
                  placeholder="Select due date"
                  required
                  {...form.getInputProps("dueDate")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 8 }}>
                <TextInput
                  label="Description"
                  placeholder="Brief description of services/products"
                  required
                  {...form.getInputProps("description")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <Select
                  label="Status"
                  data={[
                    { value: "draft", label: "Draft" },
                    { value: "sent", label: "Sent" },
                    { value: "paid", label: "Paid" },
                    { value: "overdue", label: "Overdue" },
                    { value: "cancelled", label: "Cancelled" },
                  ]}
                  {...form.getInputProps("status")}
                />
              </Grid.Col>
            </Grid>
          </Box>

          {/* Customer Details Display */}
          {selectedCustomer && (
            <Card withBorder radius="md" p="md" bg="gray.0">
              <Title order={6} mb="sm">
                Bill To:
              </Title>
              <Text size="sm" fw={500}>
                {selectedCustomer.name}
              </Text>
              <Text size="sm">{selectedCustomer.company}</Text>
              <Text size="sm" c="dimmed">
                {selectedCustomer.email}
              </Text>
              <Text size="sm" c="dimmed">
                {selectedCustomer.address}, {selectedCustomer.city}, {selectedCustomer.country}
              </Text>
            </Card>
          )}

          {/* Line Items */}
          <Box>
            <Group justify="space-between" mb="sm">
              <Title order={5} c="dimmed">
                Line Items
              </Title>
              <Button
                leftSection={<IconPlus size={16} />}
                variant="light"
                size="sm"
                onClick={addItem}>
                Add Item
              </Button>
            </Group>

            <Paper withBorder radius="md" p="sm">
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th>Description</Table.Th>
                    <Table.Th style={{ width: "120px" }}>Quantity</Table.Th>
                    <Table.Th style={{ width: "140px" }}>Unit Price</Table.Th>
                    <Table.Th style={{ width: "140px" }}>Total</Table.Th>
                    <Table.Th style={{ width: "60px" }}>Action</Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {items.map((item, index) => (
                    <Table.Tr key={item.id}>
                      <Table.Td>
                        <TextInput
                          placeholder="Item description"
                          value={item.description}
                          onChange={(e) => updateItem(index, "description", e.target.value)}
                          size="sm"
                          variant="unstyled"
                        />
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          placeholder="0"
                          value={item.quantity}
                          onChange={(value) => updateItem(index, "quantity", value || 0)}
                          min={0}
                          step={1}
                          size="sm"
                          variant="unstyled"
                        />
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          placeholder="0.00"
                          value={item.unitPrice}
                          onChange={(value) => updateItem(index, "unitPrice", value || 0)}
                          min={0}
                          step={0.01}
                          decimalScale={2}
                          fixedDecimalScale
                          prefix="$"
                          size="sm"
                          variant="unstyled"
                        />
                      </Table.Td>
                      <Table.Td>
                        <Text size="sm" fw={500}>
                          ${item.total.toFixed(2)}
                        </Text>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => removeItem(index)}
                          disabled={items.length === 1}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </Box>

          {/* Totals */}
          <Box>
            <Paper withBorder radius="md" p="md">
              <Grid>
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <Textarea
                    label="Notes"
                    placeholder="Additional notes or payment terms"
                    rows={4}
                    {...form.getInputProps("notes")}
                  />
                </Grid.Col>
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Stack gap="sm">
                    <Group justify="space-between">
                      <Text size="sm">Subtotal:</Text>
                      <Text size="sm" fw={500}>
                        ${calculateTotals(items, form.values.taxRate).subtotal.toFixed(2)}
                      </Text>
                    </Group>

                    <Group justify="space-between" align="flex-end">
                      <NumberInput
                        label="Tax Rate (%)"
                        value={form.values.taxRate}
                        onChange={(value) => updateTaxRate(typeof value === "number" ? value : 0)}
                        min={0}
                        max={100}
                        step={0.1}
                        decimalScale={1}
                        size="sm"
                        style={{ width: "120px" }}
                      />
                      <Text size="sm" fw={500}>
                        ${calculateTotals(items, form.values.taxRate).taxAmount.toFixed(2)}
                      </Text>
                    </Group>

                    <Divider />

                    <Group justify="space-between">
                      <Text size="lg" fw={700}>
                        Total:
                      </Text>
                      <Text size="lg" fw={700} c="green">
                        ${calculateTotals(items, form.values.taxRate).total.toFixed(2)}
                      </Text>
                    </Group>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Paper>
          </Box>

          {/* Form Actions */}
          <Group justify="flex-end" mt="xl">
            <Button variant="light" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading} leftSection={<IconCalculator size={16} />}>
              {invoice ? "Update Invoice" : "Create Invoice"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
