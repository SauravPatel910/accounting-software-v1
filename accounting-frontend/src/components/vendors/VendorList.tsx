import { useState, useEffect } from "react";
// prettier-ignore
import { Table, Group, Text, ActionIcon, Avatar, Badge, ScrollArea, TextInput, Button, Paper, Menu, Stack, Grid, Card } from "@mantine/core";
// prettier-ignore
import { IconSearch, IconPlus, IconEdit, IconTrash, IconDots, IconBuilding, IconMail, IconPhone, IconMapPin } from "@tabler/icons-react";
import { modals } from "@mantine/modals";
import { notifications } from "@mantine/notifications";
import { vendorApi, type Vendor } from "../../services/api";

interface VendorListProps {
  onCreateVendor?: () => void;
  onEditVendor?: (vendor: Vendor) => void;
  onSelectVendor?: (vendor: Vendor) => void;
  selectedVendorId?: string;
  compact?: boolean;
}

export default function VendorList({
  onCreateVendor,
  onEditVendor,
  onSelectVendor,
  selectedVendorId,
  compact = false,
}: VendorListProps) {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredVendors, setFilteredVendors] = useState<Vendor[]>([]);

  useEffect(() => {
    loadVendors();
  }, []);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredVendors(vendors);
    } else {
      const filtered = vendors.filter(
        (vendor) =>
          vendor.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
          vendor.email.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredVendors(filtered);
    }
  }, [vendors, searchQuery]);

  const loadVendors = async () => {
    try {
      setLoading(true);
      const data = await vendorApi.getAll();
      setVendors(data);
    } catch (error) {
      console.error("Failed to load vendors:", error);
      notifications.show({
        title: "Error",
        message: "Failed to load vendors",
        color: "red",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVendor = (vendor: Vendor) => {
    modals.openConfirmModal({
      title: "Delete Vendor",
      children: (
        <Text size="sm">
          Are you sure you want to delete <strong>{vendor.name}</strong>? This action cannot be
          undone.
        </Text>
      ),
      labels: { confirm: "Delete", cancel: "Cancel" },
      confirmProps: { color: "red" },
      onConfirm: async () => {
        try {
          await vendorApi.delete(vendor.id);
          notifications.show({
            title: "Success",
            message: "Vendor deleted successfully",
            color: "green",
          });
          loadVendors();
        } catch (error) {
          console.error("Failed to delete vendor:", error);
          notifications.show({
            title: "Error",
            message: "Failed to delete vendor",
            color: "red",
          });
        }
      },
    });
  };

  if (compact) {
    return (
      <Stack gap="md">
        <Group justify="space-between">
          <TextInput
            placeholder="Search vendors..."
            leftSection={<IconSearch size={16} />}
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.currentTarget.value)}
            style={{ flex: 1 }}
          />
          {onCreateVendor && (
            <Button leftSection={<IconPlus size={16} />} onClick={onCreateVendor}>
              Add Vendor
            </Button>
          )}
        </Group>

        <ScrollArea h={400}>
          <Stack gap="xs">
            {filteredVendors.map((vendor) => (
              <Card
                key={vendor.id}
                p="sm"
                withBorder
                style={{
                  cursor: onSelectVendor ? "pointer" : "default",
                  backgroundColor:
                    selectedVendorId === vendor.id ? "var(--mantine-color-blue-0)" : undefined,
                }}
                onClick={() => onSelectVendor?.(vendor)}>
                <Group justify="space-between">
                  <Group>
                    <Avatar color="blue" radius="sm">
                      <IconBuilding size={16} />
                    </Avatar>
                    <div>
                      <Text fw={500} size="sm">
                        {vendor.name}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {vendor.company}
                      </Text>
                    </div>
                  </Group>
                  {onEditVendor && (
                    <ActionIcon
                      variant="subtle"
                      onClick={(e) => {
                        e.stopPropagation();
                        onEditVendor(vendor);
                      }}>
                      <IconEdit size={16} />
                    </ActionIcon>
                  )}
                </Group>
              </Card>
            ))}
          </Stack>
        </ScrollArea>
      </Stack>
    );
  }

  return (
    <Stack gap="md">
      {/* Header */}
      <Group justify="space-between">
        <div>
          <Text size="xl" fw={700}>
            Vendors
          </Text>
          <Text size="sm" c="dimmed">
            Manage your vendors and suppliers
          </Text>
        </div>
        {onCreateVendor && (
          <Button leftSection={<IconPlus size={16} />} onClick={onCreateVendor}>
            Add Vendor
          </Button>
        )}
      </Group>

      {/* Summary Cards */}
      <Grid>
        <Grid.Col span={6}>
          <Paper p="md" withBorder>
            <Group>
              <Avatar color="blue" radius="sm">
                <IconBuilding size={20} />
              </Avatar>
              <div>
                <Text size="xl" fw={700}>
                  {vendors.length}
                </Text>
                <Text size="sm" c="dimmed">
                  Total Vendors
                </Text>
              </div>
            </Group>
          </Paper>
        </Grid.Col>
        <Grid.Col span={6}>
          <Paper p="md" withBorder>
            <Group>
              <Avatar color="green" radius="sm">
                <IconBuilding size={20} />
              </Avatar>
              <div>
                <Text size="xl" fw={700}>
                  {vendors.filter((v) => v.category === "preferred").length}
                </Text>
                <Text size="sm" c="dimmed">
                  Preferred Vendors
                </Text>
              </div>
            </Group>
          </Paper>
        </Grid.Col>
      </Grid>

      {/* Search */}
      <TextInput
        placeholder="Search vendors by name, company, or email..."
        leftSection={<IconSearch size={16} />}
        value={searchQuery}
        onChange={(event) => setSearchQuery(event.currentTarget.value)}
      />

      {/* Vendors Table */}
      <Paper withBorder>
        <ScrollArea>
          <Table striped highlightOnHover>
            <Table.Thead>
              <Table.Tr>
                <Table.Th>Vendor</Table.Th>
                <Table.Th>Contact</Table.Th>
                <Table.Th>Location</Table.Th>
                <Table.Th>Category</Table.Th>
                <Table.Th>Payment Terms</Table.Th>
                <Table.Th>Actions</Table.Th>
              </Table.Tr>
            </Table.Thead>
            <Table.Tbody>
              {loading ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" py="xl">
                      Loading vendors...
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : filteredVendors.length === 0 ? (
                <Table.Tr>
                  <Table.Td colSpan={6}>
                    <Text ta="center" py="xl" c="dimmed">
                      {searchQuery ? "No vendors found matching your search" : "No vendors yet"}
                    </Text>
                  </Table.Td>
                </Table.Tr>
              ) : (
                filteredVendors.map((vendor) => (
                  <Table.Tr
                    key={vendor.id}
                    style={{
                      cursor: onSelectVendor ? "pointer" : "default",
                      backgroundColor:
                        selectedVendorId === vendor.id ? "var(--mantine-color-blue-0)" : undefined,
                    }}
                    onClick={() => onSelectVendor?.(vendor)}>
                    <Table.Td>
                      <Group>
                        <Avatar color="blue" radius="sm" size="sm">
                          <IconBuilding size={16} />
                        </Avatar>
                        <div>
                          <Text fw={500}>{vendor.name}</Text>
                          <Text size="sm" c="dimmed">
                            {vendor.company}
                          </Text>
                        </div>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <Stack gap={2}>
                        <Group gap={4}>
                          <IconMail size={12} />
                          <Text size="sm">{vendor.email}</Text>
                        </Group>
                        {vendor.phone && (
                          <Group gap={4}>
                            <IconPhone size={12} />
                            <Text size="sm">{vendor.phone}</Text>
                          </Group>
                        )}
                      </Stack>
                    </Table.Td>
                    <Table.Td>
                      <Group gap={4}>
                        <IconMapPin size={12} />
                        <Text size="sm">
                          {vendor.city}
                          {vendor.state && `, ${vendor.state}`}
                        </Text>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      {vendor.category ? (
                        <Badge
                          color={
                            vendor.category === "preferred"
                              ? "green"
                              : vendor.category === "regular"
                              ? "blue"
                              : "gray"
                          }
                          variant="light">
                          {vendor.category}
                        </Badge>
                      ) : (
                        <Text size="sm" c="dimmed">
                          -
                        </Text>
                      )}
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{vendor.paymentTerms || "-"}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Menu shadow="md" width={160}>
                        <Menu.Target>
                          <ActionIcon variant="subtle" onClick={(e) => e.stopPropagation()}>
                            <IconDots size={16} />
                          </ActionIcon>
                        </Menu.Target>
                        <Menu.Dropdown>
                          {onEditVendor && (
                            <Menu.Item
                              leftSection={<IconEdit size={14} />}
                              onClick={(e) => {
                                e.stopPropagation();
                                onEditVendor(vendor);
                              }}>
                              Edit
                            </Menu.Item>
                          )}
                          <Menu.Item
                            leftSection={<IconTrash size={14} />}
                            color="red"
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteVendor(vendor);
                            }}>
                            Delete
                          </Menu.Item>
                        </Menu.Dropdown>
                      </Menu>
                    </Table.Td>
                  </Table.Tr>
                ))
              )}
            </Table.Tbody>
          </Table>
        </ScrollArea>
      </Paper>
    </Stack>
  );
}
