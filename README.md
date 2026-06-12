# Deskly

Deskly is an unofficial, open-source desktop companion application designed for university students to access and track their academic data, timetables, grades, and campus services in a clean, modern, and high-performance interface.

---

## What does Deskly do?
- **Academic Dashboard**: Fast overview of CGPA progress and pending curriculum feedback.
- **Timetable & Attendance**: Interactive weekly class timetable with integrated attendance counters and track calculations (e.g. how many classes can be safely skipped or need to be attended to maintain 75%).
- **Marks & Grades**: Detailed course-by-course breakdown of internal assessment marks, grades history, and GPA tracking.
- **Campus Services**: Daily mess menus, laundry schedules, and university contact directories cached locally.
- **Offline First**: All fetched data is securely cached locally (SWR architecture) for instant, skeleton-loaded screen starts.

---

## ⚖️ Legal Disclaimer & Terms of Use

> [!WARNING]
> **Deskly is NOT an official app.** 
> This application is a completely unofficial, community-driven client. It is not affiliated, endorsed, sponsored, authorized, or in any way associated with the Vellore Institute of Technology (VIT) or any of its subsidiaries or affiliates.

By using this software, you agree to the following terms:

### 1. Unofficial Companion App Status
Deskly acts solely as a wrapper/client interface that interacts with public endpoints/APIs of the university's student portal (VTOP). It is built for convenience, speed, and usability. It does not modify university records or bypass portal security/authentication.

### 2. Privacy & Data Security
- **Local Storage Only**: Deskly is designed with privacy in mind. Your login credentials (registration number and password) and fetched academic records are stored locally on your device (using secure OS-level keychain/keyring APIs via Tauri).
- **No Third-Party Transmission**: Absolutely no credentials, session tokens, or personal academic information are ever transmitted to, stored on, or shared with any external servers, third-party databases, or creator-owned infrastructure.
- **No Data Harvesting**: The application does not contain tracking scripts, telemetry, analytics, or user profiling.

### 3. Compliance with University Policies
- Users are solely responsible for ensuring that their use of Deskly complies with university IT policies, terms of service of the student portal, and local guidelines.
- The developer of Deskly is not responsible for any disciplinary actions, account lockouts, or administrative issues resulting from the use of this client.

### 4. Limitation of Liability
- **No Warranty**: The software is provided "AS IS", without warranty of any kind, express or implied, including but not limited to the warranties of merchantability, fitness for a particular purpose, and non-infringement.
- **Liability Exclusion**: In no event shall the authors, developers, or copyright holders be liable for any claim, damages, or other liability (including but not limited to lost data, inaccurate academic metrics, missed exams, or software errors), whether in an action of contract, tort, or otherwise, arising from, out of, or in connection with the software or the use of the software.
- **Academic Accuracy**: Academic statistics, CGPA progress bar, attendance skip/need values, and exam timings are computed for convenience. Always verify official dates and requirements directly through the official university portal.

### 5. Intellectual Property
All product names, logos, brands, trademarks, and registered trademarks (such as "VTOP" or university names) referenced within this application are the property of their respective owners. Their use does not imply any affiliation with or endorsement by them.

---

## 🚀 Publishing a Release

We use GitHub Actions to automatically build, sign, and release Deskly.

### Steps to Release a New Version:
1. Update the version number consistently in:
   - `package.json`
   - `src-tauri/Cargo.toml`
   - `src-tauri/tauri.conf.json`
2. Commit and push the changes:
   ```bash
   git add -A
   git commit -m "chore: release vX.Y.Z"
   git push origin master
   ```
3. Tag and push the new version:
   ```bash
   git tag vX.Y.Z
   git push origin vX.Y.Z
   ```
