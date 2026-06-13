# Sprint 1: Profession Tennis Rankings App for ATP and WTA

## User Stories
1. As a tennis fan, I want to see the current ATP and WTA rankings AND I quickly see the distribution of each players points across the last 12 months year so I can understand what points they have to defend soon vs which points they have just earned. 

## Initial Brainstorm
theme: use system dark/light mode for the app theme.
we already have picked a shadcn preset for the UI components.
should naturally look good on mobile and desktop, let's use as many shadcn components as possible to speed up development and ensure a good user experience across devices while minimizing dev work.

two pages: 
rankings/atp
rankings/wta
/ (home): will have a brief introduction to the app and links to the ATP and WTA rankings pages.

player ranking page:
each row is a player with their rank, country flag, name, current points,
BUT unique to this app, we will show a small bar chart.
    - x-axis: last 12 months (rolling)
    - y-axis: points earned, 0 to max points earned at an event in the last 12 months
    - each bar represents points earned at an event, with the bar height representing the points earned and the color representing the type of event (e.g., Grand Slam, 1000, 500, 250, etc.)
    - tooltip on hover over each bar to show event name, logo, date(range), and result (i.e. W, F, SF, QF, R16, R32, R64, etc), and points earned 


data structure needed for each player:
please refine this if needed
{
    "name": "Novak Djokovic",
    "country": "Serbia",
    "current_points": 12000,
    "points_distribution": [
        {
            "event_name": "Australian Open",
            "event_type": "Grand Slam",
            "event_logo": "https://example.com/australian_open_logo.png",
            "event_date_range": "2024-01-15 to 2024-01-28",
            "result": "W",
            "points_earned": 2000
        },
        {
            "event_name": "Indian Wells",
            "event_type": "1000",
            "event_logo": "https://example.com/indian_wells_logo.png",
            "event_date_range": "2024-03-10 to 2024-03-17",
            "result": "SF",
            "points_earned": 360
        },
    ]
}

just create toy data for top 10 players in ATP and WTA for now, we can expand later.