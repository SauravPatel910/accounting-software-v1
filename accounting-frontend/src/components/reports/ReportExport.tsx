import {
  Button,
  Group,
  Menu,
  rem,
  Modal,
  Stack,
  Text,
  Radio,
  Select,
  Checkbox,
  Box,
  Progress,
  Alert,
} from "@mantine/core";
import {
  IconDownload,
  IconFileTypePdf,
  IconFileTypeXls,
  IconFileTypeCsv,
  IconSettings,
  IconCheck,
  IconX,
  IconInfoCircle,
} from "@tabler/icons-react";
import { useState } from "react";
import { motion } from "motion/react";

interface ExportOptions {
  format: "pdf" | "excel" | "csv";
  orientation: "portrait" | "landscape";
  includeComparison: boolean;
  includeSummary: boolean;
  includeCharts: boolean;
  dateFormat: "MM/DD/YYYY" | "DD/MM/YYYY" | "YYYY-MM-DD";
  currency: "USD" | "EUR" | "GBP";
}

interface ReportExportProps {
  reportType: "profit-loss" | "balance-sheet" | "cash-flow" | "transaction-list";
  reportData?: Record<string, unknown>;
  onExport?: (options: ExportOptions) => Promise<void>;
  buttonVariant?: "filled" | "light" | "outline";
  size?: "xs" | "sm" | "md" | "lg" | "xl";
}

