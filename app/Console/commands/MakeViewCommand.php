<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\File;

class MakeViewCommand extends Command
{
    protected $signature = 'make:view {name}';
    protected $description = 'Create a new Blade view file';

    public function handle()
    {
        $name = str_replace('.', '/', $this->argument('name'));
        $path = resource_path("views/{$name}.blade.php");

        if (File::exists($path)) {
            $this->error('View already exists!');
            return;
        }

        File::ensureDirectoryExists(dirname($path));
        File::put($path, "<!-- View: {$name} -->\n");

        $this->info("View created: resources/views/{$name}.blade.php");
    }
}
