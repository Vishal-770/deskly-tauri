# Student Profile Module

This module queries and parses the student's personal details, proctor (advisor) profile information, and hostel/mess housing allocations.

## File Structure

- `types.rs`: Structs representing detailed categories for Student, Proctor, and Hostel information, alongside profile API responses.
- `parser.rs`: HTML parser containing scraping selectors to query and parse profile page widgets.
- `commands/`:
  - `get_student_profile.rs`: Command loading the profile layout page.
- `mod.rs`: Exports types, parsers, and command submodules.

## Exposed Tauri Commands

All commands are serialized with `camelCase` naming format for seamless JSON consumption on the TypeScript frontend.

### 1. `profile_get_student_profile`
- **Rust Function**: `profile_get_student_profile`
- **Description**: Fetches all information associated with the current user's profile, including their advisor (proctor) and residential hostel allocations.
- **Return Type**: `ProfileResponse`
  - `success`: `bool`
  - `data`: `Option<ProfileData>`
  - `error`: `Option<String>`

## Data Models

### `StudentDetails`
- `name`: `String` (Full student name)
- `register_number`: `String` (Student registration number)
- `application_number`: `String` (Original application identification number)
- `program`: `String` (Registered academic degree program)
- `dob`: `String` (Date of birth)
- `gender`: `String`
- `mobile`: `String` (Phone contact)
- `vit_email`: `String` (Official institutional email address)
- `personal_email`: `String` (Fallback personal email address)
- `photo_url`: `String` (Base64 data URL representing student's ID photo)

### `ProctorDetails`
- `faculty_id`: `String` (Proctor/Advisor faculty identification code)
- `name`: `String` (Proctor name)
- `designation`: `String` (Academic rank e.g. Assistant Professor)
- `school`: `String` (School division e.g. SCOPE)
- `cabin`: `String` (Cabin office code)
- `mobile`: `String` (Advisor mobile phone)
- `email`: `String` (Advisor official email)
- `photo_url`: `String` (Base64 data URL representing proctor's photo)

### `HostelDetails`
- `block_name`: `String` (Hostel block e.g., "Block Q")
- `room_number`: `String` (Assigned room code)
- `bed_type`: `String` (Beds count/type e.g. "2 Bed AC")
- `mess_type`: `String` (Selected dining plan e.g., "Special Mess")
