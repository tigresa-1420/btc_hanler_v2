-- CreateTable
CREATE TABLE "Currency" (
    "currency_id" SERIAL NOT NULL,
    "name" CHAR(50),
    "country" CHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Currency_pkey" PRIMARY KEY ("currency_id")
);

-- CreateTable
CREATE TABLE "Customer" (
    "customer_id" SERIAL NOT NULL,
    "name" CHAR(100),
    "transaction_fee" DECIMAL,
    "customer_wallet_address_id" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Customer_pkey" PRIMARY KEY ("customer_id")
);

-- CreateTable
CREATE TABLE "Customer_wallet_address" (
    "customer_wallet_address_id" SERIAL NOT NULL,
    "address" CHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "wallet_address_status_id" INTEGER,

    CONSTRAINT "Customer_wallet_address_pkey" PRIMARY KEY ("customer_wallet_address_id")
);

-- CreateTable
CREATE TABLE "Order" (
    "order_id" SERIAL NOT NULL,
    "order_status_id" INTEGER NOT NULL,
    "customer_id" INTEGER NOT NULL,
    "external_ref" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_pkey" PRIMARY KEY ("order_id")
);

-- CreateTable
CREATE TABLE "Order_status" (
    "order_status_id" SERIAL NOT NULL,
    "status" CHAR(50),
    "description" CHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Order_status_pkey" PRIMARY KEY ("order_status_id")
);

-- CreateTable
CREATE TABLE "Payment_attempt" (
    "payment_attempt_id" SERIAL NOT NULL,
    "payment_status_id" INTEGER,
    "payment_method_id" INTEGER,
    "order_id" INTEGER,
    "network_fee" DECIMAL,
    "layer_1_address" TEXT,
    "invoice_address" TEXT,
    "amount_sats" DECIMAL,
    "metadata" TEXT,
    "blocks_confirmed" INTEGER,
    "customer_wallet_address_id" INTEGER,
    "payment_preference_id" INTEGER,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "confirmed_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_attempt_pkey" PRIMARY KEY ("payment_attempt_id")
);

-- CreateTable
CREATE TABLE "Payment_method" (
    "payment_method_id" SERIAL NOT NULL,
    "name" CHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_method_pkey" PRIMARY KEY ("payment_method_id")
);

-- CreateTable
CREATE TABLE "Payment_preference" (
    "payment_preference_id" SERIAL NOT NULL,
    "invoice_life_time" INTEGER NOT NULL,
    "invoice_max_attempt" INTEGER NOT NULL,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_preference_pkey" PRIMARY KEY ("payment_preference_id")
);

-- CreateTable
CREATE TABLE "Payment_request" (
    "payment_request_id" SERIAL NOT NULL,
    "order_id" INTEGER NOT NULL,
    "payment_status_id" INTEGER NOT NULL,
    "succeeded_payment_id" INTEGER,
    "amount_fiat" DECIMAL,
    "local_currency_id" INTEGER,
    "user_transaction_ref" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_request_pkey" PRIMARY KEY ("payment_request_id")
);

-- CreateTable
CREATE TABLE "Payment_status" (
    "payment_status_id" SERIAL NOT NULL,
    "status" CHAR(50),
    "description" TEXT,
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_status_pkey" PRIMARY KEY ("payment_status_id")
);

-- CreateTable
CREATE TABLE "Wallet_address_status" (
    "wallet_address_status_id" SERIAL NOT NULL,
    "status" VARCHAR(50),
    "description" VARCHAR(100),
    "created_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Wallet_address_status_pkey" PRIMARY KEY ("wallet_address_status_id")
);

-- AddForeignKey
ALTER TABLE "Customer" ADD CONSTRAINT "fk_customer_customer_wallet_addrees" FOREIGN KEY ("customer_wallet_address_id") REFERENCES "Customer_wallet_address"("customer_wallet_address_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Customer_wallet_address" ADD CONSTRAINT "fk_customer_wallet_address" FOREIGN KEY ("wallet_address_status_id") REFERENCES "Wallet_address_status"("wallet_address_status_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "fk_order_customer" FOREIGN KEY ("customer_id") REFERENCES "Customer"("customer_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Order" ADD CONSTRAINT "fk_order_order_status" FOREIGN KEY ("order_status_id") REFERENCES "Order_status"("order_status_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Payment_attempt" ADD CONSTRAINT "fk_payment_attempt_payment_satus" FOREIGN KEY ("payment_status_id") REFERENCES "Payment_status"("payment_status_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Payment_attempt" ADD CONSTRAINT "fk_payment_attemp_order" FOREIGN KEY ("order_id") REFERENCES "Order"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Payment_attempt" ADD CONSTRAINT "fk_payment_attemp_payment_preference" FOREIGN KEY ("payment_preference_id") REFERENCES "Payment_preference"("payment_preference_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Payment_attempt" ADD CONSTRAINT "fk_payment_attempt_customer_wallet" FOREIGN KEY ("customer_wallet_address_id") REFERENCES "Customer_wallet_address"("customer_wallet_address_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Payment_attempt" ADD CONSTRAINT "fk_payment_attempt_payment_method" FOREIGN KEY ("payment_method_id") REFERENCES "Payment_method"("payment_method_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Payment_request" ADD CONSTRAINT "fk_payment_request_currency" FOREIGN KEY ("local_currency_id") REFERENCES "Currency"("currency_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Payment_request" ADD CONSTRAINT "fk_payment_request_payment_attemp" FOREIGN KEY ("succeeded_payment_id") REFERENCES "Payment_attempt"("payment_attempt_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Payment_request" ADD CONSTRAINT "fk_payment_request_payment_satus" FOREIGN KEY ("payment_status_id") REFERENCES "Payment_status"("payment_status_id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "Payment_request" ADD CONSTRAINT "fk_paymnet_request_order" FOREIGN KEY ("order_id") REFERENCES "Order"("order_id") ON DELETE CASCADE ON UPDATE NO ACTION;
