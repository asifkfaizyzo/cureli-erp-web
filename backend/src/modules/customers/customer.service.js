// backend/src/modules/customers/customer.service.js (do not remove this comment)
// backend/src/modules/customers/customer.service.js

import prisma from "../../config/prisma.js";

class ApiError extends Error {
  constructor(message, statusCode = 400, code = "CUSTOMER_ERROR") {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
  }
}

class CustomerService {
  // ============================================
  // CREATE CUSTOMER
  // ============================================

  async createCustomer(data, shopId, branchId, userId) {
    const existing = await prisma.customer.findFirst({
      where: {
        shop_id: shopId,
        phone: data.phone,
      },
    });

    if (existing) {
      throw new ApiError(
        `Customer with phone ${data.phone} already exists`,
        409,
        "DUPLICATE_CUSTOMER",
      );
    }

    const customer = await prisma.customer.create({
      data: {
        ...data,
        shop_id: shopId,
        branch_id: branchId,
        created_by: userId,
      },
    });

    if (data.credit_limit > 0) {
      await prisma.customerLedger.create({
        data: {
          customer_id: customer.customer_id,
          shop_id: shopId,
          branch_id: branchId,
          transaction_type: "OPENING_BALANCE",
          reference_type: "CUSTOMER_CREATION",
          reference_id: customer.customer_id,
          reference_number: `CUST-${customer.customer_id.slice(-8)}`,
          debit_amount: 0,
          credit_amount: 0,
          balance_after: 0,
          transaction_date: new Date(),
          remarks: "Customer created with credit limit",
          created_by: userId,
        },
      });
    }

    return customer;
  }

  // ============================================
  // GET CUSTOMERS
  // ============================================

