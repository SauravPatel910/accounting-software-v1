import { useState, useEffect } from "react";
// prettier-ignore
import { Modal, Button, TextInput, Group, Grid, Select, Textarea, Stack, Title, Table, NumberInput, ActionIcon, Paper, Text, Divider } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconPlus, IconTrash } from "@tabler/icons-react";
import Decimal from "decimal.js";
import { useCurrency } from "../../hooks/useCurrency";
// prettier-ignore
import { billApi, vendorApi, type Bill, type CreateBillData, type BillItem, type Vendor } from "../../services/api";

interface BillFormProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  bill?: Bill;
}

interface BillFormData {
  vendorId: string;
  billDate: Date;
  dueDate: Date;
  description: string;
  notes: string;
  items: Omit<BillItem, "id">[];
  taxRate: number;
  referenceNumber: string;
}

export default function BillForm({ opened, onClose, onSuccess, bill }: BillFormProps) {
  const { formatAmount, getCurrencySymbol } = useCurrency();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(false);
  const isEdit = !!bill;

  const form = useForm<BillFormData>({
    initialValues: {
      vendorId: "",
      billDate: new Date(),
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      description: "",
      notes: "",
      items: [{ description: "", quantity: 1, unitPrice: 0, total: 0, category: "" }],
      taxRate: 0,
      referenceNumber: "",
    },
    validate: {
      vendorId: (value) => (!value ? "Vendor is required" : null),
      description: (value) => (!value.trim() ? "Description is required" : null),
      items: {
        description: (value) => (!value?.trim() ? "Item description is required" : null),
        quantity: (value) => (!value || value <= 0 ? "Quantity must be greater than 0" : null),
        unitPrice: (value) =>
          value === undefined || value < 0 ? "Unit price must be 0 or greater" : null,
      },
    },
  });

  useEffect(() => {
    if (opened) {
      loadVendors();
    }
  }, [opened]);

  useEffect(() => {
    if (bill) {
      form.setValues({
        vendorId: bill.vendorId,
        billDate: new Date(bill.billDate),
        dueDate: new Date(bill.dueDate),
        description: bill.description,
        notes: bill.notes || "",
        items: bill.items.map((item) => ({
          description: item.description,
          quantity: item.quantity,
          unitPrice: item.unitPrice,
          total: item.total,
          category: item.category || "",
        })),
        taxRate: bill.taxRate,
        referenceNumber: bill.referenceNumber || "",
      });
    } else {
      form.reset();
    }
  }, [bill, opened]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadVendors = async () => {
    try {
      const data = await vendorApi.getAll();
      setVendors(data);
    } catch (error) {
      console.error("Failed to load vendors:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load vendors",
        color: "red",
      });
    }
  };

  const addItem = () => {
    form.insertListItem("items", {
      description: "",
      quantity: 1,
      unitPrice: 0,
      total: 0,
      category: "",
    });
  };

  const removeItem = (index: number) => {
    form.removeListItem("items", index);
  };

  const calculateItemTotal = (index: number) => {
    const item = form.values.items[index];
    if (item && typeof item.quantity === "number" && typeof item.unitPrice === "number") {
      const quantity = new Decimal(item.quantity);
      const unitPrice = new Decimal(item.unitPrice);
      const total = quantity.mul(unitPrice).toNumber();

      form.setFieldValue(`items.${index}.total`, total);
    }
  };

  const calculateTotals = () => {
    const items = form.values.items;
    const subtotal = items.reduce((sum, item) => {
      const quantity = new Decimal(item.quantity || 0);
      const unitPrice = new Decimal(item.unitPrice || 0);
      return sum.add(quantity.mul(unitPrice));
    }, new Decimal(0));

    const taxRate = new Decimal(form.values.taxRate || 0);
    const taxAmount = subtotal.mul(taxRate).div(100);
    const total = subtotal.add(taxAmount);

    return {
      subtotal: subtotal.toNumber(),
      taxAmount: taxAmount.toNumber(),
      total: total.toNumber(),
    };
  };

  const totals = calculateTotals();

  const handleSubmit = async (values: BillFormData) => {
    try {
      setLoading(true);

      const billData: CreateBillData = {
        vendorId: values.vendorId,
        billDate: values.billDate,
        dueDate: values.dueDate,
        description: values.description,
        notes: values.notes,
        items: values.items,
        taxRate: values.taxRate,
        referenceNumber: values.referenceNumber,
      };

      if (isEdit && bill) {
        await billApi.update(bill.id, billData);
        notifications.show({
          title: "Success",
          message: "Bill updated successfully",
          color: "green",
        });
      } else {
        await billApi.create(billData);
        notifications.show({
          title: "Success",
          message: "Bill created successfully",
          color: "green",
        });
      }

      onSuccess?.();
      onClose();
      form.reset();
    } catch (error) {
      console.error("Failed to save bill:", error);
      notifications.show({
        title: "Error",
        message: `Failed to ${isEdit ? "update" : "create"} bill`,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={3}>{isEdit ? "Edit Bill" : "Create New Bill"}</Title>}
      size="xl"
      centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Vendor"
                placeholder="Select vendor"
                data={vendors.map((vendor) => ({
                  value: vendor.id,
                  label: `${vendor.name} (${vendor.company})`,
                }))}
                required
                searchable
                {...form.getInputProps("vendorId")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Reference Number"
                placeholder="Enter reference number"
                {...form.getInputProps("referenceNumber")}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={6}>
              <DateInput
                label="Bill Date"
                placeholder="Select bill date"
                required
                {...form.getInputProps("billDate")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <DateInput
                label="Due Date"
                placeholder="Select due date"
                required
                {...form.getInputProps("dueDate")}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Description"
            placeholder="Enter bill description"
            required
            {...form.getInputProps("description")}
          />

          {/* Line Items */}
          <div>
            <Group justify="space-between" mb="md">
              <Text fw={500}>Line Items</Text>
              <Button
                leftSection={<IconPlus size={16} />}
                variant="light"
                size="sm"
                onClick={addItem}>
                Add Item
              </Button>
            </Group>

            <Paper withBorder>
              <Table>
                <Table.Thead>
                  <Table.Tr>
                    <Table.Th style={{ width: "40%" }}>Description</Table.Th>
                    <Table.Th style={{ width: "15%" }}>Quantity</Table.Th>
                    <Table.Th style={{ width: "20%" }}>Unit Price</Table.Th>
                    <Table.Th style={{ width: "20%" }}>Total</Table.Th>
                    <Table.Th style={{ width: "5%" }}></Table.Th>
                  </Table.Tr>
                </Table.Thead>
                <Table.Tbody>
                  {form.values.items.map((item, index) => (
                    <Table.Tr key={index}>
                      <Table.Td>
                        <TextInput
                          placeholder="Item description"
                          {...form.getInputProps(`items.${index}.description`)}
                        />
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          placeholder="1"
                          min={0}
                          step={1}
                          {...form.getInputProps(`items.${index}.quantity`)}
                          onChange={(value) => {
                            form.setFieldValue(
                              `items.${index}.quantity`,
                              typeof value === "string" ? parseFloat(value) || 0 : value || 0
                            );
                            calculateItemTotal(index);
                          }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <NumberInput
                          placeholder="0.00"
                          min={0}
                          step={0.01}
                          decimalScale={2}
                          prefix={getCurrencySymbol()}
                          {...form.getInputProps(`items.${index}.unitPrice`)}
                          onChange={(value) => {
                            form.setFieldValue(
                              `items.${index}.unitPrice`,
                              typeof value === "string" ? parseFloat(value) || 0 : value || 0
                            );
                            calculateItemTotal(index);
                          }}
                        />
                      </Table.Td>
                      <Table.Td>
                        <Text>{formatAmount(item.total)}</Text>
                      </Table.Td>
                      <Table.Td>
                        <ActionIcon
                          color="red"
                          variant="subtle"
                          onClick={() => removeItem(index)}
                          disabled={form.values.items.length === 1}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Table.Td>
                    </Table.Tr>
                  ))}
                </Table.Tbody>
              </Table>
            </Paper>
          </div>

          {/* Tax and Totals */}
          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                label="Tax Rate (%)"
                placeholder="0"
                min={0}
                max={100}
                step={0.01}
                decimalScale={2}
                {...form.getInputProps("taxRate")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Paper p="md" withBorder>
                <Stack gap="xs">
                  <Group justify="space-between">
                    <Text>Subtotal:</Text>
                    <Text>{formatAmount(totals.subtotal)}</Text>
                  </Group>
                  <Group justify="space-between">
                    <Text>Tax ({form.values.taxRate}%):</Text>
                    <Text>{formatAmount(totals.taxAmount)}</Text>
                  </Group>
                  <Divider />
                  <Group justify="space-between">
                    <Text fw={500} size="lg">
                      Total:
                    </Text>
                    <Text fw={500} size="lg">
                      {formatAmount(totals.total)}
                    </Text>
                  </Group>
                </Stack>
              </Paper>
            </Grid.Col>
          </Grid>

          {/* Notes */}
          <Textarea
            label="Notes"
            placeholder="Additional notes about this bill"
            rows={3}
            {...form.getInputProps("notes")}
          />

          {/* Form Actions */}
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? "Update Bill" : "Create Bill"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
