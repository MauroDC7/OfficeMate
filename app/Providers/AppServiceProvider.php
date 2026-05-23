<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Http\Client\PendingRequest;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Event;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use SocialiteProviders\Google\Provider as GoogleProvider;
use SocialiteProviders\Manager\SocialiteWasCalled;

class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        //
    }

    public function boot(): void
    {
        $this->configureDefaults();
        $this->configureHttpMacros();
        $this->configureSocialiteProviders();
    }

    protected function configureSocialiteProviders(): void
    {
        Event::listen(function (SocialiteWasCalled $event): void {
            $event->extendSocialite('google', GoogleProvider::class);
        });
    }

    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            app()->isProduction(),
        );

        Password::defaults(function (): Password {
            $rule = Password::min(10)
                ->numbers()
                ->symbols()
                ->rules('regex:/[A-Z]/');

            if (app()->isProduction()) {
                $rule->uncompromised();
            }

            return $rule;
        });
    }

    protected function configureHttpMacros(): void
    {
        Http::macro('openai', function (): PendingRequest {
            $request = Http::baseUrl('https://api.openai.com/v1')
                ->timeout(30)
                ->connectTimeout(5)
                ->retry(2, 200, throw: false)
                ->acceptJson();

            $key = config('services.openai.key');

            if (is_string($key) && $key !== '') {
                $request = $request->withToken($key);
            }

            return $request;
        });
    }
}
