// pharmacy-web/src/hooks/sales/useSalesAPI.js (do not remove this comment)
// pharmacy-web/src/hooks/sales/useSalesAPI.js

import { useState, useCallback } from 'react';
import salesAPI from '../../api/sales';
import customersAPI from '../../api/customers';
import medicinesAPI from '../../api/medicines';
import inventoryAPI from '../../api/inventory';
import { useToast } from '../../components/common/Toast';
import { getBillingData } from '../../api/marketplaceOrders';

export function useSalesAPI() {
  const toast = useToast();

  const [isLoading, setIsLoading]       = useState(false);
  const [medicines, setMedicines]       = useState([]);
  const [customers, setCustomers]       = useState([]);
  const [currentInvoice, setCurrentInvoice] = useState(null);

  // ── Load medicines ─────────────────────────────────────────────────────────
  const loadMedicines = useCallback(async () => {
    try {
      const response = await inventoryAPI.getInventory({
        includeExpired: false,
        limit: 5000,
      });

      const inventoryItems = response?.data?.inventories || [];
      const medicineMap = new Map();

      inventoryItems.forEach((inv) => {
        const availableStock = parseFloat(inv.available_stock) || 0;
        if (availableStock > 0 && inv.medicine_id) {
          if (!medicineMap.has(inv.medicine_id)) {
            medicineMap.set(inv.medicine_id, {
  medicine_id:           inv.medicine_id,
  name:                  inv.medicine_name || inv.medicine?.name || '',
  generic_name:          inv.medicine?.generic_name || '',
  manufacturer:          inv.medicine_manufacturer || inv.medicine?.manufacturer || '',
  hsn_code:              inv.medicine_hsn_code || inv.medicine?.hsn_code || '',
  pack_size:             inv.medicine_pack_size || inv.medicine?.pack_size || '',
  cgst_percentage:       inv.medicine?.cgst_percentage !== undefined ? inv.medicine.cgst_percentage : (inv.cgst_percentage || 0),
  sgst_percentage:       inv.medicine?.sgst_percentage !== undefined ? inv.medicine.sgst_percentage : (inv.sgst_percentage || 0),
  rack_no:               inv.rack_no || inv.medicine?.rack_no || '',
  total_available_stock: availableStock,
});
          } else {
            const existing = medicineMap.get(inv.medicine_id);
            existing.total_available_stock += availableStock;
            medicineMap.set(inv.medicine_id, existing);
          }
        }
      });

      setMedicines(Array.from(medicineMap.values()));
    } catch (error) {
      console.error('Load medicines error:', error);
      toast.error('Failed to load medicines');
    }
  }, [toast]);

  // ── Load customers ─────────────────────────────────────────────────────────
  const loadCustomers = useCallback(async () => {
    try {
      const response = await customersAPI.getAll({ isActive: true, limit: 500 });
      setCustomers(response.data?.customers || []);
    } catch (error) {
      console.error('Load customers error:', error);
    }
  }, []);

  // ── Search medicines ───────────────────────────────────────────────────────
  const searchMedicines = useCallback(async (searchTerm) => {
    try {
      const response = await medicinesAPI.search(searchTerm, 20);
      return response.data?.medicines || [];
    } catch (error) {
      console.error('Search medicines error:', error);
      return [];
    }
  }, []);

  // ── Get available batches ──────────────────────────────────────────────────
  const getAvailableBatches = useCallback(async (medicineId) => {
    try {
      const response = await salesAPI.getAvailableBatches(medicineId);
      return response.data?.batches || [];
    } catch (error) {
      console.error('Get batches error:', error);
      return [];
    }
  }, []);

  // ── Search customers ───────────────────────────────────────────────────────
  const searchCustomers = useCallback(async (searchTerm) => {
    try {
      const response = await customersAPI.search(searchTerm, 10);
      return response.data?.customers || [];
    } catch (error) {
      console.error('Search customers error:', error);
      return [];
    }
  }, []);

  // ── Create customer ────────────────────────────────────────────────────────
  const createCustomer = useCallback(async (customerData) => {
    try {
      const response = await customersAPI.create(customerData);
      if (response.success) {
        toast.success('Customer Created', `${customerData.name} added successfully`);
        await loadCustomers();
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      toast.error('Failed to create customer', error.message);
      return null;
    }
  }, [toast, loadCustomers]);

  // ── Save sales invoice (draft) ─────────────────────────────────────────────
  const saveSalesInvoice = useCallback(async (invoiceData, lineItems, customer) => {
    try {
      setIsLoading(true);

      const payload = {
        customer_id:          customer.customer_id || null,
        walkin_name:          !customer.customer_id ? customer.patientName : null,
        walkin_phone:         !customer.customer_id ? customer.phone : null,
        invoice_date:         new Date(invoiceData.invoice_date).toISOString(),
        prescription_number:  invoiceData.prescription_number || null,
        doctor_name:          customer.doctorName || null,
        bill_discount_percent: 0,
        lineItems: lineItems.map((item) => ({
          medicine_id:     item.medicine_id,
          inventory_id:    item.inventory_id,
          batch_number:    item.batch,
          expiry_date:     parseExpiryToDate(item.exp),
          quantity:        parseFloat(item.qty),
          unit_of_measure: 'UNIT',
          selling_rate:    parseFloat(item.mrp), // ← Send undiscounted MRP as selling_rate base
          mrp:             parseFloat(item.mrp),
          discount_percent: parseFloat(item.discountPercent) || 0,
          cgst_percent:    parseFloat(item.cgstPercent) || 6,
          sgst_percent:    parseFloat(item.sgstPercent) || 6,
        })),
        remarks: invoiceData.remarks || null,
      };

      let response;
      if (currentInvoice) {
        response = { success: true, data: currentInvoice };
      } else {
        response = await salesAPI.createDraft(payload);
      }

      if (response.success) {
        setCurrentInvoice(response.data);
        return response.data;
      }

      throw new Error(response.message || 'Failed to save invoice');
    } catch (error) {
      toast.error('Save Failed', error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentInvoice, toast]);

  // ── Confirm sales invoice ──────────────────────────────────────────────────
  const confirmSalesInvoice = useCallback(async (invoiceId, data = {}) => {
    try {
      setIsLoading(true);
      const response = await salesAPI.confirm(invoiceId, data);

      if (response.success) {
        setCurrentInvoice(response.data);
        return response.data;
      }

      throw new Error(response.message || 'Failed to confirm invoice');
    } catch (error) {
      toast.error('Confirmation Failed', error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ── Load invoice for edit ──────────────────────────────────────────────────
  const loadInvoiceForEdit = useCallback(async (invoiceId) => {
    try {
      setIsLoading(true);
      const response = await salesAPI.getById(invoiceId);
      if (response.success) {
        setCurrentInvoice(response.data);
        return response.data;
      }
      throw new Error(response.message || 'Failed to load invoice');
    } catch (error) {
      toast.error('Load Failed', error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ── Load marketplace billing data ─────────────────────────────────────
  const loadMarketplaceBillingData = useCallback(async (marketplaceOrderId) => {
    try {
      setIsLoading(true);
      const response = await getBillingData(marketplaceOrderId);
      if (response.success) return response.data;
      throw new Error(response.message || 'Failed to load order data');
    } catch (error) {
      toast.error('Load Failed', error.message);
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  // ── Reset invoice state ────────────────────────────────────────────────────
  const resetInvoice = useCallback(() => {
    setCurrentInvoice(null);
  }, []);

  // ── Record payment ─────────────────────────────────────────────────────────
  const recordPayment = useCallback(async (invoiceId, paymentData) => {
    try {
      const response = await salesAPI.recordPayment(invoiceId, paymentData);
      if (response.success) {
        setCurrentInvoice(response.data?.invoice);
        return response.data;
      }
      throw new Error(response.message);
    } catch (error) {
      toast.error('Payment Failed', error.message);
      return null;
    }
  }, [toast]);

  return {
    isLoading,
    medicines,
    customers,
    currentInvoice,
    loadMedicines,
    loadCustomers,
    searchMedicines,
    getAvailableBatches,
    searchCustomers,
    createCustomer,
    saveSalesInvoice,
    confirmSalesInvoice,
    loadMarketplaceBillingData,
    loadInvoiceForEdit,
    resetInvoice,
    recordPayment,
  };
}

function parseExpiryToDate(exp) {
  if (!exp) return new Date().toISOString();
  const parts = exp.split('/');
  if (parts.length === 2) {
    const month = parseInt(parts[0]) - 1;
    const year  = parseInt(parts[1]) + 2000;
    return new Date(year, month + 1, 0).toISOString();
  }
  return new Date().toISOString();
}