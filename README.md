# Deskly

Deskly is an unofficial, open-source companion application designed for university students to access and track their academic progress, timetables, grades, and campus services in a clean, modern, and high-performance interface.

---

## What does Deskly do?

- **Academic Dashboard**: Fast overview of CGPA progress, earned credits, and pending curriculum feedback status.
- **Timetable & Attendance Counter**: Interactive weekly timetable with real-time class counters and skip/need calculations (calculates how many classes can be safely missed or attended to maintain 75%).
- **Attendance Session Logs**: Detailed date-by-date attendance session logs with status indicators for Present, Absent, and On Duty (OD).
- **Marks & Grade History**: Course-by-course breakdown of internal assessment marks, historical semester grades, and GPA tracking trends.
- **Academic Calendar**: Month-by-month interactive calendar view of academic events, holidays, and instructional days.
- **Exam Schedule & Calendar Export**: Comprehensive exam schedule group listing with seat numbers, reporting times, venues, and 1-click .ics calendar file export.
- **Payment Receipts**: Transaction history and download receipts for tuition and hostel payments.
- **Campus Directory & Contact Info**: Direct contact directory for faculty, HODs, Deans, and department offices.
- **Offline-First SWR Caching**: All fetched data is securely cached locally for instant 0ms screen loading with automatic fetch timeouts and silent fallbacks when offline.

---

## Official Policies, Privacy & Terms of Use

> [!WARNING]
> **Deskly is NOT an official app.** 
> This application is a completely unofficial, community-driven client. It is not affiliated, endorsed, sponsored, authorized, or in any way associated with the Vellore Institute of Technology (VIT) or any of its subsidiaries or affiliates.

By using this software, you agree to the following terms:

### 1. Unofficial Companion App Status
Deskly acts solely as a wrapper/client interface that interacts directly with public endpoints of the university's student portal (VTOP) for user convenience, speed, and usability. It does not modify university records or bypass portal security/authentication.

### 2. Privacy & Data Security
- **Local Keyring Storage Only**: Deskly is built with privacy in mind. Your login credentials (registration number and password) and fetched academic records are stored encrypted locally on your device using native operating system keyring APIs (Windows Credential Manager / macOS Keychain / Linux Secret Service via Tauri).
- **No Third-Party Transmission**: Absolutely no credentials, session tokens, or personal academic information are ever transmitted to, stored on, or shared with any external servers, third-party databases, or creator-owned infrastructure.
- **No Data Harvesting or Telemetry**: Deskly does not contain tracking scripts, telemetry, analytics, advertising networks, or user profiling.

### 3. Compliance with University Policies
- Users are solely responsible for ensuring that their use of Deskly complies with university IT policies, terms of service of the student portal, and local guidelines.
- The developers of Deskly are not responsible for any disciplinary actions, account lockouts, or administrative issues resulting from the use of this client.

### 4. Limitation of Liability & Accuracy
- **No Warranty**: The software is provided "AS IS", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.
- **Liability Exclusion**: In no event shall the authors, developers, or copyright holders be liable for any claim, damages, or other liability (including but not limited to lost data, inaccurate academic metrics, missed exams, or software errors), whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use of the software.
- **Academic Accuracy**: Academic statistics, CGPA progress, attendance skip/need values, and exam timings are computed for convenience. Always verify official dates and requirements directly through the official university portal.

### 5. Intellectual Property
All product names, logos, brands, trademarks, and registered trademarks (such as "VTOP" or university names) referenced within this application are the property of their respective owners. Their use does not imply any affiliation with or endorsement by them.

---

## Community & Security Policies

- [Code of Conduct](CODE_OF_CONDUCT.md)
- [Contributing Guidelines](CONTRIBUTING.md)
- [Security Policy](SECURITY.md)
- [License](LICENSE)
