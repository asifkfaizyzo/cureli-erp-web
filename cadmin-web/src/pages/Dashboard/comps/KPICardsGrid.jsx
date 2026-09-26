// cadmin-web/src/pages/Dashboard/comps/KPICardsGrid.jsx (do not remove this comment)
// src/pages/Dashboard/comps/KPICardsGrid.jsx

import { useNavigate } from "react-router-dom";
import {
  Store,
  Users,
  CreditCard,
  Ticket,
  Mail,
  ShieldCheck,
  AlertTriangle,
  Ban,
  BadgeIndianRupee,
  Clock,
  Building2,
} from "lucide-react";
import KPICard from "./KPICard";

//  Currency formatter helper
const formatCurrency = (value) => {
  const num = parseFloat(value) || 0;
  if (num >= 10000000) return `₹${(num / 10000000).toFixed(2)}Cr`;
  if (num >= 100000) return `₹${(num / 100000).toFixed(2)}L`;
  if (num >= 1000) return `₹${(num / 1000).toFixed(1)}K`;
  return `₹${num.toLocaleString("en-IN")}`;
};

const KPICardsGrid = ({ data, period, role, loading }) => {
  const navigate = useNavigate();

  if (!data) return null;

  const kpis = [];

  // Common KPIs
  if (data.shops) {
    kpis.push({
      id: "total-shops",
      title: "Total Shops",
      value: data.shops.total || 0,
      change: data.shops.growth,
      trend: (data.shops.growth || 0) >= 0 ? "up" : "down",
      icon: Store,
      gradient: "blue",
      onClick: () => navigate("/shops"),
      roles: ["SUPER_CADMIN", "ANALYST", "ACCOUNTANT", "SALESMAN"],
    });
  }

  if (data.subscriptions) {
    kpis.push({
      id: "active-subs",
      title: "Active Subs",
      value: data.subscriptions.active || 0,
      icon: CreditCard,
      gradient: "green",
      onClick: () => navigate("/subscriptions/manage"),
      roles: ["SUPER_CADMIN", "ANALYST", "ACCOUNTANT"],
    });
  }

  // Role-specific
  if (role === "SUPER_CADMIN" || role === "ANALYST") {
    if (data.shops) {
      kpis.push({
        id: "verified",
        title: "Verified",
        value: data.shops.verified || 0,
        icon: ShieldCheck,
        gradient: "purple",
        onClick: () => navigate("/verification"),
        roles: ["SUPER_CADMIN", "ANALYST"],
      });
      kpis.push({
        id: "pending",
        title: "Pending",
        value: data.shops.pendingVerification || 0,
        icon: Clock,
        gradient: "amber",
        onClick: () => navigate("/verification"),
        roles: ["SUPER_CADMIN", "ANALYST"],
      });
    }
    if (data.users) {
      kpis.push({
        id: "users",
        title: "Users",
        value: data.users.total || 0,
        change: data.users.growth,
        trend: (data.users.growth || 0) >= 0 ? "up" : "down",
        icon: Users,
        gradient: "indigo",
        onClick: () => navigate("/users"),
        roles: ["SUPER_CADMIN", "ANALYST"],
      });
    }
    if (data.tickets) {
      kpis.push({
        id: "tickets",
        title: "Pending Tickets",
        value: data.tickets.totalOpen || 0,
        icon: Ticket,
        gradient: "amber",
        onClick: () => navigate("/communications/tickets"),
        roles: ["SUPER_CADMIN", "ANALYST"],
      });
    }
    if (data.enquiries) {
      kpis.push({
        id: "enquiries",
        title: "Enquiries",
        value: data.enquiries.pending || 0,
        icon: Mail,
        gradient: "teal",
        onClick: () => navigate("/communications/enquiries"),
        roles: ["SUPER_CADMIN", "ANALYST"],
      });
    }
  }

  if (role === "SUPER_CADMIN" || role === "ACCOUNTANT") {
    if (data.subscriptions) {
      kpis.push({
        id: "at-risk",
        title: "At Risk",
        value: data.subscriptions.atRiskTotal || 0,
        icon: AlertTriangle,
        gradient: "red",
        onClick: () => navigate("/subscriptions"),
        roles: ["SUPER_CADMIN", "ACCOUNTANT"],
      });
    }
    if (data.revenue) {
      //  FIXED: Amount is already in rupees, NO division needed
      kpis.push({
        id: "revenue",
        title: "Revenue",
        value: formatCurrency(data.revenue.totalRevenue),
        change: data.revenue.revenueGrowth,
        trend: (data.revenue.revenueGrowth || 0) >= 0 ? "up" : "down",
        icon: BadgeIndianRupee,
        gradient: "green",
        roles: ["SUPER_CADMIN", "ACCOUNTANT"],
      });
    }
  }

  if (role === "ACCOUNTANT") {
    if (data.subscriptions) {
      kpis.push({
        id: "suspended",
        title: "Suspended",
        value: data.subscriptions.suspended || 0,
        icon: Ban,
        gradient: "gray",
        onClick: () => navigate("/subscriptions/risk"),
        roles: ["ACCOUNTANT"],
      });
      kpis.push({
        id: "grace",
        title: "Grace Period",
        value: data.subscriptions.gracePeriod || 0,
        icon: AlertTriangle,
        gradient: "amber",
        onClick: () => navigate("/subscriptions/risk"),
        roles: ["ACCOUNTANT"],
      });
      kpis.push({
        id: "expiring",
        title: "Expiring",
        value: data.subscriptions.expiring || 0,
        icon: Clock,
        gradient: "blue",
        onClick: () => navigate("/subscriptions/risk"),
        roles: ["ACCOUNTANT"],
      });
    }
  }

  if (role === "SALESMAN") {
    if (data.shops) {
      kpis.push({
        id: "active-shops",
        title: "Active Shops",
        value: data.shops.active || 0,
        icon: Building2,
        gradient: "green",
        onClick: () => navigate("/shops"),
        roles: ["SALESMAN"],
      });
    }
    if (data.users) {
      kpis.push({
        id: "users-basic",
        title: "Users",
        value: data.users.total || 0,
        icon: Users,
        gradient: "indigo",
        roles: ["SALESMAN"],
      });
    }
  }

  const filtered = kpis.filter((k) => k.roles.includes(role));
  const count = filtered.length;

  const gridClass =
    count <= 3
      ? "grid-cols-1 sm:grid-cols-3"
      : count <= 4
        ? "grid-cols-2 sm:grid-cols-4"
        : count <= 6
          ? "grid-cols-2 sm:grid-cols-3 lg:grid-cols-6"
          : "grid-cols-2 sm:grid-cols-4 lg:grid-cols-6";

  return (
    <div className={`grid ${gridClass} gap-2.5`}>
      {filtered.map((kpi, i) => (
        <KPICard key={kpi.id} {...kpi} loading={loading} delay={i} />
      ))}
    </div>
  );
};

export default KPICardsGrid;
