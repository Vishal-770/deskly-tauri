# Content & Academic Summary Module

This module queries and parses general academic summary tables such as semester-wide course listings, general attendance summaries, and overall CGPA scores from the VTOP system.

## File Structure

- `types.rs`: Struct definitions representing Course Attendance, Semester Attendance lists, and CGPA metrics.
- `parser.rs`: HTML parser utilizing scrapers to extract course lists and CGPA info from page fragments.
- `commands/`:
  - `get_content_page.rs`: Returns general course list summaries.
  - `get_cgpa_page.rs`: Queries student CGPA achievements, credits required, earned credits, and non-graded core tallies.
- `mod.rs`: Exports types, parsers, and command submodules.

## Exposed Tauri Commands

All commands are serialized with `camelCase` naming format for seamless JSON consumption on the TypeScript frontend.

### 1. `get_content_page`
- **Rust Function**: `get_content_page`
- **Description**: Loads the main landing content of VTOP, parsing the active semester and returning course overview lists.
- **Return Type**: `ContentResponse`
  - `success`: `bool`
  - `courses`: `Option<Vec<CourseAttendance>>`
  - `semester`: `Option<String>`
  - `error`: `Option<String>`

### 2. `get_cgpa_page`
- **Rust Function**: `get_cgpa_page`
- **Description**: Loads and parses the student's credit completion summary and CGPA details.
- **Return Type**: `CGPAResponse`
  - `success`: `bool`
  - `cgpa_data`: `Option<CGPAData>`
  - `error`: `Option<String>`

## Data Models

### `CourseAttendance`
- `index`: `usize` (Row index)
- `code`: `String` (Course code e.g. "CSE1001")
- `name`: `String` (Course title)
- `type`: `String` (e.g. "Theory" or "Lab")
- `attendance`: `f64` (Percentage of attendance)
- `remark`: `String` (Remarks or comments)

### `CGPAData`
- `total_credits_required`: `f64` (Total credits needed to complete degree program)
- `earned_credits`: `f64` (Completed/earned credits so far)
- `current_cgpa`: `f64` (Current CGPA e.g. `9.20`)
- `non_graded_core`: `f64` (Earned credits in non-graded core curriculum)
