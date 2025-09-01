import { BrowserRouter, Routes, Route } from "react-router";
import { LoadingOverlay, Center } from "@mantine/core";
import { AppLayout } from "./components/layout";
import { useAuth } from "./hooks/useAuth";
import { AuthPage } from "./pages/Auth";
// prettier-ignore
import { Dashboard, Invoices, CreateInvoice, Products, Transactions, Customers, Accounts, Reports, Settings, Demo, Expenses } from "./pages";

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <Center h="100vh">
        <LoadingOverlay visible />
      </Center>
    );
  }

  if (!user) {
    return <AuthPage />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Dashboard />} />
          <Route path="demo" element={<Demo />} />
          <Route path="invoices" element={<Invoices />} />
          <Route path="invoices/create" element={<CreateInvoice />} />
          <Route path="invoices/edit/:id" element={<CreateInvoice />} />
          <Route path="invoices/recurring" element={<Invoices />} />
          <Route path="products" element={<Products />} />
          <Route path="expenses" element={<Expenses />} />
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
  );
}

export default App;
