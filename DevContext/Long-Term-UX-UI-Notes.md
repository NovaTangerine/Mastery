# Long-Term UX/UI Notes

## Session View Mobile Navigation
- **Current Issue:** The floating pill toggle (Sessions / Notes / Trackers) at the bottom of the screen is currently fighting for attention with the primary action (the FAB) and the content feed itself.
- **Proposed Solution:** Move the toggle to live below or at the bottom of the session details container (the header card) at the top of the screen. This will allow the main feed and the primary action button to draw the user's attention without visual competition at the bottom of the screen.

## Core Design Principle: The Law of Proximity & Visual Hierarchy

The feedback above points to a fundamental tension in **Visual Hierarchy** and the **Law of Proximity** (from Gestalt psychology).

### The Law of Proximity
The Law of Proximity states that objects that are near, or proximate to each other, tend to be grouped together. 
- **Application:** The navigation toggle controls *what* feed is being displayed. Therefore, it logically belongs near the top of the feed (or attached to the header context), rather than floating disconnected at the bottom of the screen. By moving it up, we group the "context/controls" together, separating them from the "content/actions".

### Visual Hierarchy & The "F-Pattern" / "Z-Pattern"
Users naturally scan screens from top to bottom. 
- **Application:** 
  1. **Top:** Context & Navigation (Session Details, What am I looking at? How do I change views?)
  2. **Middle:** Content (The Notes/Trackers feed)
  3. **Bottom/Floating:** Primary Action (The FAB to create a new note)

When we place heavy navigation at the bottom alongside a primary action button (FAB), we create competing focal points. By moving the view-toggle to the top (anchored to the session details), we establish a clear, linear hierarchy: *Context -> Content -> Action*.

### Actionable Takeaway for the Broader App
**"Keep controls close to what they control, and isolate primary actions."**
Whenever we introduce a new UI element, we should ask:
1. Does this element change the context/view? (If yes, it belongs at the top/near the header).
2. Is this the primary action the user should take? (If yes, it gets isolated prominence, like a FAB or a high-contrast button).
3. Are we forcing the user's eye to bounce between the top and bottom of the screen to understand what they are looking at?
