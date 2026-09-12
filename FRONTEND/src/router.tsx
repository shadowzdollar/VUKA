import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { LandingPage } from "./pages/LandingPage";
import { TraderDashboard } from "./pages/trader/TraderDashboard";
import { TraderOverview } from "./pages/trader/TraderOverview";
import { SendMoney } from "./pages/trader/SendMoney";
import { EscrowManagement } from "./pages/trader/EscrowManagement";
import { TrustScore } from "./pages/trader/TrustScore";
import { InvoiceManagement } from "./pages/trader/InvoiceManagement";
import { Activity as TraderActivity } from "./pages/trader/Activity";
import { Recipients } from "./pages/trader/Recipients";
import { Reports } from "./pages/trader/Reports";
import { Support } from "./pages/trader/Support";
import { Settings } from "./pages/trader/Settings";
import { OperatorDashboard } from "./pages/operator/OperatorDashboard";
import { OperatorOverview } from "./pages/operator/OperatorOverview";
import { Escrows } from "./pages/operator/Escrows";
import { Reconciliation } from "./pages/operator/Reconciliation";
import { Providers } from "./pages/operator/Providers";
import { Settlements } from "./pages/operator/Settlements";
import { Disputes } from "./pages/operator/Disputes";
import { Compliance } from "./pages/operator/Compliance";
import { Activity as OperatorActivity } from "./pages/operator/Activity";
import { Analytics } from "./pages/operator/Analytics";

const router = createBrowserRouter([
  {
    path: "/",
    element: <LandingPage />,
  },
  {
    path: "/trader",
    element: <TraderDashboard />,
    children: [
      { index: true, element: <TraderOverview /> },
      { path: "send", element: <SendMoney /> },
      { path: "escrow", element: <EscrowManagement /> },
      { path: "trust", element: <TrustScore /> },
      { path: "invoices", element: <InvoiceManagement /> },
      { path: "activity", element: <TraderActivity /> },
      { path: "recipients", element: <Recipients /> },
      { path: "reports", element: <Reports /> },
      { path: "support", element: <Support /> },
      { path: "settings", element: <Settings /> },
    ],
  },
  {
    path: "/operator",
    element: <OperatorDashboard />,
    children: [
      { index: true, element: <OperatorOverview /> },
      { path: "escrows", element: <Escrows /> },
      { path: "reconciliation", element: <Reconciliation /> },
      { path: "providers", element: <Providers /> },
      { path: "settlements", element: <Settlements /> },
      { path: "disputes", element: <Disputes /> },
      { path: "compliance", element: <Compliance /> },
      { path: "activity", element: <OperatorActivity /> },
      { path: "analytics", element: <Analytics /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  },
]);

export function Router() {
  return <RouterProvider router={router} />;
}
