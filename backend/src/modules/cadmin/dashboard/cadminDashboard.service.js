// backend/src/modules/cadmin/dashboard/cadminDashboard.service.js (do not remove this comment)
// backend/src/modules/cadmin/dashboard/cadminDashboard.service.js

import prisma from "../../../config/prisma.js";

// ============================================
// HELPER FUNCTIONS
// ============================================

function getPeriodDates(period) {
  const now = new Date();
  let startDate;
  
  switch (period) {
    case "7d":
      startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      break;
    case "30d":
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      break;
    case "90d":
      startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
      break;
    case "6m":
      startDate = new Date(now);
      startDate.setMonth(startDate.getMonth() - 6);
      break;
    case "1y":
      startDate = new Date(now);
      startDate.setFullYear(startDate.getFullYear() - 1);
      break;
    default:
      startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
  }
  
  return { startDate, endDate: now };
}

function getPreviousPeriodDates(period) {
  const { startDate, endDate } = getPeriodDates(period);
  const duration = endDate.getTime() - startDate.getTime();
  
  return {
    startDate: new Date(startDate.getTime() - duration),
    endDate: startDate,
  };
}

function calculateGrowth(current, previous) {
  if (previous === 0) return current > 0 ? 100 : 0;
  return Math.round(((current - previous) / previous) * 100);
}

// ============================================
// GET DASHBOARD OVERVIEW
// ============================================

