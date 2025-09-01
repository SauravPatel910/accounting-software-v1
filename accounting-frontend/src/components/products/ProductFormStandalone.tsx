import { useForm } from "@mantine/form";
// prettier-ignore
import { Button, TextInput, Group, Grid, Select, Stack, NumberInput, Textarea, Switch, Paper, Title } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useCurrency } from "../../hooks/useCurrency";

export interface ProductFormData {
  name: string;
  brand: string;
  size: string;
  pattern: string;
  loadIndex: string;
  speedRating: string;
  type: "car" | "truck" | "motorcycle" | "atv" | "other";
  price: number;
  costPrice: number;
  stock: number;
  minStock: number;
  sku: string;
  description: string;
  category: string;
  isActive: boolean;
}

interface ProductFormStandaloneProps {
  onSubmit: (data: ProductFormData) => void;
  onCancel: () => void;
  loading?: boolean;
  isModal?: boolean;
}

const tyreTypes = [
  { value: "car", label: "Car Tyre" },
  { value: "truck", label: "Truck Tyre" },
  { value: "motorcycle", label: "Motorcycle Tyre" },
  { value: "atv", label: "ATV Tyre" },
  { value: "other", label: "Other" },
];

const tyreCategories = [
  { value: "summer", label: "Summer Tyres" },
  { value: "winter", label: "Winter Tyres" },
  { value: "all-season", label: "All-Season Tyres" },
  { value: "performance", label: "Performance Tyres" },
  { value: "off-road", label: "Off-Road Tyres" },
  { value: "commercial", label: "Commercial Tyres" },
];

export function ProductFormStandalone({
  onSubmit,
  onCancel,
  loading = false,
  isModal = false,
}: ProductFormStandaloneProps) {
  const { getCurrencySymbol } = useCurrency();

  const form = useForm<ProductFormData>({
    initialValues: {
      name: "",
      brand: "",
      size: "",
      pattern: "",
      loadIndex: "",
      speedRating: "",
      type: "car",
      price: 0,
      costPrice: 0,
      stock: 0,
      minStock: 0,
      sku: "",
      description: "",
      category: "",
      isActive: true,
    },
    validate: {
      name: (value) => (value.length < 2 ? "Name must have at least 2 letters" : null),
      brand: (value) => (value.length < 2 ? "Brand must have at least 2 letters" : null),
      size: (value) => (value.length < 3 ? "Size is required" : null),
      price: (value) => (value <= 0 ? "Price must be greater than 0" : null),
      stock: (value) => (value < 0 ? "Stock cannot be negative" : null),
      sku: (value) => (value.length < 3 ? "SKU must have at least 3 characters" : null),
      category: (value) => (!value ? "Category is required" : null),
    },
  });

  const handleSubmit = (values: ProductFormData) => {
    try {
      onSubmit(values);
      if (!isModal) {
        notifications.show({
          title: "Product Created",
          message: "New product has been created successfully",
          color: "green",
          icon: <IconCheck size={16} />,
        });
      }
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
    <Paper
      shadow={isModal ? "none" : "xs"}
      radius="md"
      p={isModal ? 0 : "md"}
      withBorder={!isModal}>
      <Title order={3} mb="lg">
        Create New Product
      </Title>

      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <Title order={5} mb="sm" c="dimmed">
            Basic Information
          </Title>
          <Grid>
            <Grid.Col span={6}>
              <TextInput
                label="Product Name"
                placeholder="Enter product name"
                required
                {...form.getInputProps("name")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <TextInput
                label="Brand"
                placeholder="Enter brand name"
                required
                {...form.getInputProps("brand")}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={4}>
              <TextInput
                label="Size"
                placeholder="e.g., 225/50R17"
                required
                {...form.getInputProps("size")}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Pattern"
                placeholder="e.g., Eagle F1"
                {...form.getInputProps("pattern")}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="SKU"
                placeholder="Enter SKU"
                required
                {...form.getInputProps("sku")}
              />
            </Grid.Col>
          </Grid>

          {/* Technical Specifications */}
          <Title order={5} mb="sm" c="dimmed">
            Technical Specifications
          </Title>
          <Grid>
            <Grid.Col span={4}>
              <TextInput
                label="Load Index"
                placeholder="e.g., 91"
                {...form.getInputProps("loadIndex")}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <TextInput
                label="Speed Rating"
                placeholder="e.g., H"
                {...form.getInputProps("speedRating")}
              />
            </Grid.Col>
            <Grid.Col span={4}>
              <Select
                label="Type"
                placeholder="Select tyre type"
                data={tyreTypes}
                required
                {...form.getInputProps("type")}
              />
            </Grid.Col>
          </Grid>

          <Grid>
            <Grid.Col span={6}>
              <Select
                label="Category"
                placeholder="Select category"
                data={tyreCategories}
                required
                searchable
                {...form.getInputProps("category")}
              />
            </Grid.Col>
            <Grid.Col span={6}>
              <Switch
                label="Active Product"
                description="Inactive products won't appear in invoice forms"
                {...form.getInputProps("isActive", { type: "checkbox" })}
              />
            </Grid.Col>
          </Grid>

          {/* Pricing and Stock */}
          <Title order={5} mb="sm" c="dimmed">
            Pricing and Stock
          </Title>
          <Grid>
            <Grid.Col span={3}>
              <NumberInput
                label="Selling Price"
                placeholder="0.00"
                min={0}
                step={0.01}
                decimalScale={2}
                fixedDecimalScale
                prefix={getCurrencySymbol()}
                required
                {...form.getInputProps("price")}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <NumberInput
                label="Cost Price"
                placeholder="0.00"
                min={0}
                step={0.01}
                decimalScale={2}
                fixedDecimalScale
                prefix={getCurrencySymbol()}
                {...form.getInputProps("costPrice")}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <NumberInput
                label="Stock Quantity"
                placeholder="0"
                min={0}
                step={1}
                required
                {...form.getInputProps("stock")}
              />
            </Grid.Col>
            <Grid.Col span={3}>
              <NumberInput
                label="Minimum Stock"
                placeholder="0"
                min={0}
                step={1}
                {...form.getInputProps("minStock")}
              />
            </Grid.Col>
          </Grid>

          <Textarea
            label="Description"
            placeholder="Enter product description"
            rows={3}
            {...form.getInputProps("description")}
          />

          {/* Form Actions */}
          <Group justify="flex-end" mt="xl">
            <Button variant="light" onClick={onCancel} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Product
            </Button>
          </Group>
        </Stack>
      </form>
    </Paper>
  );
}
