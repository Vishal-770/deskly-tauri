# Deskly

> [!IMPORTANT]
> **This repository has moved.**
>
> Development now continues in the official Deskly organization:
>
> **https://github.com/deskly-app/deskly**
>
> Please update your bookmarks, open issues and pull requests there, and star the new repository to stay up to date.

Deskly is an unofficial, open-source companion application designed for university students to access and track their academic progress, timetables, grades, and campus services in a clean, modern, and high-performance interface.

---

## What does Deskly do?

* **Academic Dashboard**: Fast overview of CGPA progress, earned credits, and pending curriculum feedback status.
* **Timetable & Attendance Counter**: Interactive weekly timetable with real-time class counters and skip/need calculations (calculates how many classes can be safely missed or attended to maintain 75%).
* **Attendance Session Logs**: Detailed date-by-date attendance session logs with status indicators for Present, Absent, and On Duty (OD).
* **Marks & Grade History**: Course-by-course breakdown of internal assessment marks, historical semester grades, and GPA tracking trends.
* **Academic Calendar**: Month-by-month interactive calendar view of academic events, holidays, and instructional days.
* **Exam Schedule & Calendar Export**: Comprehensive exam schedule group listing with seat numbers, reporting times, venues, and 1-click `.ics` calendar file export.
* **Payment Receipts**: Transaction history and downloadable receipts for tuition and hostel payments.
* **Campus Directory & Contact Info**: Direct contact directory for faculty, HODs, Deans, and department offices.
* **Offline-First SWR Caching**: All fetched data is securely cached locally for instant screen loading with automatic fetch timeouts and silent fallbacks when offline.

---

## Official Policies, Privacy & Terms of Use

> [!WARNING]
> **Deskly is NOT an official app.**
>
> This application is a completely unofficial, community-driven client. It is not affiliated with, endorsed by, sponsored by, authorized by, or otherwise associated with the Vellore Institute of Technology (VIT) or any of its subsidiaries or affiliates.

By using this software, you agree to the following terms:

### 1. Unofficial Companion App Status

Deskly acts solely as a client interface that interacts directly with the university's student portal (VTOP) for user convenience, speed, and usability. It does not modify university records or bypass authentication or security mechanisms.

### 2. Privacy & Data Security

* **Local Keyring Storage Only**: Login credentials (registration number and password) and fetched academic records are stored encrypted on your device using native operating system keyring APIs (Windows Credential Manager, macOS Keychain, or Linux Secret Service via Tauri).
* **No Third-Party Transmission**: Credentials, session tokens, and personal academic information are never transmitted to, stored on, or shared with any external servers or creator-owned infrastructure.
* **No Telemetry or Tracking**: Deskly does not include analytics, telemetry, advertising, or user profiling.

### 3. Compliance with University Policies

* Users are solely responsible for ensuring their use of Deskly complies with university IT policies and the terms of use of the official student portal.
* The developers are not responsible for disciplinary actions, account restrictions, or administrative issues arising from the use of this software.

### 4. Limitation of Liability & Accuracy

* **No Warranty**: This software is provided **"AS IS"**, without warranty of any kind, express or implied.
* **Limitation of Liability**: The authors and contributors shall not be liable for any claim, damages, or losses arising from the use of this software.
* **Accuracy Notice**: Academic statistics, attendance calculations, CGPA progress, and exam schedules are provided for convenience only. Always verify important information through the official university portal.

### 5. Intellectual Property

All product names, logos, brands, trademarks, and registered trademarks (including "VTOP" and university names) remain the property of their respective owners. Their use within Deskly does not imply endorsement or affiliation.

---

## Community & Security Policies

* [Code of Conduct](CODE_OF_CONDUCT.md)
* [Contributing Guidelines](CONTRIBUTING.md)
* [Security Policy](SECURITY.md)
* [License](LICENSE)
