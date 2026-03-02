# Execution Rules

## Never ask for execution approach
After completing a plan, proceed directly with execution using the best approach for the current session. Never ask which execution method to use — just pick the right one and go. The user prefers autonomous execution without intervention.

## Default execution approach
- If tasks are independent and parallelizable, use subagent-driven development in the current session.
- If tasks are strictly sequential with tight coupling, execute them directly.
- Reserve "parallel session" suggestions for cases where the work genuinely cannot fit in the current context window.
