// backend/src/modules/notifications/templates/inapp/medicine.templates.js (do not remove this comment)
// backend/src/modules/notifications/templates/inapp/medicine.templates.js

export const medicineTemplates = {
  medicineLinked: (context) => {
    const {
      medicine_name,
      variant_name,
      master_name,
      linked_count,
    } = context;

    if (linked_count && linked_count > 1) {
      return {
        title: "Medicines Linked to Catalog",
        message: `${linked_count} medicines have been linked to the master catalog. Product images and details will now be available in the mobile app.`,
      };
    }

    let message = `"${medicine_name || "A medicine"}" has been linked to `;
    if (variant_name) {
      message += `"${variant_name}"`;
    } else if (master_name) {
      message += `"${master_name}"`;
    } else {
      message += "the master catalog";
    }
    message += ". Product images and details are now available for delivery.";

    return {
      title: "Medicine Linked to Catalog",
      message,
    };
  },

  medicineUnlinked: (context) => {
    const { medicine_name } = context;

    return {
      title: "Medicine Unlinked",
      message: `"${medicine_name || "A medicine"}" has been unlinked from the master catalog. Product images may no longer be available.`,
    };
  },
};

export default medicineTemplates;