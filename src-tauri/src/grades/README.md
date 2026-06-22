# Grades History Module

This module queries and parses the overall grade history, cumulative course grades, credits completion status, and grade distribution charts for the student.

## File Structure

- `types.rs`: Contains definitions for student academic profiles, individual course letter grades, curriculum categories (e.g. Program Core, Electives), CGPA totals, and the distribution breakdown of grade types (S, A, B, C, D, E, F, N).
- `parser.rs`: Scrapes and parses the VTOP academic history table nodes to compile structured data.
- `commands/`:
  - `get_history.rs`: Main command to load and parse the grade history log sheets.
- `mod.rs`: Exports types, parsers, and command submodules.

## Exposed Tauri Commands

All commands are serialized with `camelCase` naming format for seamless JSON consumption on the TypeScript frontend.

### 1. `grades_get_history`
- **Rust Function**: `grades_get_history`
- **Description**: Fetches the student's complete academic history including grades for all completed courses, credit completion progress, and overall statistics.
- **Return Type**: `GradesResponse`
  - `success`: `bool`
  - `data`: `Option<StudentHistoryData>`
  - `error`: `Option<String>`

## Data Models

### `StudentHistoryData`
- `profile`: `StudentProfile` (Reg No, Name, Program, Year, School)
- `grades`: `Vec<CourseGrade>` (Chronological course results, examination sessions, and letter grades)
- `curriculum`: `CurriculumProgress` (Required vs earned credits in each specific domain of the curriculum)
- `cgpa`: `CGPADetails` (Earned CGPA and grade letter distribution counts)
