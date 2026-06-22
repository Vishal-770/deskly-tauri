# Attendance Module

This module handles fetching, parsing, and exposure of student attendance data (current semester overview and class-by-class detail logs) from the VTOP portal.

## File Structure

- `types.rs`: Contains the data models representing Semesters, Faculty details, Attendance Records, and API responses.
- `parser.rs`: HTML parser containing scraping selectors to transform raw VTOP table elements into typed structures.
- `commands/`:
  - `get_semesters.rs`: Command to query semesters list available for attendance search.
  - `get_current.rs`: Fetches the current semester attendance list overview.
  - `get_detail.rs`: Fetches detail class-by-class log sheets for specific courses.
  - `mod.rs`: Exports command submodules.
- `mod.rs`: Exports types, parsers, and command modules.

## Exposed Tauri Commands

All commands are serialized with `camelCase` naming format for seamless JSON consumption on the TypeScript frontend.

### 1. `attendance_get_semesters`
- **Rust Function**: `attendance_get_semesters`
- **Description**: Returns all available semesters that can be selected for querying attendance records.
- **Return Type**: `SemestersResponse`
  - `success`: `bool`
  - `semesters`: `Option<Vec<Semester>>`
  - `error`: `Option<String>`

### 2. `attendance_get_current`
- **Rust Function**: `attendance_get_current`
- **Description**: Fetches the attendance summary record sheet for the student. If a semester ID is specified, it targets that specific semester, otherwise it queries the current/active semester.
- **Parameters**:
  - `semester_id`: `Option<String>`
- **Return Type**: `AttendanceResponse`
  - `success`: `bool`
  - `data`: `Option<Vec<AttendanceRecord>>`
  - `semester_id`: `Option<String>`
  - `error`: `Option<String>`

### 3. `attendance_get_detail`
- **Rust Function**: `attendance_get_detail`
- **Description**: Fetches the row-by-row detail logs of a specific course (attended, late, or missed sessions).
- **Parameters**:
  - `class_id`: `String`
- **Return Type**: `AttendanceDetailResponse`
  - `success`: `bool`
  - `data`: `Option<Vec<AttendanceDetailRecord>>`
  - `error`: `Option<String>`

## Data Models

### `Semester`
- `id`: `String` (VTOP semester ID)
- `name`: `String` (Human-readable term name)

### `Faculty`
- `id`: `String` (Unique faculty identification code)
- `name`: `String` (Name of the instructor)
- `school`: `String` (Department/School name)

### `AttendanceRecord`
- `sl_no`: `i32`
- `class_id`: `String` (Unique ID referenced to query detail log sheets)
- `course_code`: `String`
- `course_title`: `String`
- `course_type`: `String` (e.g., "Theory" or "Lab")
- `slot`: `String` (e.g., "A1+TA1")
- `faculty`: `Faculty`
- `attendance_type`: `String`
- `registration_date`: `String`
- `attendance_date`: `String` (Start date to end date range)
- `attended_classes`: `i32`
- `total_classes`: `i32`
- `attendance_percentage`: `f64` (Percentage of attended sessions)
- `status`: `String` (Overall criteria status)

### `AttendanceDetailRecord`
- `serial_no`: `i32`
- `date`: `String` (Date of class session)
- `slot`: `String` (Slot code)
- `day_and_time`: `String` (Day and absolute time duration)
- `status`: `String` (Status code e.g. "P" for Present, "A" for Absent)
