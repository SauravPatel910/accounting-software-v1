// prettier-ignore
import { Table, Group, Text, ActionIcon, Badge, Box, Button, Paper, Stack, NumberFormatter, TextInput, Select, Flex, Loader } from "@mantine/core";
// prettier-ignore
import { IconEdit, IconTrash, IconEye, IconSearch, IconPlus, IconBuildingBank, IconCreditCard, IconCoins, IconTrendingUp, IconTrendingDown } from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { motion } from "motion/react";
import {
  fetchAccounts,
  deleteAccount,
  getAccountSubTypeLabel,
  getAccountStatusLabel,
  type AccountResponseDto,
  AccountType,
  AccountStatus,
} from "../../services/accountsService";
import { AddAccountModal } from "./AddAccountModal";

const accountTypeConfig = {
  asset: { icon: IconCoins, color: "green", label: "Asset" },
  liability: { icon: IconCreditCard, color: "red", label: "Liability" },
  equity: { icon: IconBuildingBank, color: "blue", label: "Equity" },
  revenue: { icon: IconTrendingUp, color: "teal", label: "Revenue" },
  expense: { icon: IconTrendingDown, color: "orange", label: "Expense" },
};

export function AccountList() {
  const [accounts, setAccounts] = useState<AccountResponseDto[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<AccountType | null>(null);
  const [filterStatus, setFilterStatus] = useState<AccountStatus | null>(null);
  const [addAccountModalOpened, setAddAccountModalOpened] = useState(false);

  useEffect(() => {
    const loadAccounts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchAccounts({
          includeBalance: true,
          hierarchical: false,
        });
        setAccounts(response.accounts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load accounts");
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  }, []);

  const filteredAccounts = accounts.filter((account) => {
    const matchesSearch =
      account.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      account.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (account.description && account.description.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = !filterType || account.type === filterType;
    const matchesStatus = !filterStatus || account.status === filterStatus;
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleDeleteAccount = async (id: string) => {
    if (!confirm("Are you sure you want to delete this account?")) return;

    try {
      await deleteAccount(id);
      setAccounts(accounts.filter((acc) => acc.id !== id));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete account");
    }
  };

  const handleAddAccountSuccess = () => {
    // Refresh the accounts list
    const loadAccounts = async () => {
      try {
        setLoading(true);
        setError(null);
        const response = await fetchAccounts({
          includeBalance: true,
          hierarchical: false,
        });
        setAccounts(response.accounts);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load accounts");
      } finally {
        setLoading(false);
      }
    };

    loadAccounts();
  };

  const AccountIcon = ({ type }: { type: AccountType }) => {
    const config = accountTypeConfig[type as keyof typeof accountTypeConfig];
    const Icon = config.icon;
    return <Icon size={18} style={{ color: `var(--mantine-color-${config.color}-6)` }} />;
  };

  const AccountTypeBadge = ({ type }: { type: AccountType }) => {
    const config = accountTypeConfig[type as keyof typeof accountTypeConfig];
    return (
      <Badge variant="light" color={config.color} size="sm">
        {config.label}
      </Badge>
    );
  };

  const StatusBadge = ({ status }: { status: AccountStatus }) => {
    const color = status === AccountStatus.ACTIVE ? "green" : status === AccountStatus.INACTIVE ? "yellow" : "gray";
    return (
      <Badge variant="light" color={color} size="sm">
        {getAccountStatusLabel(status)}
      </Badge>
    );
  };

  const formatBalance = (balance: number, type: AccountType) => {
    const isNegative = balance < 0;
    const displayBalance = Math.abs(balance);

    let color = "var(--mantine-color-green-6)";
    if (type === AccountType.LIABILITY || type === AccountType.EQUITY) {
      color = isNegative ? "var(--mantine-color-green-6)" : "var(--mantine-color-red-6)";
    } else if (type === AccountType.ASSET) {
      color = isNegative ? "var(--mantine-color-red-6)" : "var(--mantine-color-green-6)";
    }

    return <NumberFormatter value={displayBalance} prefix="₹" thousandSeparator decimalScale={2} style={{ color }} />;
  };

  const accountTypeOptions = [
    { value: AccountType.ASSET, label: "Asset" },
    { value: AccountType.LIABILITY, label: "Liability" },
    { value: AccountType.EQUITY, label: "Equity" },
    { value: AccountType.REVENUE, label: "Revenue" },
    { value: AccountType.EXPENSE, label: "Expense" },
  ];

  const statusOptions = [
    { value: AccountStatus.ACTIVE, label: "Active" },
    { value: AccountStatus.INACTIVE, label: "Inactive" },
    { value: AccountStatus.ARCHIVED, label: "Archived" },
  ];

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
      <Stack gap="lg">
        {/* Header and Controls */}
        <Group justify="space-between">
          <Box>
            <Text size="xl" fw={700}>
              Chart of Accounts
            </Text>
            <Text size="sm" c="dimmed">
              View and manage your complete chart of accounts
            </Text>
          </Box>
          <Button leftSection={<IconPlus size={16} />} onClick={() => setAddAccountModalOpened(true)}>
            Add Account
          </Button>
        </Group>

        {/* Filters */}
        <Paper p="md" radius="md" withBorder>
          <Flex gap="md" align="end">
            <TextInput
              placeholder="Search accounts..."
              leftSection={<IconSearch size={16} />}
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.currentTarget.value)}
              style={{ flex: 1 }}
            />
            <Select
              placeholder="Account type"
              data={accountTypeOptions}
              value={filterType}
              onChange={(value) => setFilterType(value as AccountType | null)}
              clearable
              style={{ minWidth: 150 }}
            />
            <Select
              placeholder="Status"
              data={statusOptions}
              value={filterStatus}
              onChange={(value) => setFilterStatus(value as AccountStatus | null)}
              clearable
              style={{ minWidth: 120 }}
            />
            {(searchTerm || filterType || filterStatus) && (
              <Button
                variant="light"
                onClick={() => {
                  setSearchTerm("");
                  setFilterType(null);
                  setFilterStatus(null);
                }}>
                Clear
              </Button>
            )}
          </Flex>
        </Paper>

        {/* Accounts Table */}
        <Paper shadow="xs" radius="md" withBorder>
          {loading ? (
            <Box p="xl" ta="center">
              <Loader size="lg" />
              <Text mt="md">Loading accounts...</Text>
            </Box>
          ) : error ? (
            <Box p="xl" ta="center">
              <Text c="red">{error}</Text>
              <Button mt="md" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </Box>
          ) : (
            <Table verticalSpacing="md" horizontalSpacing="lg">
              <Table.Thead>
                <Table.Tr>
                  <Table.Th>Account</Table.Th>
                  <Table.Th>Type</Table.Th>
                  <Table.Th>Sub-Type</Table.Th>
                  <Table.Th>Balance</Table.Th>
                  <Table.Th>Status</Table.Th>
                  <Table.Th>Actions</Table.Th>
                </Table.Tr>
              </Table.Thead>
              <Table.Tbody>
                {filteredAccounts.map((account) => (
                  <Table.Tr key={account.id}>
                    <Table.Td>
                      <Group gap="sm">
                        <AccountIcon type={account.type} />
                        <Box>
                          <Text fw={500}>
                            {account.code} - {account.name}
                          </Text>
                          {account.description && (
                            <Text size="xs" c="dimmed">
                              {account.description}
                            </Text>
                          )}
                        </Box>
                      </Group>
                    </Table.Td>
                    <Table.Td>
                      <AccountTypeBadge type={account.type} />
                    </Table.Td>
                    <Table.Td>
                      <Text size="sm">{getAccountSubTypeLabel(account.subType)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <Text fw={600}>{formatBalance(account.currentBalance, account.type)}</Text>
                    </Table.Td>
                    <Table.Td>
                      <StatusBadge status={account.status} />
                    </Table.Td>
                    <Table.Td>
                      <Group gap="xs">
                        <ActionIcon variant="subtle" color="blue">
                          <IconEye size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="gray">
                          <IconEdit size={16} />
                        </ActionIcon>
                        <ActionIcon variant="subtle" color="red" onClick={() => handleDeleteAccount(account.id)}>
                          <IconTrash size={16} />
                        </ActionIcon>
                      </Group>
                    </Table.Td>
                  </Table.Tr>
                ))}
              </Table.Tbody>
            </Table>
          )}

          {!loading && !error && filteredAccounts.length === 0 && (
            <Box p="xl" ta="center">
              <Text c="dimmed">No accounts found matching your criteria.</Text>
            </Box>
          )}
        </Paper>
      </Stack>

      <AddAccountModal
        opened={addAccountModalOpened}
        onClose={() => setAddAccountModalOpened(false)}
        onSuccess={handleAddAccountSuccess}
      />
    </motion.div>
  );
}
