// prettier-ignore
import { Modal, TextInput, Textarea, Select, NumberInput, Switch, Button, Group, Stack, Text, Divider, Box } from "@mantine/core";
import { useForm } from "@mantine/form";
import { useState, useEffect, useRef } from "react";
import { notifications } from "@mantine/notifications";
import { IconCheck, IconX } from "@tabler/icons-react";
import {
  createAccount,
  generateAccountCode,
  getSubTypesForType,
  type CreateAccountDto,
  AccountType,
  AccountSubType,
  AccountStatus,
} from "../../services/accountsService";

interface AddAccountModalProps {
  opened: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export function AddAccountModal({ opened, onClose, onSuccess }: AddAccountModalProps) {
  const [loading, setLoading] = useState(false);
  const [generatingCode, setGeneratingCode] = useState(false);
  const [subTypes, setSubTypes] = useState<{ value: AccountSubType; label: string }[]>([]);

  const form = useForm<CreateAccountDto>({
    initialValues: {
      code: "",
      name: "",
      description: "",
      type: AccountType.ASSET,
      subType: AccountSubType.CURRENT_ASSET,
      parentAccountId: "",
      level: 0,
      isControlAccount: false,
      allowDirectTransactions: true,
      currency: "INR",
      openingBalance: 0,
      openingBalanceDate: "",
      taxCode: "",
      isTaxable: false,
      isDepreciable: false,
      depreciationRate: 0,
      depreciationMethod: "",
      status: AccountStatus.ACTIVE,
    },
    validate: {
      code: (value) =>
        !value ? "Account code is required" : value.length > 10 ? "Code must be 10 characters or less" : null,
      name: (value) =>
        !value ? "Account name is required" : value.length > 255 ? "Name must be 255 characters or less" : null,
      type: (value) => (!value ? "Account type is required" : null),
      subType: (value) => (!value ? "Account sub-type is required" : null),
      openingBalance: (value) => (value !== undefined && value < 0 ? "Opening balance cannot be negative" : null),
      depreciationRate: (value) =>
        value !== undefined && (value < 0 || value > 100) ? "Depreciation rate must be between 0 and 100" : null,
    },
  });

  // Use ref to store form instance for useEffect
  const formRef = useRef(form);
  formRef.current = form;

  // Update sub-types when account type changes
  useEffect(() => {
    const newSubTypes = getSubTypesForType(form.values.type);
    setSubTypes(newSubTypes);

    // Reset sub-type if it's not valid for the new type
    if (!newSubTypes.find((st) => st.value === form.values.subType)) {
      formRef.current.setFieldValue("subType", newSubTypes[0]?.value || AccountSubType.CURRENT_ASSET);
    }
  }, [form.values.type, form.values.subType]);

  const handleGenerateCode = async () => {
    if (!form.values.type || !form.values.subType) {
      notifications.show({
        title: "Error",
        message: "Please select account type and sub-type first",
        color: "red",
        icon: <IconX size={16} />,
      });
      return;
    }

    try {
      setGeneratingCode(true);
      const result = await generateAccountCode({
        type: form.values.type,
        subType: form.values.subType,
        parentAccountId: form.values.parentAccountId || undefined,
      });

      form.setFieldValue("code", result.suggestedCode);
      notifications.show({
        title: "Code Generated",
        message: `Suggested code: ${result.suggestedCode}`,
        color: "green",
        icon: <IconCheck size={16} />,
      });
    } catch (error) {
      console.error("Failed to generate account code:", error);
      notifications.show({
        title: "Error",
        message: "Failed to generate account code",
        color: "red",
        icon: <IconX size={16} />,
      });
    } finally {
      setGeneratingCode(false);
    }
  };

  const handleSubmit = async (values: CreateAccountDto) => {
    try {
      setLoading(true);
      await createAccount(values);

      notifications.show({
        title: "Success",
        message: "Account created successfully",
        color: "green",
        icon: <IconCheck size={16} />,
      });

      form.reset();
      onClose();
      onSuccess?.();
    } catch (error) {
      notifications.show({
        title: "Error",
        message: error instanceof Error ? error.message : "Failed to create account",
        color: "red",
        icon: <IconX size={16} />,
      });
    } finally {
      setLoading(false);
    }
  };

  const accountTypeOptions = [
    { value: AccountType.ASSET, label: "Asset" },
    { value: AccountType.LIABILITY, label: "Liability" },
    { value: AccountType.EQUITY, label: "Equity" },
    { value: AccountType.REVENUE, label: "Revenue" },
    { value: AccountType.EXPENSE, label: "Expense" },
  ];

  const subTypeOptions = subTypes.map((st) => ({ value: st.value, label: st.label }));

  return (
    <Modal opened={opened} onClose={onClose} title="Add New Account" size="lg" centered>
      <form onSubmit={form.onSubmit(handleSubmit)}>
        <Stack gap="md">
          {/* Basic Information */}
          <Box>
            <Text size="sm" fw={600} mb="xs">
              Basic Information
            </Text>
            <Stack gap="sm">
              <Group grow>
                <TextInput
                  label="Account Code"
                  placeholder="e.g., 1001"
                  required
                  {...form.getInputProps("code")}
                  rightSection={
                    <Button
                      size="xs"
                      variant="light"
                      onClick={handleGenerateCode}
                      loading={generatingCode}
                      disabled={!form.values.type || !form.values.subType}>
                      Generate
                    </Button>
                  }
                />
                <TextInput
                  label="Account Name"
                  placeholder="e.g., Cash on Hand"
                  required
                  {...form.getInputProps("name")}
                />
              </Group>

              <Textarea
                label="Description"
                placeholder="Optional description of the account"
                {...form.getInputProps("description")}
                minRows={2}
              />
            </Stack>
          </Box>

          <Divider />

          {/* Account Classification */}
          <Box>
            <Text size="sm" fw={600} mb="xs">
              Account Classification
            </Text>
            <Stack gap="sm">
              <Group grow>
                <Select
                  label="Account Type"
                  placeholder="Select account type"
                  data={accountTypeOptions}
                  required
                  {...form.getInputProps("type")}
                />
                <Select
                  label="Account Sub-Type"
                  placeholder="Select account sub-type"
                  data={subTypeOptions}
                  required
                  {...form.getInputProps("subType")}
                />
              </Group>

              <Group grow>
                <TextInput
                  label="Parent Account ID"
                  placeholder="Optional parent account"
                  {...form.getInputProps("parentAccountId")}
                />
                <NumberInput label="Account Level" placeholder="0" min={0} max={10} {...form.getInputProps("level")} />
              </Group>
            </Stack>
          </Box>

          <Divider />

          {/* Account Settings */}
          <Box>
            <Text size="sm" fw={600} mb="xs">
              Account Settings
            </Text>
            <Stack gap="sm">
              <Group grow>
                <Switch
                  label="Control Account"
                  description="This account can have sub-accounts"
                  {...form.getInputProps("isControlAccount", { type: "checkbox" })}
                />
                <Switch
                  label="Allow Direct Transactions"
                  description="Transactions can be posted directly to this account"
                  {...form.getInputProps("allowDirectTransactions", { type: "checkbox" })}
                />
              </Group>

              <Group grow>
                <TextInput label="Currency" placeholder="INR" {...form.getInputProps("currency")} />
                <NumberInput
                  label="Opening Balance"
                  placeholder="0.00"
                  decimalScale={2}
                  {...form.getInputProps("openingBalance")}
                />
              </Group>
            </Stack>
          </Box>

          <Divider />

          {/* Tax and Depreciation */}
          <Box>
            <Text size="sm" fw={600} mb="xs">
              Tax & Depreciation
            </Text>
            <Stack gap="sm">
              <Group grow>
                <Switch label="Taxable" {...form.getInputProps("isTaxable", { type: "checkbox" })} />
                <Switch label="Depreciable" {...form.getInputProps("isDepreciable", { type: "checkbox" })} />
              </Group>

              {form.values.isTaxable && (
                <TextInput label="Tax Code" placeholder="e.g., GST@18%" {...form.getInputProps("taxCode")} />
              )}

              {form.values.isDepreciable && (
                <Group grow>
                  <NumberInput
                    label="Depreciation Rate (%)"
                    placeholder="0.00"
                    min={0}
                    max={100}
                    decimalScale={2}
                    {...form.getInputProps("depreciationRate")}
                  />
                  <TextInput
                    label="Depreciation Method"
                    placeholder="e.g., Straight Line"
                    {...form.getInputProps("depreciationMethod")}
                  />
                </Group>
              )}
            </Stack>
          </Box>

          <Divider />

          {/* Form Actions */}
          <Group justify="flex-end" mt="lg">
            <Button variant="light" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              Create Account
            </Button>
          </Group>
        </Stack>
      </form>
    </Modal>
  );
}
