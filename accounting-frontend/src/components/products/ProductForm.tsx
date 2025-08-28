import { useState, useEffect } from "react";
import { useForm } from "@mantine/form";
// prettier-ignore
import { Modal, Button, TextInput, Group, Grid, Select, Stack, Title, NumberInput, Textarea, Switch } from "@mantine/core";
import { notifications } from "@mantine/notifications";
import { productApi, type Product, type CreateProductData } from "../../services/api";

interface ProductFormProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  product?: Product;
}

interface ProductFormData {
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

export default function ProductForm({ opened, onClose, onSuccess, product }: ProductFormProps) {
  const [loading, setLoading] = useState(false);

  const isEdit = Boolean(product);

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

  // Reset form when modal opens/closes or product changes
  useEffect(() => {
    if (opened && product) {
      form.setValues({
        name: product.name,
        brand: product.brand,
        size: product.size,
        pattern: product.pattern || "",
        loadIndex: product.loadIndex || "",
        speedRating: product.speedRating || "",
        type: product.type,
        price: product.price,
        costPrice: product.costPrice || 0,
        stock: product.stock,
        minStock: product.minStock || 0,
        sku: product.sku,
        description: product.description || "",
        category: product.category,
        isActive: product.isActive,
      });
    } else if (opened && !product) {
      form.reset();
    }
  }, [product, opened]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSubmit = async (values: ProductFormData) => {
    try {
      setLoading(true);

      const productData: CreateProductData = {
        name: values.name,
        brand: values.brand,
        size: values.size,
        pattern: values.pattern || undefined,
        loadIndex: values.loadIndex || undefined,
        speedRating: values.speedRating || undefined,
        type: values.type,
        price: values.price,
        costPrice: values.costPrice || undefined,
        stock: values.stock,
        minStock: values.minStock || undefined,
        sku: values.sku,
        description: values.description || undefined,
        category: values.category,
        isActive: values.isActive,
      };

      if (isEdit && product) {
        await productApi.update(product.id, productData);
        notifications.show({
          title: "Success",
          message: "Product updated successfully",
          color: "green",
        });
      } else {
        await productApi.create(productData);
        notifications.show({
          title: "Success",
          message: "Product created successfully",
          color: "green",
        });
      }

      onSuccess?.();
      onClose();
      form.reset();
    } catch (error) {
      console.error("Failed to save product:", error);
      notifications.show({
        title: "Error",
        message: `Failed to ${isEdit ? "update" : "create"} product`,
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
      title={<Title order={3}>{isEdit ? "Edit Product" : "Create New Product"}</Title>}
      size="xl"
      centered
      zIndex={1000}
      overlayProps={{
        backgroundOpacity: 0.55,
        blur: 3,
      }}>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
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
          <Grid>
            <Grid.Col span={3}>
              <NumberInput
                label="Selling Price"
                placeholder="0.00"
                min={0}
                step={0.01}
                decimalScale={2}
                fixedDecimalScale
                prefix="$"
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
                prefix="$"
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
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEdit ? "Update Product" : "Create Product"}
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
