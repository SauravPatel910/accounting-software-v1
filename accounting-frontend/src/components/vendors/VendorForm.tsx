import { useEffect } from "react";
import {
  Modal,
  Button,
  TextInput,
  Group,
  Grid,
  Select,
  Textarea,
  Stack,
  Title,
} from "@mantine/core";
import { useForm } from "@mantine/form";
import { notifications } from "@mantine/notifications";
import { vendorApi, type Vendor, type CreateVendorData } from "../../services/api";

interface VendorFormProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  vendor?: Vendor;
}

const VENDOR_CATEGORIES = [
  { value: "preferred", label: "Preferred" },
  { value: "regular", label: "Regular" },
  { value: "temporary", label: "Temporary" },
];

const PAYMENT_TERMS = [
  { value: "Net 15", label: "Net 15" },
  { value: "Net 30", label: "Net 30" },
  { value: "Net 45", label: "Net 45" },
  { value: "Net 60", label: "Net 60" },
  { value: "Due on Receipt", label: "Due on Receipt" },
  { value: "2/10 Net 30", label: "2/10 Net 30" },
];

const COUNTRIES = [
  { value: "United States", label: "United States" },
  { value: "Canada", label: "Canada" },
  { value: "United Kingdom", label: "United Kingdom" },
  { value: "Australia", label: "Australia" },
  { value: "Germany", label: "Germany" },
  { value: "France", label: "France" },
  { value: "India", label: "India" },
];

export default function VendorForm({ opened, onClose, onSuccess, vendor }: VendorFormProps) {
  const isEdit = !!vendor;

  const form = useForm<CreateVendorData>({
    initialValues: {
      name: "",
      company: "",
      email: "",
      phone: "",
      address: "",
      city: "",
      state: "",
      zipCode: "",
      country: "United States",
      taxId: "",
      paymentTerms: "Net 30",
      category: "regular",
      notes: "",
    },
    validate: {
      name: (value) => (!value.trim() ? "Name is required" : null),
      company: (value) => (!value.trim() ? "Company is required" : null),
      email: (value) => {
        if (!value.trim()) return "Email is required";
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "Invalid email";
        return null;
      },
      address: (value) => (!value.trim() ? "Address is required" : null),
      city: (value) => (!value.trim() ? "City is required" : null),
      country: (value) => (!value.trim() ? "Country is required" : null),
    },
  });

  useEffect(() => {
    if (vendor) {
      form.setValues({
        name: vendor.name,
        company: vendor.company,
        email: vendor.email,
        phone: vendor.phone || "",
        address: vendor.address,
        city: vendor.city,
        state: vendor.state || "",
        zipCode: vendor.zipCode || "",
        country: vendor.country,
        taxId: vendor.taxId || "",
        paymentTerms: vendor.paymentTerms || "Net 30",
        category: vendor.category || "regular",
        notes: vendor.notes || "",
      });
    } else {
      form.reset();
    }
  }, [vendor, opened]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (values: CreateVendorData) => {
    try {
      if (isEdit && vendor) {
        await vendorApi.update(vendor.id, values);
        notifications.show({
          title: "Success",
          message: "Vendor updated successfully",
          color: "green",
        });
      } else {
        await vendorApi.create(values);
        notifications.show({
          title: "Success",
          message: "Vendor created successfully",
          color: "green",
        });
      }

      onSuccess?.();
      onClose();
      form.reset();
    } catch (error) {
      console.error("Failed to save vendor:", error);
      notifications.show({
        title: "Error",
        message: `Failed to ${isEdit ? "update" : "create"} vendor`,
        color: "red",
      });
    }
  };

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={<Title order={3}>{isEdit ? "Edit Vendor" : "Add New Vendor"}</Title>}
      size="lg"
      centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Contact Name"
                placeholder="Enter contact name"
                required
                {...form.getInputProps("name")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Company Name"
                placeholder="Enter company name"
                required
                {...form.getInputProps("company")}
              />
            </Grid.Col>
          </Grid>

          {/* Contact Information */}
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Email"
                placeholder="vendor@company.com"
                type="email"
                required
                {...form.getInputProps("email")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Phone"
                placeholder="(555) 123-4567"
                {...form.getInputProps("phone")}
              />
            </Grid.Col>
          </Grid>

          {/* Address */}
          <TextInput
            label="Address"
            placeholder="Street address"
            required
            {...form.getInputProps("address")}
          />

          <Grid>
            <Grid.Col span={4}>
              <TextInput label="City" placeholder="City" required {...form.getInputProps("city")} />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="State/Province"
                placeholder="State or Province"
                {...form.getInputProps("state")}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="ZIP/Postal Code"
                placeholder="ZIP Code"
                {...form.getInputProps("zipCode")}
              />
            </Grid.Col>
          </Grid>

          <Select
            label="Country"
            placeholder="Select country"
            data={COUNTRIES}
            required
            searchable
            {...form.getInputProps("country")}
          />

          {/* Business Information */}
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Tax ID"
                placeholder="Tax identification number"
                {...form.getInputProps("taxId")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Select
                label="Category"
                placeholder="Select category"
                data={VENDOR_CATEGORIES}
                {...form.getInputProps("category")}
              />
            </Grid.Col>
          </Grid>

          <Select
            label="Payment Terms"
            placeholder="Select payment terms"
            data={PAYMENT_TERMS}
            {...form.getInputProps("paymentTerms")}
          />

          {/* Notes */}
          <Textarea
            label="Notes"
            placeholder="Additional notes about this vendor"
            rows={3}
            {...form.getInputProps("notes")}
          />

          {/* Form Actions */}
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">{isEdit ? "Update Vendor" : "Create Vendor"}</Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
