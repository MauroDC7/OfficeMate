<?php

it('shows the about TimeTraq page', function (): void {
    $this->withoutVite();

    $this->get(route('about'))
        ->assertOk()
        ->assertInertia(fn ($page) => $page
            ->component('about-timetraq')
            ->where('title', 'Over TimeTraq')
            ->has('contentHtml'));
});
