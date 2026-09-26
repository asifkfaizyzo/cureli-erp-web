// pharmacy-web/src/components/data/pendingUsersData.js (do not remove this comment)
// src/components/data/pendingUsersData.js
// NOTE: using your uploaded image path as the url
const PLACEHOLDER = "/mnt/data/bff3336f-7a46-4d48-a751-31101ba32e68.png";

export const pendingUsers = [
  {
    id: 101,
    name: "Nikhil Kumar",
    phone: 9876543210,
    submittedOn: "2025-11-20",
    status: "pending",
    documents: [
      { key: "pharmacy_reg", title: "Pharmacy Registration", url: PLACEHOLDER },
      { key: "business_reg", title: "Business Registration Proof", url: PLACEHOLDER },
      { key: "shop_act", title: "Shop & Establishment Act Licence", url: PLACEHOLDER },
      { key: "drug_license", title: "Drug License", url: PLACEHOLDER },
      { key: "pan", title: "Owner's & Business PAN", url: PLACEHOLDER },
      { key: "address", title: "Address Proof", url: PLACEHOLDER },
    ],
  },
  {
    id: 102,
    name: "Asha Menon",
    phone: 9123456780,
    submittedOn: "2025-11-19",
    status: "pending",
    documents: [
      { key: "pharmacy_reg", title: "Pharmacy Registration", url: PLACEHOLDER },
      { key: "business_reg", title: "Business Registration Proof", url: PLACEHOLDER },
      { key: "shop_act", title: "Shop & Establishment Act Licence", url: PLACEHOLDER },
      { key: "drug_license", title: "Drug License", url: PLACEHOLDER },
      { key: "pan", title: "Owner's & Business PAN", url: PLACEHOLDER },
      { key: "address", title: "Address Proof", url: PLACEHOLDER },
    ],
  },

  // add more items as needed
];
