import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

async function fix() {
  const order = await prisma.marketplaceOrder.findUnique({
    where: { order_number: "MKT-000001" },
    select: { order_id: true, status: true },
  });

  if (!order) {
    console.log("Order not found");
    return;
  }

  console.log(`Order ${order.order_number} status: ${order.status}`);

  const delivery = await prisma.delivery.findUnique({
    where: { order_id: order.order_id },
    select: { delivery_id: true, status: true, rider_id: true },
  });

  if (!delivery) {
    console.log("No delivery record found");
    return;
  }

  console.log(`Delivery ${delivery.delivery_id} status: ${delivery.status}`);

  if (order.status === "COMPLETED" && delivery.status !== "DELIVERED") {
    await prisma.delivery.update({
      where: { order_id: order.order_id },
      data: {
        status: "DELIVERED",
        delivered_at: new Date(),
      },
    });
    console.log("✅ Delivery synced to DELIVERED");
  } else {
    console.log("Nothing to fix");
  }

  await prisma.$disconnect();
}

fix();