<?php

it('shows the privacy policy page', function (): void {
    $this->withoutVite();

    $this->get(route('privacy'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('privacy-policy')
            ->where('title', 'Privacybeleid')
            ->has('contentHtml')
            ->where('lastUpdated', '25 mei 2026'));
});
