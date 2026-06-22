# Timetable & Slot Schedule Module

This module parses the student's registered course timetable from VTOP, and maps slot codes to weekly calendar grids with absolute start/end times.

## File Structure

- `types.rs`: Structs defining course details, lecture/tutorial/practical credit breakdowns, faculty records, and day-by-day weekly schedules.
- `parser.rs`: HTML parser containing scraping selectors to query and list courses, slots, venues, and instructor assignments.
- `formatter.rs`: Core mapping engine that translates complex VTOP slot strings (e.g. `A1+TA1`, `L1+L2`) into absolute calendar blocks, specifying start/end hours for each day of the week.
- `commands/`:
  - `get_courses.rs`: Command returning a list of registered course structures.
  - `get_weekly.rs`: Command mapping slots to format a weekly calendar grid.
- `mod.rs`: Exports types, parsers, and command submodules.

## Exposed Tauri Commands

All commands are serialized with `camelCase` naming format for seamless JSON consumption on the TypeScript frontend.

### 1. `timetable_get_courses`
- **Rust Function**: `timetable_get_courses`
- **Description**: Returns all registered course entries parsed from the timetable page.
- **Return Type**: `TimetableResponse`
  - `success`: `bool`
  - `data`: `Option<Vec<TimetableCourse>>`
  - `error`: `Option<String>`

### 2. `timetable_get_weekly`
- **Rust Function**: `timetable_get_weekly`
- **Description**: Parses slots for all registered courses and returns them structured inside a weekly timetable calendar (Mon-Sun) with absolute times.
- **Return Type**: `WeeklyScheduleResponse`
  - `success`: `bool`
  - `data`: `Option<WeeklySchedule>`
  - `error`: `Option<String>`

## Data Models

### `TimetableCourse`
- `sl_no`: `i32`
- `class_group`: `String` (Class division group e.g. "Morning")
- `code`: `String` (e.g. "MAT2001")
- `title`: `String` (Course title)
- `course_type`: `String` (e.g. "Theory" or "Lab")
- `credits`: `TimetableCourseCredits` (Lecture, tutorial, practical, project, and total counts)
- `category`: `String` (Domain categorization e.g., "Program Core")
- `registration_option`: `String`
- `class_id`: `String` (Class registration code)
- `slot`: `String` (Slot string e.g. "B2+TB2")
- `venue`: `String` (Cabin/Lab location room e.g., "SJT401")
- `faculty`: `TimetableFaculty` (Instructor name and department)
- `registration_date`: `String`
- `status`: `String` (Overall registration status)

### `WeeklySchedule`
- Contains vectors of `ScheduleEntry` maps representing the courses allocated to each day (`monday` to `sunday`).

### `ScheduleEntry`
- `day`: `String`
- `start_time`: `String` (e.g. "09:00")
- `end_time`: `String` (e.g. "09:50")
- `course_code`: `String`
- `course_title`: `String`
- `course_type`: `String`
- `slot`: `String`
- `venue`: `String`
- `faculty`: `String`
