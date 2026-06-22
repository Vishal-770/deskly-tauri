# Student Marks Module

This module queries and parses course assessment marks (CAT tests, assignments, quizzes, labs, FAT exams) and corresponding class average distributions.

## File Structure

- `types.rs`: Structs representing individual course marks sheets, assessment rows, scores, and weightages.
- `parser.rs`: HTML parser containing scraping selectors to query and parse assessment tables.
- `commands/`:
  - `get_student_mark_view.rs`: Command loading the marks index and course evaluation lists.
- `mod.rs`: Exports types, parsers, and command submodules.

## Exposed Tauri Commands

All commands are serialized with `camelCase` naming format for seamless JSON consumption on the TypeScript frontend.

### 1. `marks_get_student_mark_view`
- **Rust Function**: `marks_get_student_mark_view`
- **Description**: Fetches all course assessments and marks details for the current active semester.
- **Return Type**: `MarksResponse`
  - `success`: `bool`
  - `data`: `Option<Vec<StudentMarkEntry>>`
  - `error`: `Option<String>`

## Data Models

### `StudentMarkEntry`
- `sl_no`: `i32`
- `class_number`: `String` (VTOP internal class registration code)
- `course_code`: `String`
- `course_title`: `String`
- `course_type`: `String` (e.g. "Theory" or "Lab")
- `course_system`: `String` (e.g. "CAL" or "Non-CAL")
- `faculty`: `String` (Instructor name)
- `slot`: `String` (e.g. "A1")
- `course_mode`: `String`
- `assessments`: `Vec<AssessmentMark>` (Specific assessment components breakdown)

### `AssessmentMark`
- `sl_no`: `i32`
- `mark_title`: `String` (e.g. "Continuous Assessment Test 1", "Assignment 1")
- `max_mark`: `f64` (Maximum possible score)
- `weightage_percent`: `f64` (Percentage share to the overall grade)
- `status`: `String` (Evaluation status)
- `scored_mark`: `f64` (Score received by student)
- `weightage_mark`: `f64` (Weighted score contribution)
- `class_average`: `String` (Mean class average score)
- `remark`: `String` (Teacher remarks/comments)