export async function getDashboardOverview(period = "30d", role = "SUPER_CADMIN") {
  const { startDate, endDate } = getPeriodDates(period);
  const { startDate: prevStartDate, endDate: prevEndDate } = getPreviousPeriodDates(period);
  
  try {
    const now = new Date();

    // ============================================
    // SHOP STATISTICS
    // ============================================
    const [
      totalShops,
      activeShops,
      verifiedShops,
      pendingVerification,
      newShopsInPeriod,
      newShopsPrevPeriod,
    ] = await Promise.all([
      prisma.shop.count(),
      prisma.shop.count({ where: { is_active: true } }),
      prisma.shop.count({ where: { verification_status: "verified" } }),
      prisma.shop.count({ where: { verification_status: "pending_review" } }),
      prisma.shop.count({ where: { created_at: { gte: startDate, lte: endDate } } }),
      prisma.shop.count({ where: { created_at: { gte: prevStartDate, lte: prevEndDate } } }),
    ]);

    // ============================================
    // USER STATISTICS
    // ============================================
    const [totalUsers, activeUsers, newUsersInPeriod, newUsersPrevPeriod] = await Promise.all([
      prisma.user.count(),
      prisma.user.count({ where: { is_active: true } }),
      prisma.user.count({ where: { created_at: { gte: startDate, lte: endDate } } }),
      prisma.user.count({ where: { created_at: { gte: prevStartDate, lte: prevEndDate } } }),
    ]);

    // ============================================
    // SUBSCRIPTION STATISTICS
    // ============================================
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const [totalSubscriptions, activeSubscriptions, expiringSubscriptions, gracePeriodSubscriptions, suspendedSubscriptions] = await Promise.all([
      prisma.shopSubscription.count(),
      prisma.shopSubscription.count({ where: { is_active: true, status: "active", end_date: { gte: now } } }),
      prisma.shopSubscription.count({ where: { is_active: true, end_date: { gte: now, lte: thirtyDaysFromNow } } }),
      prisma.shopSubscription.count({ where: { is_active: true, end_date: { lt: now }, grace_period_until: { gt: now } } }),
      prisma.shopSubscription.count({ where: { OR: [{ is_active: false }, { status: "suspended" }] } }),
    ]);

    // ============================================
    // PLAN STATISTICS
    // ============================================
    const [activePlans, draftPlans] = await Promise.all([
      prisma.plan.count({ where: { status: "ACTIVE", deleted_at: null } }),
      prisma.plan.count({ where: { status: "DRAFT", deleted_at: null } }),
    ]);

    // ============================================
    // TICKET STATISTICS
    // ============================================
    const [pendingTickets, inProgressTickets, resolvedTicketsInPeriod] = await Promise.all([
      prisma.ticket.count({ where: { status: "PENDING" } }),
      prisma.ticket.count({ where: { status: "IN_PROGRESS" } }),
      prisma.ticket.count({ where: { status: { in: ["RESOLVED", "CLOSED"] }, updated_at: { gte: startDate, lte: endDate } } }),
    ]);

    // ============================================
    // ENQUIRY STATISTICS
    // ============================================
    const [pendingEnquiries, repliedEnquiriesInPeriod] = await Promise.all([
      prisma.enquiry.count({ where: { status: "PENDING" } }),
      prisma.enquiry.count({ where: { status: "REPLIED", updated_at: { gte: startDate, lte: endDate } } }),
    ]);

    // ============================================
    // REVENUE STATISTICS
    // ============================================
    const validStatuses = [
      "success", "SUCCESS", 
      "completed", "COMPLETED", 
      "paid", "PAID",
      "captured", "CAPTURED",
      "authorized", "AUTHORIZED"
    ];
    
    const [currentPeriodPayments, previousPeriodPayments] = await Promise.all([
      prisma.paymentTransaction.aggregate({
        where: {
          status: { in: validStatuses },
          created_at: { gte: startDate, lte: endDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
      prisma.paymentTransaction.aggregate({
        where: {
          status: { in: validStatuses },
          created_at: { gte: prevStartDate, lte: prevEndDate },
        },
        _sum: { amount: true },
        _count: true,
      }),
    ]);
    
    const currentRevenue = Number(currentPeriodPayments._sum.amount || 0);
    const previousRevenue = Number(previousPeriodPayments._sum.amount || 0);

    // ============================================
    // CALCULATE GROWTH
    // ============================================
    const shopGrowth = calculateGrowth(newShopsInPeriod, newShopsPrevPeriod);
    const userGrowth = calculateGrowth(newUsersInPeriod, newUsersPrevPeriod);
    const revenueGrowth = calculateGrowth(currentRevenue, previousRevenue);

    // ============================================
    // BUILD RESPONSE
    // ============================================
    const response = {
      shops: {
        total: totalShops,
        active: activeShops,
        verified: verifiedShops,
        pendingVerification: pendingVerification,
        newInPeriod: newShopsInPeriod,
        growth: shopGrowth,
      },
      subscriptions: {
        total: totalSubscriptions,
        active: activeSubscriptions,
        expiring: expiringSubscriptions,
        gracePeriod: gracePeriodSubscriptions,
        suspended: suspendedSubscriptions,
        atRiskTotal: expiringSubscriptions + gracePeriodSubscriptions + suspendedSubscriptions,
      },
      period: period,
      generatedAt: new Date().toISOString(),
    };

    if (role === "SUPER_CADMIN" || role === "ANALYST") {
      response.users = { total: totalUsers, active: activeUsers, newInPeriod: newUsersInPeriod, growth: userGrowth };
      response.plans = { active: activePlans, draft: draftPlans };
      response.tickets = { pending: pendingTickets, inProgress: inProgressTickets, resolvedInPeriod: resolvedTicketsInPeriod, totalOpen: pendingTickets + inProgressTickets };
      response.enquiries = { pending: pendingEnquiries, repliedInPeriod: repliedEnquiriesInPeriod };
    }

    if (role === "SUPER_CADMIN" || role === "ACCOUNTANT") {
      response.revenue = {
        totalRevenue: currentRevenue,
        previousRevenue: previousRevenue,
        revenueGrowth: revenueGrowth,
        transactionCount: currentPeriodPayments._count,
      };
    }

    if (role === "SALESMAN") {
      response.users = { total: totalUsers, active: activeUsers };
    }

    return response;
  } catch (error) {
    console.error("[DASHBOARD SVC] getDashboardOverview error:", error);
    throw error;
  }
}

// ============================================
// GET REVENUE DATA
// ============================================

export async function getRevenueData(period = "30d") {
  const { startDate, endDate } = getPeriodDates(period);
  
  try {
    const validStatuses = [
      "success", "SUCCESS", 
      "completed", "COMPLETED", 
      "paid", "PAID",
      "captured", "CAPTURED",
      "authorized", "AUTHORIZED"
    ];
    
    const payments = await prisma.paymentTransaction.findMany({
      where: {
        status: { in: validStatuses },
        created_at: { gte: startDate, lte: endDate },
      },
      select: {
        amount: true,
        created_at: true,
        status: true,
      },
      orderBy: { created_at: "asc" },
    });
    
    // Group by day
    const dailyRevenue = {};
    payments.forEach((payment) => {
      const dateKey = payment.created_at.toISOString().split("T")[0];
      const amount = Number(payment.amount || 0);
      dailyRevenue[dateKey] = (dailyRevenue[dateKey] || 0) + amount;
    });
    
    // Fill all days in range
    const data = [];
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split("T")[0];
      const value = dailyRevenue[dateKey] || 0;
      
      data.push({
        date: dateKey,
        label: new Date(dateKey).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        value: value,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const totalRevenue = data.reduce((sum, d) => sum + d.value, 0);
    const avgRevenue = data.length > 0 ? Math.round(totalRevenue / data.length) : 0;
    const maxValue = Math.max(...data.map((d) => d.value), 1);
    
    return {
      data,
      summary: {
        total: totalRevenue,
        average: avgRevenue,
        maxValue: maxValue,
        period,
        transactionCount: payments.length,
      },
    };
  } catch (error) {
    console.error("[DASHBOARD SVC] getRevenueData error:", error);
    throw error;
  }
}

// ============================================
// GET USER GROWTH DATA
// ============================================

export async function getUserGrowthData(period = "30d") {
  const { startDate, endDate } = getPeriodDates(period);
  
  try {
    const [usersBeforePeriod, shopsBeforePeriod] = await Promise.all([
      prisma.user.count({ where: { created_at: { lt: startDate } } }),
      prisma.shop.count({ where: { created_at: { lt: startDate } } }),
    ]);
    
    const [newUsers, newShops] = await Promise.all([
      prisma.user.findMany({
        where: { created_at: { gte: startDate, lte: endDate } },
        select: { created_at: true },
        orderBy: { created_at: "asc" },
      }),
      prisma.shop.findMany({
        where: { created_at: { gte: startDate, lte: endDate } },
        select: { created_at: true },
        orderBy: { created_at: "asc" },
      }),
    ]);
    
    // Group by date
    const dailyUsers = {};
    const dailyShops = {};
    
    newUsers.forEach((u) => {
      const dateKey = u.created_at.toISOString().split("T")[0];
      dailyUsers[dateKey] = (dailyUsers[dateKey] || 0) + 1;
    });
    
    newShops.forEach((s) => {
      const dateKey = s.created_at.toISOString().split("T")[0];
      dailyShops[dateKey] = (dailyShops[dateKey] || 0) + 1;
    });
    
    // Build cumulative data
    const data = [];
    let cumulativeUsers = usersBeforePeriod;
    let cumulativeShops = shopsBeforePeriod;
    const currentDate = new Date(startDate);
    
    while (currentDate <= endDate) {
      const dateKey = currentDate.toISOString().split("T")[0];
      const newUsersToday = dailyUsers[dateKey] || 0;
      const newShopsToday = dailyShops[dateKey] || 0;
      
      cumulativeUsers += newUsersToday;
      cumulativeShops += newShopsToday;
      
      data.push({
        date: dateKey,
        label: new Date(dateKey).toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        users: cumulativeUsers,
        shops: cumulativeShops,
        newUsers: newUsersToday,
        newShops: newShopsToday,
      });
      
      currentDate.setDate(currentDate.getDate() + 1);
    }
    
    const firstData = data[0] || { users: 0, shops: 0 };
    const lastData = data[data.length - 1] || { users: 0, shops: 0 };
    
    return {
      data,
      summary: {
        totalUsers: lastData.users,
        totalShops: lastData.shops,
        newUsersInPeriod: newUsers.length,
        newShopsInPeriod: newShops.length,
        userGrowth: calculateGrowth(lastData.users, firstData.users),
        shopGrowth: calculateGrowth(lastData.shops, firstData.shops),
        period,
      },
    };
  } catch (error) {
    console.error("[DASHBOARD SVC] getUserGrowthData error:", error);
    throw error;
  }
}

// ============================================
// GET TOP SHOPS
// ============================================

export async function getTopShops(period = "30d", page = 1, limit = 5) {
  const { startDate, endDate } = getPeriodDates(period);
  const skip = (page - 1) * limit;
  
  try {
    const totalCount = await prisma.shop.count({ where: { is_active: true } });
    
    const shops = await prisma.shop.findMany({
      where: { is_active: true },
      select: {
        shop_id: true,
        business_name: true,
        city: true,
        state: true,
        verification_status: true,
        created_at: true,
        _count: {
          select: {
            users: true,
            branches: true,
          },
        },
        currentSubscription: {
          select: {
            branch_limit_snapshot: true,
            user_limit_snapshot: true,
            billing_cycle: true,
            end_date: true,
            plan: {
              select: { name: true },
            },
          },
        },
      },
      orderBy: [{ created_at: "desc" }],
      skip,
      take: limit,
    });
    
    const result = shops.map((shop) => ({
      id: shop.shop_id,
      name: shop.business_name,
      location: [shop.city, shop.state].filter(Boolean).join(", ") || "N/A",
      verified: shop.verification_status === "verified",
      branchesUsed: shop._count.branches,
      branchesLimit: shop.currentSubscription?.branch_limit_snapshot || 0,
      usersUsed: shop._count.users,
      usersLimit: shop.currentSubscription?.user_limit_snapshot || 0,
      plan: shop.currentSubscription?.plan?.name || "No Plan",
      billingCycle: shop.currentSubscription?.billing_cycle || "N/A",
      validUntil: shop.currentSubscription?.end_date || null,
      created_at: shop.created_at,
    }));
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      shops: result,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error("[DASHBOARD SVC] getTopShops error:", error);
    throw error;
  }
}

// ============================================
// GET SUBSCRIPTION DISTRIBUTION
// ============================================

export async function getSubscriptionDistribution() {
  try {
    const now = new Date();
    const thirtyDaysFromNow = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    
    const [activeCount, expiringCount, graceCount, suspendedCount] = await Promise.all([
      prisma.shopSubscription.count({ where: { is_active: true, status: "active", end_date: { gte: thirtyDaysFromNow } } }),
      prisma.shopSubscription.count({ where: { is_active: true, end_date: { gte: now, lt: thirtyDaysFromNow } } }),
      prisma.shopSubscription.count({ where: { is_active: true, end_date: { lt: now }, grace_period_until: { gt: now } } }),
      prisma.shopSubscription.count({ where: { OR: [{ is_active: false }, { status: "suspended" }] } }),
    ]);
    
    const total = activeCount + expiringCount + graceCount + suspendedCount;
    
    return {
      active: activeCount,
      expiring: expiringCount,
      grace: graceCount,
      suspended: suspendedCount,
      total,
    };
  } catch (error) {
    console.error("[DASHBOARD SVC] getSubscriptionDistribution error:", error);
    throw error;
  }
}

// ============================================
// GET RECENT ONBOARDING
// ============================================

export async function getRecentOnboarding(page = 1, limit = 5) {
  const skip = (page - 1) * limit;
  
  try {
    const totalCount = await prisma.user.count({
      where: {
        role: "super_admin",
        shop_id: { not: null },
      },
    });
    
    const recentUsers = await prisma.user.findMany({
      where: {
        role: "super_admin",
        shop_id: { not: null },
      },
      orderBy: { created_at: "desc" },
      skip,
      take: limit,
      select: {
        user_id: true,
        full_name: true,
        email: true,
        status: true,
        onboarding_step: true,
        created_at: true,
        shop: {
          select: {
            shop_id: true,
            business_name: true,
            verification_status: true,
            is_active: true,
            _count: {
              select: {
                branches: true,
                users: true,
              },
            },
            currentSubscription: {
              select: {
                branch_limit_snapshot: true,
                user_limit_snapshot: true,
              },
            },
          },
        },
      },
    });
    
    const result = recentUsers.map((user) => {
      let status = "in_progress";
      if (user.onboarding_step >= 4 && user.shop?.verification_status === "verified") {
        status = "completed";
      } else if (user.onboarding_step < 2 && Date.now() - new Date(user.created_at).getTime() > 24 * 60 * 60 * 1000) {
        status = "stuck";
      }
      
      return {
        id: user.user_id,
        shop_name: user.shop?.business_name || "N/A",
        shop_id: user.shop?.shop_id,
        owner_name: user.full_name,
        email: user.email,
        step: user.onboarding_step,
        max_steps: 4,
        status,
        verification_status: user.shop?.verification_status || "pending",
        branchesUsed: user.shop?._count?.branches || 0,
        branchesLimit: user.shop?.currentSubscription?.branch_limit_snapshot || 0,
        usersUsed: user.shop?._count?.users || 0,
        usersLimit: user.shop?.currentSubscription?.user_limit_snapshot || 0,
        created_at: user.created_at,
      };
    });
    
    const totalPages = Math.ceil(totalCount / limit);
    
    return {
      users: result,
      pagination: {
        page,
        limit,
        totalCount,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    };
  } catch (error) {
    console.error("[DASHBOARD SVC] getRecentOnboarding error:", error);
    throw error;
  }
}

// ============================================
// GET RECENT ACTIVITY
// ============================================

export async function getRecentActivity(limit = 10) {
  try {
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { created_at: "desc" },
      take: limit,
      select: {
        audit_id: true,
        action: true,
        actor_type: true,
        entity_type: true,
        metadata: true,
        created_at: true,
      },
    });
    
    const activities = auditLogs.map((log) => {
      const metadata = log.metadata || {};
      let message = log.action.replace(/_/g, " ").toLowerCase();
      let type = "settings_updated";
      
      if (log.action.includes("USER")) {
        type = log.action.includes("SUSPENDED") ? "user_suspended" : log.action.includes("ACTIVATED") ? "user_activated" : "user_created";
        message = `User ${log.action.split("_").pop()?.toLowerCase() || "updated"}: ${metadata.username || "Unknown"}`;
      } else if (log.action.includes("SHOP")) {
        type = log.action.includes("VERIFIED") ? "shop_verified" : log.action.includes("SUSPENDED") ? "shop_suspended" : "shop_created";
        message = `Shop ${log.action.split("_").pop()?.toLowerCase() || "updated"}: ${metadata.shop_name || "Unknown"}`;
      } else if (log.action.includes("SUBSCRIPTION")) {
        type = "subscription_created";
        message = `Subscription ${log.action.split("_").pop()?.toLowerCase() || "updated"}`;
      } else if (log.action.includes("TICKET")) {
        type = "ticket_resolved";
        message = metadata.ticket_number ? `Ticket #${metadata.ticket_number} ${log.action.split("_").pop()?.toLowerCase()}` : message;
      } else if (log.action.includes("BROADCAST")) {
        type = "broadcast_sent";
        message = `Broadcast sent to ${metadata.recipient_count || 0} users`;
      } else if (log.action.includes("PLAN")) {
        type = "plan_updated";
        message = `Plan ${metadata.name || ""} ${log.action.split("_").pop()?.toLowerCase()}`;
      }
      
      return {
        id: log.audit_id,
        type,
        action: log.action,
        message,
        actor: log.actor_type === "cadmin" ? "Admin" : "System",
        entity_type: log.entity_type,
        timestamp: log.created_at,
      };
    });
    
    return activities;
  } catch (error) {
    console.error("[DASHBOARD SVC] getRecentActivity error:", error);
    throw error;
  }
}

// ============================================
// GET DASHBOARD ALERTS
// ============================================

export async function getDashboardAlerts(role = "SUPER_CADMIN") {
  try {
    const alerts = [];
    const now = new Date();
    
    const suspendedCount = await prisma.shopSubscription.count({
      where: { OR: [{ is_active: false }, { status: "suspended" }] },
    });
    
    if (suspendedCount > 0) {
      alerts.push({
        id: "suspended-subscriptions",
        type: "error",
        title: "Suspended Subscriptions",
        message: `${suspendedCount} subscription(s) are currently suspended.`,
        action: { label: "View", path: "/subscriptions/risk" },
        priority: 1,
      });
    }
    
    const graceCount = await prisma.shopSubscription.count({
      where: { is_active: true, end_date: { lt: now }, grace_period_until: { gt: now } },
    });
    
    if (graceCount > 0) {
      alerts.push({
        id: "grace-period",
        type: "warning",
        title: "Grace Period Active",
        message: `${graceCount} subscription(s) in grace period need attention.`,
        action: { label: "Review", path: "/subscriptions/risk" },
        priority: 2,
      });
    }
    
    const expiringCount = await prisma.shopSubscription.count({
      where: { is_active: true, end_date: { gte: now, lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) } },
    });
    
    if (expiringCount > 0) {
      alerts.push({
        id: "expiring-soon",
        type: "warning",
        title: "Expiring Soon",
        message: `${expiringCount} subscription(s) expiring within 7 days.`,
        action: { label: "View", path: "/subscriptions/risk" },
        priority: 3,
      });
    }
    
    if (role === "SUPER_CADMIN" || role === "ANALYST") {
      const pendingTickets = await prisma.ticket.count({ where: { status: "PENDING" } });
      if (pendingTickets > 5) {
        alerts.push({
          id: "pending-tickets",
          type: "warning",
          title: "Pending Tickets",
          message: `${pendingTickets} tickets awaiting response.`,
          action: { label: "View", path: "/communications/tickets" },
          priority: 4,
        });
      }
      
      const pendingVerifications = await prisma.shop.count({ where: { verification_status: "pending_review" } });
      if (pendingVerifications > 0) {
        alerts.push({
          id: "pending-verifications",
          type: "info",
          title: "Pending Verifications",
          message: `${pendingVerifications} shop(s) awaiting verification.`,
          action: { label: "Review", path: "/verification" },
          priority: 5,
        });
      }
    }
    
    alerts.sort((a, b) => a.priority - b.priority);
    return alerts;
  } catch (error) {
    console.error("[DASHBOARD SVC] getDashboardAlerts error:", error);
    throw error;
  }
}