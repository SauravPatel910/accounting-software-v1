import { useState, useEffect } from "react";
// prettier-ignore
import { Modal, Button, TextInput, Group, Grid, Select, Textarea, Stack, Title, NumberInput, FileInput, Text, Paper, Divider, Autocomplete } from "@mantine/core";
import { DateInput } from "@mantine/dates";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { IconReceipt } from "@tabler/icons-react";
import Decimal from "decimal.js";
import { useCurrency } from "../../hooks/useCurrency";
// prettier-ignore
import { expenseApi, vendorApi, expenseCategoryApi, type Expense, type CreateExpenseData, type Vendor, type ExpenseCategory } from "../../services/api";

interface ExpenseFormProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  expense?: Expense;
}

interface ExpenseFormData {
  vendorId: string;
  date: Date;
  category: string;
  description: string;
  amount: number;
  taxAmount: number;
  paymentMethod: "cash" | "card" | "check" | "bank_transfer" | "other";
  notes: string;
}

const PAYMENT_METHODS = [
  { value: "cash", label: "Cash" },
  { value: "card", label: "Credit/Debit Card" },
  { value: "check", label: "Check" },
  { value: "bank_transfer", label: "Bank Transfer" },
  { value: "other", label: "Other" },
];

const DEFAULT_CATEGORIES = [
  "Office Supplies",
  "Travel",
  "Meals & Entertainment",
  "Professional Services",
  "Software & Subscriptions",
  "Marketing & Advertising",
  "Utilities",
  "Rent",
  "Insurance",
  "Other",
];

