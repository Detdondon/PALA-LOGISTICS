# Shared calendar cards v286

The four activity types (orders, shifts, workshop jobs and damage reports) use `pala-calendar-cards.js` and `pala-calendar-cards.css` on `.view-list` and `.calendar-detail-list` only. Each card uses a common header, metadata area, body and action footer based on the order layout.

The adapter moves the existing DOM nodes rather than rebuilding their content or callbacks. Record IDs, status selection, staffing shortcuts, sign-up/off, references, notes, photos, edit/delete and completion actions remain intact. Original border colours and keyboard/card handlers remain attached. Non-calendar detail views and the shared editor system are unchanged. Damage filtering remains restricted to Systue.

The existing isolated preview builder loads `tests/calendar-card-fixture.js`. Use **Test kalenderkort** at 390, 768 and 1440 px. It checks eight state/type combinations on both list surfaces (16 cards per width), comparing original text nodes and control identity/value/handlers, checking common structure, footer placement and horizontal overflow. Open and completed order/workshop/damage records and past/future shifts are included. No production writes occur.

The existing 24 warehouse/realtime/runtime tests and calendar-controller regression suite also pass.
