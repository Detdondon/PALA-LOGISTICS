# PALA Editor v285

`pala-editor.js` and `pala-editor.css` provide the common presentation layer for existing editors. They retain original field nodes, IDs, selected values, event handlers and save/delete callbacks. No database schema or API contracts change.

## Shared contract

- Title and Close in the header; record actions in one footer. Delete (when already supported) on the left, Cancel and primary Save on the right. Creation does not add deletion.
- Basic information, relationships, date/time/quantity, people/resources, notes, advanced settings in that order. Order sections stay on one page.
- Two related fields per row above 600 px, one column on mobile. Uniform labels, help text, controls and inline validation errors.
- Every editor select with two or more options uses the same searchable component, including calendar colours. Original selects remain authoritative. Dynamic options, optgroups, disabled states, multiple selection, keyboard navigation, pointer selection and optional clearing are supported.
- Search text is presentation state and does not mark a form dirty. Actual selection dispatches the original input/change events.
- Resource Add/Remove actions remain beside their rows because they edit line items, not the whole record. Upload controls, bulk employee checkbox lists and PDF/export actions retain their functional semantics. Image-only previews are not record editors.
- New editor roots belong in ROOTS. Reuse native fields and the existing save/cancel actions; do not introduce separate dropdown or footer implementations.

## Verification

Run `python3 tests/build-editor-preview.py`, serve the printed file from the generated sibling `editor-preview` directory, and use its test toolbar. The fixture replaces Supabase with in-memory records and does not register the service worker. Never include the fixture scripts in production index.html.

The browser fixture covers 35 flows: own login-code form; two PDF dialogs; tent note; damage completion; create/edit order, tent, hardware, inventory, meeting, workshop job, damage, shift and employee; nested order shift; absence; create/edit category; warehouse bulk move; packing requirements; tent parts; tent photo/document; damage photo; app address; special hardware.

Checked at 390, 768 and 1440 px: preserved field identity/value/callback, shared header/footer, shared dropdowns, removed legacy swatches and no editor horizontal overflow. Component checks cover live filtering, accents, keyboard selection/focus, pointer selection, clearing, dynamically added options, disabled state, multiple selection, Danish field errors, blocked invalid saves, a single original save callback, original cancellation and unchanged tent-note RPC arguments.

Existing warehouse-placement, realtime-lifecycle, runtime-performance and calendar-controller regression tests are also run. Tests use isolated data; they do not save or delete production records.