export default function ExpenseForm({ opened, onClose, onSuccess, expense }: ExpenseFormProps) {
  const { formatAmount, getCurrencySymbol } = useCurrency();
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [categories, setCategories] = useState<ExpenseCategory[]>([]);
  const [loading, setLoading] = useState(false);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const isEdit = !!expense;

  const form = useForm<ExpenseFormData>({
    initialValues: {
      vendorId: "",
      date: new Date(),
      category: "",
      description: "",
      amount: 0,
      taxAmount: 0,
      paymentMethod: "card",
      notes: "",
    },
    validate: {
      category: (value) => (!value.trim() ? "Category is required" : null),
      description: (value) => (!value.trim() ? "Description is required" : null),
      amount: (value) => (!value || value <= 0 ? "Amount must be greater than 0" : null),
      taxAmount: (value) =>
        value === undefined || value < 0 ? "Tax amount must be 0 or greater" : null,
    },
  });

  useEffect(() => {
    if (opened) {
      loadData();
    }
  }, [opened]);

  useEffect(() => {
    if (expense) {
      form.setValues({
        vendorId: expense.vendorId || "",
        date: new Date(expense.date),
        category: expense.category,
        description: expense.description,
        amount: expense.amount,
        taxAmount: expense.taxAmount,
        paymentMethod: expense.paymentMethod,
        notes: expense.notes || "",
      });
    } else {
      form.reset();
    }
  }, [expense, opened]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadData = async () => {
    try {
      const [vendorsData, categoriesData] = await Promise.all([
        vendorApi.getAll(),
        expenseCategoryApi.getAll().catch(() => []), // Categories might not be implemented yet
      ]);
      setVendors(vendorsData);
      setCategories(categoriesData);
    } catch (error) {
      console.error("Failed to load data:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load vendors",
        color: "red",
      });
    }
  };

  const calculateTotal = () => {
    const amount = new Decimal(form.values.amount || 0);
    const taxAmount = new Decimal(form.values.taxAmount || 0);
    return amount.add(taxAmount).toNumber();
  };

  const total = calculateTotal();

  const handleSubmit = async (values: ExpenseFormData) => {
    try {
      setLoading(true);

      const expenseData: CreateExpenseData = {
        vendorId: values.vendorId || undefined,
        date: values.date,
        category: values.category,
        description: values.description,
        amount: values.amount,
        taxAmount: values.taxAmount,
        paymentMethod: values.paymentMethod,
        notes: values.notes,
      };

      let savedExpense: Expense;

      if (isEdit && expense) {
        savedExpense = await expenseApi.update(expense.id, expenseData);
        notifications.show({
          title: "Success",
          message: "Expense updated successfully",
          color: "green",
        });
      } else {
        savedExpense = await expenseApi.create(expenseData);
        notifications.show({
          title: "Success",
          message: "Expense created successfully",
          color: "green",
        });
      }

      // Upload receipt if provided
      if (receiptFile && savedExpense) {
        try {
          await expenseApi.uploadReceipt(savedExpense.id, receiptFile);
          notifications.show({
            title: "Success",
            message: "Receipt uploaded successfully",
            color: "green",
          });
        } catch (error) {
          console.error("Failed to upload receipt:", error);
          notifications.show({
            title: "Warning",
            message: "Expense saved but receipt upload failed",
            color: "orange",
          });
        }
      }

      onSuccess?.();
      onClose();
      form.reset();
      setReceiptFile(null);
    } catch (error) {
      console.error("Failed to save expense:", error);
      notifications.show({
        title: "Error",
        message: `Failed to ${isEdit ? "update" : "create"} expense`,
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  // Combine API categories with default categories
  const categoryOptions = [
    ...categories.map((cat) => ({ value: cat.name, label: cat.name })),
    ...DEFAULT_CATEGORIES.filter((cat) => !categories.some((apiCat) => apiCat.name === cat)).map(
      (cat) => ({ value: cat, label: cat })
    ),
  ];

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={3}>{isEdit ? "Edit Expense" : "Add New Expense"}</Title>}
      size="lg"
      centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <Grid>
            <Grid.Col span={6}>
              <DateInput
                label="Date"
                placeholder="Select expense date"
                required
                {...form.getInputProps("date")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Vendor (Optional)"
                placeholder="Select vendor"
                data={[
                  { value: "", label: "No vendor" },
                  ...vendors.map((vendor) => ({
                    value: vendor.id,
                    label: `${vendor.name} (${vendor.company})`,
                  })),
                ]}
                searchable
                clearable
                {...form.getInputProps("vendorId")}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={6}>
              <Autocomplete
                label="Category"
                placeholder="Select or type category"
                data={categoryOptions.map((opt) => opt.value)}
                required
                value={form.values.category}
                onChange={(value) => form.setFieldValue("category", value)}
                error={form.errors.category}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Payment Method"
                placeholder="Select payment method"
                data={PAYMENT_METHODS}
                required
                {...form.getInputProps("paymentMethod")}
              />
            </Grid.Col>
          </Grid>

          <TextInput
            label="Description"
            placeholder="Enter expense description"
            required
            {...form.getInputProps("description")}
          />

          {/* Amount and Tax */}
          <Grid>
            <Grid.Col span={6}>
              <NumberInput
                label="Amount"
                placeholder="0.00"
                min={0}
                step={0.01}
                decimalScale={2}
                prefix={getCurrencySymbol()}
                required
                {...form.getInputProps("amount")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <NumberInput
                label="Tax Amount"
                placeholder="0.00"
                min={0}
                step={0.01}
                decimalScale={2}
                prefix={getCurrencySymbol()}
                {...form.getInputProps("taxAmount")}
              />
            </Grid.Col>
          </Grid>

          {/* Total */}
          <Paper p="md" withBorder>
            <Group justify="space-between">
              <Text>Amount:</Text>
              <Text>{formatAmount(form.values.amount)}</Text>
            </Group>
            <Group justify="space-between">
              <Text>Tax:</Text>
              <Text>{formatAmount(form.values.taxAmount)}</Text>
            </Group>
            <Divider my="xs" />
            <Group justify="space-between">
              <Text fw={500} size="lg">
                Total:
              </Text>
              <Text fw={500} size="lg">
                {formatAmount(total)}
              </Text>
            </Group>
          </Paper>

          {/* Receipt Upload */}
          <FileInput
            label="Receipt"
            placeholder="Upload receipt image or PDF"
            leftSection={<IconReceipt size={16} />}
            accept="image/*,application/pdf"
            value={receiptFile}
            onChange={setReceiptFile}
          />

          {/* Notes */}
          <Textarea
            label="Notes"
            placeholder="Additional notes about this expense"
            rows={3}
            {...form.getInputProps("notes")}
          />

          {/* Form Actions */}
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? "Update Expense" : "Create Expense"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