export function ReportExport({
  reportType,
  reportData,
  onExport,
  buttonVariant = "filled",
  size = "sm",
}: ReportExportProps) {
  const [exportModalOpened, setExportModalOpened] = useState(false);
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    format: "pdf",
    orientation: "portrait",
    includeComparison: false,
    includeSummary: true,
    includeCharts: false,
    dateFormat: "MM/DD/YYYY",
    currency: "USD",
  });
  const [isExporting, setIsExporting] = useState(false);
  const [exportProgress, setExportProgress] = useState(0);
  const [exportSuccess, setExportSuccess] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  const formatConfig = {
    pdf: {
      icon: IconFileTypePdf,
      color: "red",
      label: "PDF Document",
      description: "Best for viewing and printing",
    },
    excel: {
      icon: IconFileTypeXls,
      color: "green",
      label: "Excel Spreadsheet",
      description: "Best for analysis and calculations",
    },
    csv: {
      icon: IconFileTypeCsv,
      color: "blue",
      label: "CSV File",
      description: "Best for importing into other systems",
    },
  };

  const handleQuickExport = async (format: ExportOptions["format"]) => {
    const quickOptions = { ...exportOptions, format };
    await handleExport(quickOptions);
  };

  const handleExport = async (options: ExportOptions) => {
    setIsExporting(true);
    setExportProgress(0);
    setExportSuccess(false);
    setExportError(null);

    try {
      // Simulate export progress
      const progressSteps = [
        { progress: 20, message: "Preparing data..." },
        { progress: 40, message: "Formatting report..." },
        { progress: 60, message: "Generating file..." },
        { progress: 80, message: "Applying styling..." },
        { progress: 100, message: "Export complete!" },
      ];

      for (const step of progressSteps) {
        setExportProgress(step.progress);
        await new Promise((resolve) => setTimeout(resolve, 500));
      }

      // Call the provided export function if available
      if (onExport) {
        await onExport(options);
      } else {
        // Default export implementation
        console.log("Exporting report:", { reportType, options, reportData });

        // Create a mock download
        const filename = `${reportType}-${new Date().toISOString().split("T")[0]}.${
          options.format
        }`;
        const mockData = `Mock ${reportType} export data in ${options.format} format`;
        const blob = new Blob([mockData], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      setExportSuccess(true);
      setTimeout(() => {
        setExportModalOpened(false);
        setIsExporting(false);
        setExportProgress(0);
        setExportSuccess(false);
      }, 2000);
    } catch (error) {
      setExportError(error instanceof Error ? error.message : "Export failed");
      setIsExporting(false);
    }
  };

  const handleAdvancedExport = async () => {
    await handleExport(exportOptions);
  };

  return (
    <>
      <Menu shadow="md" width={200}>
        <Menu.Target>
          <Button leftSection={<IconDownload size={16} />} variant={buttonVariant} size={size}>
            Export
          </Button>
        </Menu.Target>

        <Menu.Dropdown>
          <Menu.Label>Quick Export</Menu.Label>
          <Menu.Item
            leftSection={<IconFileTypePdf style={{ width: rem(14), height: rem(14) }} />}
            onClick={() => handleQuickExport("pdf")}>
            Export as PDF
          </Menu.Item>
          <Menu.Item
            leftSection={<IconFileTypeXls style={{ width: rem(14), height: rem(14) }} />}
            onClick={() => handleQuickExport("excel")}>
            Export as Excel
          </Menu.Item>
          <Menu.Item
            leftSection={<IconFileTypeCsv style={{ width: rem(14), height: rem(14) }} />}
            onClick={() => handleQuickExport("csv")}>
            Export as CSV
          </Menu.Item>

          <Menu.Divider />

          <Menu.Item
            leftSection={<IconSettings style={{ width: rem(14), height: rem(14) }} />}
            onClick={() => setExportModalOpened(true)}>
            Advanced Options
          </Menu.Item>
        </Menu.Dropdown>
      </Menu>

      <Modal
        opened={exportModalOpened}
        onClose={() => setExportModalOpened(false)}
        title="Export Options"
        size="md"
        centered>
        <Stack gap="lg">
          {exportError && (
            <Alert icon={<IconX size={16} />} color="red" title="Export Failed">
              {exportError}
            </Alert>
          )}

          {exportSuccess && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}>
              <Alert icon={<IconCheck size={16} />} color="green" title="Export Successful">
                Your report has been downloaded successfully!
              </Alert>
            </motion.div>
          )}

          {isExporting && (
            <Box>
              <Text size="sm" mb="xs">
                Exporting report...
              </Text>
              <Progress value={exportProgress} animated />
            </Box>
          )}

          {!isExporting && !exportSuccess && (
            <>
              {/* Format Selection */}
              <Box>
                <Text size="sm" fw={600} mb="xs">
                  Export Format
                </Text>
                <Radio.Group
                  value={exportOptions.format}
                  onChange={(value) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      format: value as ExportOptions["format"],
                    }))
                  }>
                  <Stack gap="xs">
                    {Object.entries(formatConfig).map(([format, config]) => {
                      const Icon = config.icon;
                      return (
                        <Radio
                          key={format}
                          value={format}
                          label={
                            <Group>
                              <Icon
                                size={20}
                                style={{ color: `var(--mantine-color-${config.color}-6)` }}
                              />
                              <Box>
                                <Text size="sm" fw={500}>
                                  {config.label}
                                </Text>
                                <Text size="xs" c="dimmed">
                                  {config.description}
                                </Text>
                              </Box>
                            </Group>
                          }
                        />
                      );
                    })}
                  </Stack>
                </Radio.Group>
              </Box>

              {/* PDF Options */}
              {exportOptions.format === "pdf" && (
                <Box>
                  <Text size="sm" fw={600} mb="xs">
                    Page Orientation
                  </Text>
                  <Radio.Group
                    value={exportOptions.orientation}
                    onChange={(value) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        orientation: value as ExportOptions["orientation"],
                      }))
                    }>
                    <Group>
                      <Radio value="portrait" label="Portrait" />
                      <Radio value="landscape" label="Landscape" />
                    </Group>
                  </Radio.Group>
                </Box>
              )}

              {/* Content Options */}
              <Box>
                <Text size="sm" fw={600} mb="xs">
                  Include in Export
                </Text>
                <Stack gap="xs">
                  <Checkbox
                    label="Summary section"
                    checked={exportOptions.includeSummary}
                    onChange={(event) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeSummary: event.currentTarget.checked,
                      }))
                    }
                  />
                  <Checkbox
                    label="Comparison data"
                    checked={exportOptions.includeComparison}
                    onChange={(event) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeComparison: event.currentTarget.checked,
                      }))
                    }
                  />
                  <Checkbox
                    label="Charts and graphs"
                    checked={exportOptions.includeCharts}
                    onChange={(event) =>
                      setExportOptions((prev) => ({
                        ...prev,
                        includeCharts: event.currentTarget.checked,
                      }))
                    }
                    disabled={exportOptions.format === "csv"}
                  />
                </Stack>
              </Box>

              {/* Formatting Options */}
              <Group grow>
                <Select
                  label="Date Format"
                  data={[
                    { value: "MM/DD/YYYY", label: "MM/DD/YYYY" },
                    { value: "DD/MM/YYYY", label: "DD/MM/YYYY" },
                    { value: "YYYY-MM-DD", label: "YYYY-MM-DD" },
                  ]}
                  value={exportOptions.dateFormat}
                  onChange={(value) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      dateFormat: value as ExportOptions["dateFormat"],
                    }))
                  }
                />

                <Select
                  label="Currency"
                  data={[
                    { value: "USD", label: "USD ($)" },
                    { value: "EUR", label: "EUR (€)" },
                    { value: "GBP", label: "GBP (£)" },
                  ]}
                  value={exportOptions.currency}
                  onChange={(value) =>
                    setExportOptions((prev) => ({
                      ...prev,
                      currency: value as ExportOptions["currency"],
                    }))
                  }
                />
              </Group>

              {/* Info Alert */}
              <Alert icon={<IconInfoCircle size={16} />} color="blue" variant="light">
                <Text size="sm">
                  Exports include all data visible in the current report view. Large reports may
                  take longer to process.
                </Text>
              </Alert>
            </>
          )}

          {/* Action Buttons */}
          <Group justify="flex-end">
            <Button
              variant="light"
              onClick={() => setExportModalOpened(false)}
              disabled={isExporting}>
              Cancel
            </Button>
            <Button onClick={handleAdvancedExport} loading={isExporting} disabled={exportSuccess}>
              Export Report
            </Button>
          </Group>
        </Stack>
      </Modal>
    </>
  );
}
