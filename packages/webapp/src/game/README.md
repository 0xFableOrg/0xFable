# Game Directory

This directory holds pure game logic, devoid of any store, UI or networking concern.

It is not the only place that game logic is present, but whenever there is a solid chunk of logic
that can be extracted and avoid being tangled with the rest of the code, we should extract it
and place it in this directory.