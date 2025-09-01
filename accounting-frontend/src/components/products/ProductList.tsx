import { useState, useEffect } from "react";
// prettier-ignore
import { Box, Text, Button, Group, Table, Paper, Badge, ActionIcon, Menu, TextInput, Select, Stack, Pagination, Modal, ScrollArea } from "@mantine/core";
// prettier-ignore
import { IconPlus, IconSearch, IconDotsVertical, IconEdit, IconTrash } from "@tabler/icons-react";
import { notifications } from "@mantine/notifications";
import { productApi, type Product } from "../../services/api";
import ProductForm from "./ProductForm";
import { useCurrency } from "../../hooks/useCurrency";

// Mock data for products (this would come from API)
const mockProductsData: Product[] = [
  {
    id: "PROD-001",
    name: "Pilot Sport 4",
    brand: "Michelin",
    size: "225/45R17",
    pattern: "Summer Performance",
    loadIndex: "94",
    speedRating: "Y",
    type: "car",
    price: 15000.0,
    costPrice: 12000.0,
    stock: 25,
    minStock: 5,
    sku: "MICH-PS4-225-45-17",
    description: "High-performance summer tyre for sports cars",
    category: "performance",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "PROD-002",
    name: "CrossClimate 2",
    brand: "Michelin",
    size: "205/55R16",
    pattern: "All-Season",
    loadIndex: "91",
    speedRating: "V",
    type: "car",
    price: 11500.0,
    costPrice: 9000.0,
    stock: 40,
    minStock: 10,
    sku: "MICH-CC2-205-55-16",
    description: "All-season tyre with excellent wet and dry performance",
    category: "all-season",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "PROD-003",
    name: "ContiPremiumContact 6",
    brand: "Continental",
    size: "195/65R15",
    pattern: "Comfort",
    loadIndex: "91",
    speedRating: "H",
    type: "car",
    price: 7800.0,
    costPrice: 6200.0,
    stock: 60,
    minStock: 15,
    sku: "CONT-CPC6-195-65-15",
    description: "Premium comfort tyre for everyday driving",
    category: "summer",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "PROD-004",
    name: "Geolandar A/T G015",
    brand: "Yokohama",
    size: "265/70R16",
    pattern: "All-Terrain",
    loadIndex: "112",
    speedRating: "H",
    type: "truck",
    price: 18500.0,
    costPrice: 15000.0,
    stock: 15,
    minStock: 3,
    sku: "YOKO-GAT-265-70-16",
    description: "All-terrain tyre for SUVs and light trucks",
    category: "off-road",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: "PROD-005",
    name: "Battlax Sport Touring T32",
    brand: "Bridgestone",
    size: "120/70ZR17",
    pattern: "Sport Touring",
    loadIndex: "58",
    speedRating: "W",
    type: "motorcycle",
    price: 13200.0,
    costPrice: 10800.0,
    stock: 8,
    minStock: 2,
    sku: "BRID-BST-120-70-17",
    description: "Sport touring motorcycle tyre",
    category: "performance",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];

interface ProductListProps {
  onProductSelect?: (product: Product) => void;
  selectionMode?: boolean;
}

export function ProductList({ onProductSelect, selectionMode = false }: ProductListProps) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [createModalOpened, setCreateModalOpened] = useState(false);
  const [editModalOpened, setEditModalOpened] = useState(false);
  const [deleteModalOpened, setDeleteModalOpened] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const { formatAmount } = useCurrency();

  // Filters
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");
  const [categoryFilter, setCategoryFilter] = useState<string>("");
  const [statusFilter, setStatusFilter] = useState<string>("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productApi.getAll();
      setProducts(data);
    } catch (error) {
      console.error("Failed to load products:", error);
      // Use mock data as fallback
      setProducts(mockProductsData);
      notifications.show({
        title: "Using Demo Data",
        message: "Connected to demo product data",
        color: "blue",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setEditModalOpened(true);
  };

  const handleDelete = (product: Product) => {
    setSelectedProduct(product);
    setDeleteModalOpened(true);
  };

  const confirmDelete = async () => {
    if (!selectedProduct) return;

    try {
      setLoading(true);
      await productApi.delete(selectedProduct.id);
      notifications.show({
        title: "Success",
        message: "Product deleted successfully",
        color: "green",
      });
      loadProducts();
      setDeleteModalOpened(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Failed to delete product:", error);
      notifications.show({
        title: "Error",
        message: "Failed to delete product",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleProductSelect = (product: Product) => {
    if (selectionMode && onProductSelect) {
      onProductSelect(product);
    }
  };

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.brand.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.size.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesType = !typeFilter || product.type === typeFilter;
    const matchesCategory = !categoryFilter || product.category === categoryFilter;
    const matchesStatus =
      !statusFilter ||
      (statusFilter === "active" && product.isActive) ||
      (statusFilter === "inactive" && !product.isActive) ||
      (statusFilter === "low-stock" && product.stock <= (product.minStock || 0));

    return matchesSearch && matchesType && matchesCategory && matchesStatus;
  });

  // Pagination
  const totalPages = Math.ceil(filteredProducts.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize;
  const paginatedProducts = filteredProducts.slice(startIndex, startIndex + pageSize);

  const getStatusColor = (product: Product) => {
    if (!product.isActive) return "red";
    if (product.stock <= (product.minStock || 0)) return "orange";
    return "green";
  };

  const getStatusLabel = (product: Product) => {
    if (!product.isActive) return "Inactive";
    if (product.stock <= (product.minStock || 0)) return "Low Stock";
    return "Active";
  };

  const typeOptions = [
    { value: "", label: "All Types" },
    { value: "car", label: "Car Tyre" },
    { value: "truck", label: "Truck Tyre" },
    { value: "motorcycle", label: "Motorcycle Tyre" },
    { value: "atv", label: "ATV Tyre" },
    { value: "other", label: "Other" },
  ];

  const categoryOptions = [
    { value: "", label: "All Categories" },
    { value: "summer", label: "Summer Tyres" },
    { value: "winter", label: "Winter Tyres" },
    { value: "all-season", label: "All-Season Tyres" },
    { value: "performance", label: "Performance Tyres" },
    { value: "off-road", label: "Off-Road Tyres" },
    { value: "commercial", label: "Commercial Tyres" },
  ];

  const statusOptions = [
    { value: "", label: "All Status" },
    { value: "active", label: "Active" },
    { value: "inactive", label: "Inactive" },
    { value: "low-stock", label: "Low Stock" },
  ];

  return (
    <Box>
      {!selectionMode && (
        <Group justify="space-between" mb="xl">
          <Box>
            <Text size="xl" fw={700}>
              Products
            </Text>
            <Text size="sm" c="dimmed">
              Manage your tyre inventory
            </Text>
          </Box>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateModalOpened(true)}>
            Add Product
          </Button>
        </Group>
      )}

      {/* Filters */}
      <Paper p="md" mb="md" withBorder>
        <Stack gap="md">
          <Group grow>
            <TextInput
              placeholder="Search products..."
              leftSection={<IconSearch size={16} />}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.currentTarget.value)}
            />
            <Select
              placeholder="Filter by type"
              data={typeOptions}
              value={typeFilter}
              onChange={(value) => setTypeFilter(value || "")}
              clearable
            />
            <Select
              placeholder="Filter by category"
              data={categoryOptions}
              value={categoryFilter}
              onChange={(value) => setCategoryFilter(value || "")}
              clearable
            />
            <Select
              placeholder="Filter by status"
              data={statusOptions}
              value={statusFilter}
              onChange={(value) => setStatusFilter(value || "")}
              clearable
            />
          </Group>
        </Stack>
      </Paper>

      {/* Products Table */}
      <Paper shadow="xs" radius="md" withBorder>
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Product Info</Table.Th>
                <Table.Th>Size</Table.Th>
                <Table.Th>Type</Table.Th>
                <Table.Th>Price</Table.Th>
                <Table.Th>Stock</Table.Th>
                <Table.Th>Status</Table.Th>
                {!selectionMode && <Table.Th>Actions</Table.Th>}
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {paginatedProducts.map((product) => (
                <Table.Tr
                  key={product.id}
                  style={{
                    cursor: selectionMode ? "pointer" : "default",
                  }}
                  onClick={() => handleProductSelect(product)}>
                  <Table.Td>
                    <Box>
                      <Text fw={500}>{product.name}</Text>
                      <Text size="sm" c="dimmed">
                        {product.brand} | SKU: {product.sku}
                      </Text>
                      {product.pattern && (
                        <Text size="xs" c="dimmed">
                          Pattern: {product.pattern}
                        </Text>
                      )}
                    </Box>
                  </Table.Td>
                  <Table.Td>
                    <Text>{product.size}</Text>
                    {(product.loadIndex || product.speedRating) && (
                      <Text size="sm" c="dimmed">
                        {product.loadIndex}
                        {product.speedRating}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge variant="light">
                      {product.type.charAt(0).toUpperCase() + product.type.slice(1)}
                    </Badge>
                  </Table.Td>
                  <Table.Td>
                    <Text fw={500}>{formatAmount(product.price)}</Text>
                    {product.costPrice && (
                      <Text size="sm" c="dimmed">
                        Cost: {formatAmount(product.costPrice)}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Text>{product.stock}</Text>
                    {product.minStock && (
                      <Text size="sm" c="dimmed">
                        Min: {product.minStock}
                      </Text>
                    )}
                  </Table.Td>
                  <Table.Td>
                    <Badge color={getStatusColor(product)}>{getStatusLabel(product)}</Badge>
                  </Table.Td>
                  {!selectionMode && (
                    <Table.Td>
                      <Group gap="xs">
                        <Menu position="bottom-end">
                          <Menu.Target>
                            <ActionIcon variant="subtle" color="gray">
                              <IconDotsVertical size={16} />
                            </ActionIcon>
                          </Menu.Target>
                          <Menu.Dropdown>
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={() => handleEdit(product)}>
                              Edit
                            </Menu.Item>
                            <Menu.Divider />
                            <Menu.Item
                              leftSection={<IconTrash size={14} />}
                              color="red"
                              onClick={() => handleDelete(product)}>
                              Delete
                            </Menu.Item>
                          </Menu.Dropdown>
                        </Menu>
                      </Group>
                    </Table.Td>
                  )}
                </Table.Tr>
              ))}
            </Table.Tbody>
          </Table>
        </ScrollArea>

        {/* Pagination */}
        {totalPages > 1 && (
          <Group justify="space-between" p="md">
            <Text size="sm" c="dimmed">
              Showing {startIndex + 1} to {Math.min(startIndex + pageSize, filteredProducts.length)}{" "}
              of {filteredProducts.length} results
            </Text>
            <Pagination
              value={currentPage}
              onChange={setCurrentPage}
              total={totalPages}
              size="sm"
            />
          </Group>
        )}
      </Paper>

      {/* Create Product Modal */}
      <ProductForm
        opened={createModalOpened}
        onClose={() => setCreateModalOpened(false)}
        onSuccess={loadProducts}
      />

      {/* Edit Product Modal */}
      <ProductForm
        opened={editModalOpened}
        onClose={() => setEditModalOpened(false)}
        onSuccess={loadProducts}
        product={selectedProduct || undefined}
      />

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpened}
        onClose={() => setDeleteModalOpened(false)}
        title="Delete Product"
        size="sm"
        centered
        zIndex={1000}
        overlayProps={{
          backgroundOpacity: 0.55,
          blur: 3,
        }}>
        <Stack gap="md">
          <Text size="sm">
            Are you sure you want to delete "{selectedProduct?.name}"? This action cannot be undone.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button variant="light" onClick={() => setDeleteModalOpened(false)}>
              Cancel
            </Button>
            <Button color="red" onClick={confirmDelete} loading={loading}>
              Delete
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Box>
  );
}
