<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Allow card withdrawals: payouts.payment_method_id must accept NULL
     * when the payout is bound to payouts.card_id instead.
     */
    public function up(): void
    {
        // Drop FK first so MySQL allows the nullability change.
        DB::statement('ALTER TABLE `payouts` DROP FOREIGN KEY `payouts_payment_method_id_foreign`');
        DB::statement('ALTER TABLE `payouts` MODIFY `payment_method_id` BIGINT UNSIGNED NULL');
        DB::statement('ALTER TABLE `payouts` ADD CONSTRAINT `payouts_payment_method_id_foreign` FOREIGN KEY (`payment_method_id`) REFERENCES `user_payment_methods` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE');
    }

    public function down(): void
    {
        DB::statement('ALTER TABLE `payouts` DROP FOREIGN KEY `payouts_payment_method_id_foreign`');
        DB::statement('ALTER TABLE `payouts` MODIFY `payment_method_id` BIGINT UNSIGNED NOT NULL');
        DB::statement('ALTER TABLE `payouts` ADD CONSTRAINT `payouts_payment_method_id_foreign` FOREIGN KEY (`payment_method_id`) REFERENCES `user_payment_methods` (`id`) ON DELETE RESTRICT ON UPDATE CASCADE');
    }
};
