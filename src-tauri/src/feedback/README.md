# Feedback Status Module

This module manages checking the completion/submission status of VTOP course & instruction feedback forms.

## File Structure

- `types.rs`: Structs defining VTOP feedback forms (mid-semester and term-end semester status).
- `parser.rs`: HTML parser containing scraping selectors to query feedback table nodes.
- `commands/`:
  - `get_status.rs`: Command checking whether student feedback lists have been submitted or are pending.
- `mod.rs`: Exports types, parsers, and command submodules.

## Exposed Tauri Commands

All commands are serialized with `camelCase` naming format for seamless JSON consumption on the TypeScript frontend.

### 1. `feedback_get_status`
- **Rust Function**: `feedback_get_status`
- **Description**: Returns submission states (Submitted/Pending) for the current student's feedback forms.
- **Return Type**: `FeedbackResponse`
  - `success`: `bool`
  - `data`: `Option<Vec<FeedbackStatus>>`
  - `error`: `Option<String>`

## Data Models

### `FeedbackStatus`
- `type`: `String` (Feedback form category e.g., "Theory Curriculum Feedback")
- `midSemester`: `String` (Mid-term status e.g., "Given" / "Not Given")
- `teeSemester`: `String` (Term-end status e.g., "Given" / "Not Given")
