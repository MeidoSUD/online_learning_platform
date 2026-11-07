<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    public function up(): void
    {
        if (Schema::hasTable('support_ticket_replies')) {
            return;
        }

        Schema::create('support_ticket_replies', function (Blueprint $table) {
            $table->bigIncrements('id');
            $table->unsignedBigInteger('ticket_id');
            $table->unsignedBigInteger('sender_id');
            $table->text('message');
            $table->timestamp('created_at')->nullable();
            $table->index('ticket_id', 'support_ticket_replies_ticket_id_foreign');
            $table->index('sender_id', 'support_ticket_replies_sender_id_foreign');
            $table->foreign('sender_id', 'support_ticket_replies_sender_id_foreign')->references('id')->on('users');
            $table->foreign('ticket_id', 'support_ticket_replies_ticket_id_foreign')->references('id')->on('support_tickets');
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('support_ticket_replies');
    }
};
