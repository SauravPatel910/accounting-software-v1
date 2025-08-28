import { BrowserRouter, Routes, Route } from "react-router";
import { MantineProvider } from "@mantine/core";
import { Notifications } from "@mantine/notifications";
import { AppLayout } from "./components/layout";
import { CurrencyProvider } from "./contexts/CurrencyContext";
// prettier-ignore
import { Dashboard, Invoices, CreateInvoice, Products, Transactions, Customers, Accounts, Reports, Settings } from "./pages";

// Import Mantine styles
import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

function App() {
  return (
    <MantineProvider defaultColorScheme="light">
      <CurrencyProvider>
        <Notifications />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<AppLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="invoices" element={<Invoices />} />
              <Route path="invoices/create" element={<CreateInvoice />} />
              <Route path="invoices/edit/:id" element={<CreateInvoice />} />
              <Route path="invoices/recurring" element={<Invoices />} />
              <Route path="products" element={<Products />} />
              <Route path="transactions" element={<Transactions />} />
              <Route path="transactions/accounts" element={<Transactions />} />
              <Route path="transactions/reconcile" element={<Transactions />} />
              <Route path="customers" element={<Customers />} />
              <Route path="accounts" element={<Accounts />} />
              <Route path="reports" element={<Reports />} />
              <Route path="reports/profit-loss" element={<Reports />} />
              <Route path="reports/balance-sheet" element={<Reports />} />
              <Route path="reports/cash-flow" element={<Reports />} />
              <Route path="reports/tax" element={<Reports />} />
              <Route path="settings" element={<Settings />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </CurrencyProvider>
    </MantineProvider>
  );
}

export default App;
