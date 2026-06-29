feat:
- add winner trophy over bar for 'W' results (helps see wins of 250s at a glance)
- add in ITF events and more than top 100 players
- add disclaimer that total points may vary from the distribution display (best 18 rule, point drops, withdrawals)
- scale bar chart to max points earned at an event in the last 12 months (helps see distribution of points earned by lesser ranked players)
- change bar size to match date range??? majors would be double wide
    - this could also serve as a visual for business of schedule?
- add city name to result hover card: Tera Wortmann Open is confusing, people know it as 'Halle' (frick these sponsors and their confusing names)
    - tournament-detail-by-year api?
- add WTA and ATP logos to home page cards

big features:
- add columns for points, live points, 
- hypothetical upcoming/current event column
    - col1: will contain round reached subtle dropdown
    - col2: and points for selected round
    - there will by default one instance of this column for the biggest current (or upcoming in the next week) event
    - pre-tournament: round each player gets to will be at round 1 based on seeding.
        - if player not in draw (e.g. injury) then they will be auto populated with n/a for round reached and 0 points
    - during tournament: round each player gets will auto populate based on live tournament results.

- live points
    - ideally we replace this with the hypothetical col but live can contain multiple tournaments
    - still live points can be so much clearer than most current ranking websites
    - rank, name, points, current tournament?, live points, 
    - live points, this week points, defending points (both hover to show tournament/round/points)


fixes:
- style home page
- hover card for each tournament bar needs a UI on mobile
    - idea: hold down, can move across bars will moving
    - idea: selecting row opens details below
- rounded bottom border between players
