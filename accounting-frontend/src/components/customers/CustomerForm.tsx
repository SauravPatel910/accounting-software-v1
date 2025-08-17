import { useForm } from "@mantine/form";
import {
  Box,
  TextInput,
  Textarea,
  Button,
  Group,
  Paper,
  Title,
  Select,
  Grid,
  Stack,
} from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";

// Type definition
interface CustomerFormData {
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  status: "active" | "inactive";
  notes?: string;
}

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  address: string;
  city: string;
  state?: string;
  postalCode?: string;
  country: string;
  status: "active" | "inactive";
  notes?: string;
  totalInvoices: number;
  totalAmount: number;
  lastInvoice: string;
  createdAt: string;
}

interface CustomerFormProps {
  customer?: Customer;
  onSubmit: (data: CustomerFormData) => void;
  onCancel: () => void;
  loading?: boolean;
}

const countryOptions = [
  { value: "USA", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "UK", label: "United Kingdom" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "Australia", label: "Australia" },
  { value: "India", label: "India" },
  { value: "Japan", label: "Japan" },
  { value: "Other", label: "Other" },
];

export function CustomerForm({ customer, onSubmit, onCancel, loading = false }: CustomerFormProps) {
  const form = useForm<CustomerFormData>({
    validate: {
      name: (value) => {
        if (!value) return "Name is required";
        if (value.length < 2) return "Name must be at least 2 characters";
        return null;
      },
      email: (value) => {
        if (!value) return "Email is required";
        if (!/^\S+@\S+$/.test(value)) return "Invalid email format";
        return null;
      },
      phone: (value) => (!value ? "Phone is required" : null),
      company: (value) => (!value ? "Company is required" : null),
      address: (value) => (!value ? "Address is required" : null),
      city: (value) => (!value ? "City is required" : null),
      country: (value) => (!value ? "Country is required" : null),
    },
    initialValues: {
      name: customer?.name || "",
      email: customer?.email || "",
      phone: customer?.phone || "",
      company: customer?.company || "",
      address: customer?.address || "",
      city: customer?.city || "",
      state: customer?.state || "",
      postalCode: customer?.postalCode || "",
      country: customer?.country || "USA",
      status: customer?.status || "active",
      notes: customer?.notes || "",
    },
  });

  const handleSubmit = (values: CustomerFormData) => {
    try {
      onSubmit(values);
      notifications.show({
        title: customer ? "Customer Updated" : "Customer Created",
        message: customer
          ? "Customer information has been updated successfully"
          : "New customer has been created successfully",
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

  return (
    <Paper shadow="xs" radius="md" p="md" withBorder>
      <Title order={3} mb="lg">
        {customer ? "Edit Customer" : "Add New Customer"}
      </Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <Box>
            <Title order={5} mb="sm" c="dimmed">
              Basic Information
            </Title>
            <Grid>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Full Name"
                  placeholder="Enter customer's full name"
                  required
                  {...form.getInputProps("name")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Company"
                  placeholder="Enter company name"
                  required
                  {...form.getInputProps("company")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Email"
                  placeholder="Enter email address"
                  type="email"
                  required
                  {...form.getInputProps("email")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <TextInput
                  label="Phone"
                  placeholder="Enter phone number"
                  required
                  {...form.getInputProps("phone")}
                />
              </Grid.Col>
            </Grid>
          </Box>

          {/* Address Information */}
          <Box>
            <Title order={5} mb="sm" c="dimmed">
              Address Information
            </Title>
            <Grid>
              <Grid.Col span={12}>
                <TextInput
                  label="Address"
                  placeholder="Enter street address"
                  required
                  {...form.getInputProps("address")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label="City"
                  placeholder="Enter city"
                  required
                  {...form.getInputProps("city")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label="State/Province"
                  placeholder="Enter state or province"
                  {...form.getInputProps("state")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 4 }}>
                <TextInput
                  label="Postal Code"
                  placeholder="Enter postal code"
                  {...form.getInputProps("postalCode")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Country"
                  placeholder="Select country"
                  data={countryOptions}
                  required
                  searchable
                  {...form.getInputProps("country")}
                />
              </Grid.Col>
              <Grid.Col span={{ base: 12, md: 6 }}>
                <Select
                  label="Status"
                  placeholder="Select status"
                  data={[
                    { value: "active", label: "Active" },
                    { value: "inactive", label: "Inactive" },
                  ]}
                  required
                  {...form.getInputProps("status")}
                />
              </Grid.Col>
            </Grid>
          </Box>

          {/* Additional Information */}
          <Box>
            <Title order={5} mb="sm" c="dimmed">
              Additional Information
            </Title>
            <Textarea
              label="Notes"
              placeholder="Enter any additional notes about the customer"
              rows={4}
              {...form.getInputProps("notes")}
            />
          </Box>

          {/* Form Actions */}
          <Group justify="flex-end" mt="xl">
            <Button variant="light" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {customer ? "Update Customer" : "Create Customer"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