  async getCustomers(shopId, branchId, role, branchMode, filters = {}) {
    const { search, isActive = true, limit = 50, offset = 0 } = filters;

    const where = {
      shop_id: shopId,
      ...(role !== "super_admin" || branchMode !== "GLOBAL"
        ? { branch_id: branchId }
        : {}),
      ...(isActive !== undefined && { is_active: isActive }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: "insensitive" } },
          { phone: { contains: search, mode: "insensitive" } },
          { email: { contains: search, mode: "insensitive" } },
        ],
      }),
    };

    const [customers, total] = await Promise.all([
      prisma.customer.findMany({
        where,
        include: {
          branch: {
            select: { branch_id: true, branch_name: true },
          },
          _count: {
            select: { salesInvoices: true },
          },
        },
        orderBy: { name: "asc" },
        take: limit,
        skip: offset,
      }),
      prisma.customer.count({ where }),
    ]);

    return { customers, total };
  }

  // ============================================
  // SEARCH CUSTOMERS (for autocomplete)
  // ============================================

  async searchCustomers(shopId, branchId, searchTerm, limit = 10) {
    return prisma.customer.findMany({
      where: {
        shop_id: shopId,
        is_active: true,
        OR: [
          { name: { contains: searchTerm, mode: "insensitive" } },
          { phone: { contains: searchTerm, mode: "insensitive" } },
        ],
      },
      select: {
        customer_id: true,
        name: true,
        phone: true,
        email: true,
        discount_percent: true,
        credit_limit: true,
        outstanding_balance: true,
        gst_number: true,
        //  ADD these address fields
        address_line_1: true,
        address_line_2: true,
        city: true,
        state: true,
        pincode: true,
      },
      orderBy: { name: "asc" },
      take: limit,
    });
  }

  // ============================================
  // GET CUSTOMER BY ID
  // ============================================

  async getCustomerById(customerId, shopId) {
    const customer = await prisma.customer.findFirst({
      where: {
        customer_id: customerId,
        shop_id: shopId,
      },
      include: {
        branch: {
          select: { branch_id: true, branch_name: true },
        },
        salesInvoices: {
          take: 10,
          orderBy: { invoice_date: "desc" },
          select: {
            invoice_id: true,
            invoice_number: true,
            invoice_date: true,
            net_amount: true,
            payment_status: true,
            status: true,
          },
        },
        ledgerEntries: {
          take: 20,
          orderBy: { transaction_date: "desc" },
          select: {
            ledger_id: true,
            transaction_type: true,
            reference_number: true,
            debit_amount: true,
            credit_amount: true,
            balance_after: true,
            transaction_date: true,
            remarks: true,
          },
        },
      },
    });

    if (!customer) {
      throw new ApiError("Customer not found", 404, "NOT_FOUND");
    }

    return customer;
  }

  // ============================================
  // UPDATE CUSTOMER
  // ============================================

  async updateCustomer(customerId, shopId, data) {
    const customer = await prisma.customer.findFirst({
      where: {
        customer_id: customerId,
        shop_id: shopId,
      },
    });

    if (!customer) {
      throw new ApiError("Customer not found", 404, "NOT_FOUND");
    }

    if (data.phone && data.phone !== customer.phone) {
      const existing = await prisma.customer.findFirst({
        where: {
          shop_id: shopId,
          phone: data.phone,
          customer_id: { not: customerId },
        },
      });

      if (existing) {
        throw new ApiError(
          `Another customer with phone ${data.phone} already exists`,
          409,
          "DUPLICATE_PHONE",
        );
      }
    }

    return prisma.customer.update({
      where: { customer_id: customerId },
      data,
    });
  }

  // ============================================
  // GET CUSTOMER LEDGER
  // ============================================

  async getCustomerLedger(customerId, shopId, filters = {}) {
    const { startDate, endDate, limit = 50, offset = 0 } = filters;

    const where = {
      customer_id: customerId,
      ...(startDate &&
        endDate && {
          transaction_date: {
            gte: new Date(startDate),
            lte: new Date(endDate),
          },
        }),
    };

    const [entries, total] = await Promise.all([
      prisma.customerLedger.findMany({
        where,
        orderBy: { transaction_date: "desc" },
        take: limit,
        skip: offset,
      }),
      prisma.customerLedger.count({ where }),
    ]);

    return { entries, total };
  }

  // ============================================
  // UPDATE CUSTOMER BALANCE (internal use)
  // ============================================

  async updateCustomerBalance(tx, customerId, amount, isDebit) {
    const customer = await tx.customer.findUnique({
      where: { customer_id: customerId },
    });

    if (!customer) return;

    const currentBalance = parseFloat(customer.outstanding_balance) || 0;
    const newBalance = isDebit
      ? currentBalance + parseFloat(amount)
      : currentBalance - parseFloat(amount);

    await tx.customer.update({
      where: { customer_id: customerId },
      data: {
        outstanding_balance: Math.max(0, newBalance),
      },
    });
  }

  // ============================================
  // CHECK CREDIT AVAILABILITY
  // ============================================

  async checkCreditAvailability(customerId, requestedAmount) {
    const customer = await prisma.customer.findUnique({
      where: { customer_id: customerId },
    });

    if (!customer) {
      return { allowed: false, reason: "Customer not found" };
    }

    const creditLimit = parseFloat(customer.credit_limit) || 0;
    const outstanding = parseFloat(customer.outstanding_balance) || 0;
    const available = creditLimit - outstanding;

    if (requestedAmount > available) {
      return {
        allowed: false,
        reason: `Credit limit exceeded. Available: ₹${available.toFixed(2)}, Requested: ₹${requestedAmount.toFixed(2)}`,
        available,
        outstanding,
        creditLimit,
      };
    }

    return {
      allowed: true,
      available,
      outstanding,
      creditLimit,
    };
  }

  // ============================================
  // GET CUSTOMER STATISTICS
  // ============================================

  async getCustomerStats(customerId, shopId) {
    const customer = await prisma.customer.findFirst({
      where: {
        customer_id: customerId,
        shop_id: shopId,
      },
    });

    if (!customer) {
      throw new ApiError("Customer not found", 404, "NOT_FOUND");
    }

    const [totalPurchases, totalPaid, invoiceCount] = await Promise.all([
      prisma.salesInvoice.aggregate({
        where: {
          customer_id: customerId,
          status: "CONFIRMED",
          is_return: false,
        },
        _sum: { net_amount: true },
      }),
      prisma.salesPayment.aggregate({
        where: {
          customer_id: customerId,
          status: "COMPLETED",
        },
        _sum: { amount: true },
      }),
      prisma.salesInvoice.count({
        where: {
          customer_id: customerId,
          status: "CONFIRMED",
          is_return: false,
        },
      }),
    ]);

    return {
      customer_id: customerId,
      name: customer.name,
      total_purchases: totalPurchases._sum.net_amount || 0,
      total_paid: totalPaid._sum.amount || 0,
      outstanding_balance: customer.outstanding_balance,
      credit_limit: customer.credit_limit,
      available_credit:
        parseFloat(customer.credit_limit) -
        parseFloat(customer.outstanding_balance),
      invoice_count: invoiceCount,
      discount_percent: customer.discount_percent,
    };
  }

  // ============================================
  // RECORD CUSTOMER PAYMENT (Direct payment against outstanding)
  // ============================================

  async recordDirectPayment(customerId, shopId, branchId, data, userId) {
    const customer = await prisma.customer.findFirst({
      where: {
        customer_id: customerId,
        shop_id: shopId,
      },
    });

    if (!customer) {
      throw new ApiError("Customer not found", 404, "NOT_FOUND");
    }

    const paymentAmount = parseFloat(data.amount);
    const currentOutstanding = parseFloat(customer.outstanding_balance) || 0;

    if (paymentAmount <= 0) {
      throw new ApiError(
        "Payment amount must be greater than 0",
        400,
        "INVALID_AMOUNT",
      );
    }

    if (paymentAmount > currentOutstanding) {
      throw new ApiError(
        `Payment amount ₹${paymentAmount} exceeds outstanding balance ₹${currentOutstanding}`,
        400,
        "EXCEEDS_OUTSTANDING",
      );
    }

    const newOutstanding = currentOutstanding - paymentAmount;

    const result = await prisma.$transaction(async (tx) => {
      // Create payment record (not linked to specific invoice)
      const payment = await tx.salesPayment.create({
        data: {
          invoice_id: null, // Direct payment, not against specific invoice
          shop_id: shopId,
          branch_id: branchId,
          customer_id: customerId,
          payment_date: data.payment_date
            ? new Date(data.payment_date)
            : new Date(),
          amount: paymentAmount,
          payment_mode: data.payment_mode,
          reference_number: data.reference_number || null,
          status: "COMPLETED",
          remarks: data.remarks || "Direct payment against outstanding",
          created_by: userId,
        },
      });

      // Create ledger entry
      await tx.customerLedger.create({
        data: {
          customer_id: customerId,
          shop_id: shopId,
          branch_id: branchId,
          transaction_type: "PAYMENT",
          reference_type: "DIRECT_PAYMENT",
          reference_id: payment.payment_id,
          reference_number: `PMT-${payment.payment_id.slice(-8)}`,
          debit_amount: 0,
          credit_amount: paymentAmount,
          balance_after: newOutstanding,
          transaction_date: new Date(),
          remarks: data.remarks || "Direct payment received",
          created_by: userId,
        },
      });

      // Update customer balance
      await tx.customer.update({
        where: { customer_id: customerId },
        data: {
          outstanding_balance: newOutstanding,
        },
      });

      return { payment, new_outstanding: newOutstanding };
    });

    return result;
  }
}

export default new CustomerService();
