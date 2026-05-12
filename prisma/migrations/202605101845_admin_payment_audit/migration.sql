-- Add payment evidence fields used by the admin panel.
ALTER TABLE "Order"
ADD COLUMN "payerEmail" TEXT,
ADD COLUMN "payerName" TEXT,
ADD COLUMN "payerId" TEXT,
ADD COLUMN "providerStatus" TEXT,
ADD COLUMN "clientIp" TEXT,
ADD COLUMN "clientIpHash" TEXT,
ADD COLUMN "userAgent" TEXT,
ADD COLUMN "checkoutRequestId" TEXT,
ADD COLUMN "paidAt" TIMESTAMP(3),
ADD COLUMN "failedAt" TIMESTAMP(3);

CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");
CREATE INDEX "Order_gateway_createdAt_idx" ON "Order"("gateway", "createdAt");
CREATE INDEX "Order_payerEmail_idx" ON "Order"("payerEmail");
CREATE INDEX "Order_username_idx" ON "Order"("username");
