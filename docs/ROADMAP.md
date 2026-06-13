# Pro Tennis Statistics Roadmap

There are various tennis statistics and visualizations that I want but do not exist in any of the current tennis apps and websites.

# Features:

## (Rankings) ATP and WTA Rankings with Distribution Bar Chart
each row is a player with their rank, country flag, name, current points as usual...
BUT unique to this app, we will show a small bar chart.
    - x-axis: last 12 months (rolling)
    - y-axis: points earned, 0 to max points earned at an event in the last 12 months
    - each bar represents points earned at an event, with the bar height representing the points earned and the color representing the type of event (e.g., Grand Slam, 1000, 500, 250, etc.)
    - tooltip on hover over each bar to show event name, logo, date(range), and result (i.e. W, F, SF, QF, R16, R32, R64, etc), and points earned 

## (Match) Minimum Points to Win for each player over the course of the match
- inspired by this animation: https://www.instagram.com/reel/DKuCgtOAdTK/?utm_source=ig_web_copy_link&igsh=NTc4MTIwNjQ2YQ==
    - except we will show min point to win over the x-axis instead of an animation.

## (Match) Point stats
- point outcome in Sankey Diagram
    - first serve in -> win
    - first serve in -> lose
    - first serve out -> second serve in -> win
    - first serve out -> second serve in -> lose
- point outcome in pie charts
- probability matrix of winning point based on point score (e.g., 0-15, 15-30, etc)
