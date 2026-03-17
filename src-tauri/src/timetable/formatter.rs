use std::collections::HashMap;
use super::types::{TimetableCourse, WeeklySchedule, ScheduleEntry};

struct TimeRange {
    start: &'static str,
    end: &'static str,
}

const THEORY_TIMES: [TimeRange; 11] = [
    TimeRange { start: "08:00 AM", end: "08:50 AM" }, // 0
    TimeRange { start: "08:55 AM", end: "09:45 AM" }, // 1
    TimeRange { start: "09:50 AM", end: "10:40 AM" }, // 2
    TimeRange { start: "10:45 AM", end: "11:35 AM" }, // 3
    TimeRange { start: "11:40 AM", end: "12:30 PM" }, // 4
    TimeRange { start: "02:00 PM", end: "02:50 PM" }, // 5
    TimeRange { start: "02:55 PM", end: "03:45 PM" }, // 6
    TimeRange { start: "03:50 PM", end: "04:40 PM" }, // 7
    TimeRange { start: "04:45 PM", end: "05:35 PM" }, // 8
    TimeRange { start: "05:40 PM", end: "06:30 PM" }, // 9
    TimeRange { start: "06:35 PM", end: "07:25 PM" }, // 10
];

const LAB_TIMES: [TimeRange; 12] = [
    TimeRange { start: "08:00 AM", end: "08:50 AM" }, // 0
    TimeRange { start: "08:50 AM", end: "09:40 AM" }, // 1
    TimeRange { start: "09:45 AM", end: "10:35 AM" }, // 2
    TimeRange { start: "11:00 AM", end: "11:50 AM" }, // 3
    TimeRange { start: "11:50 AM", end: "12:40 PM" }, // 4
    TimeRange { start: "12:40 PM", end: "01:30 PM" }, // 5
    TimeRange { start: "02:00 PM", end: "02:50 PM" }, // 6
    TimeRange { start: "02:50 PM", end: "03:40 PM" }, // 7
    TimeRange { start: "03:50 PM", end: "04:40 PM" }, // 8
    TimeRange { start: "04:40 PM", end: "05:30 PM" }, // 9
    TimeRange { start: "05:40 PM", end: "06:30 PM" }, // 10
    TimeRange { start: "06:30 PM", end: "07:20 PM" }, // 11
];

fn get_theory_slot_map() -> HashMap<&'static str, Vec<(usize, usize)>> {
    let mut m = HashMap::new();
    // Monday: 0, Tuesday: 1, ...
    m.insert("A1", vec![(0, 0), (2, 1)]);
    m.insert("F1", vec![(0, 1), (2, 2)]);
    m.insert("D1", vec![(0, 2), (3, 0)]);
    m.insert("TB1", vec![(0, 3)]);
    m.insert("TG1", vec![(0, 4)]);

    m.insert("B1", vec![(1, 0), (3, 1)]);
    m.insert("G1", vec![(1, 1), (3, 2)]);
    m.insert("E1", vec![(1, 2), (4, 0)]);
    m.insert("TC1", vec![(1, 3)]);
    m.insert("TAA1", vec![(1, 4)]);

    m.insert("C1", vec![(2, 0), (4, 1)]);
    m.insert("V1", vec![(2, 3)]);
    m.insert("V2", vec![(2, 4)]);

    m.insert("TE1", vec![(3, 3)]);
    m.insert("TCC1", vec![(3, 4)]);

    m.insert("TA1", vec![(4, 2)]);
    m.insert("TF1", vec![(4, 3)]);
    m.insert("TD1", vec![(4, 4)]);

    m.insert("A2", vec![(0, 5), (2, 6)]);
    m.insert("F2", vec![(0, 6), (2, 7)]);
    m.insert("D2", vec![(0, 7), (3, 5)]);
    m.insert("TB2", vec![(0, 8)]);
    m.insert("TG2", vec![(0, 9)]);

    m.insert("B2", vec![(1, 5), (3, 6)]);
    m.insert("G2", vec![(1, 6), (3, 7)]);
    m.insert("E2", vec![(1, 7), (4, 5)]);
    m.insert("TC2", vec![(1, 8)]);
    m.insert("TAA2", vec![(1, 9)]);

    m.insert("C2", vec![(2, 5), (4, 6)]);
    m.insert("TD2", vec![(2, 8)]);
    m.insert("TBB2", vec![(2, 9)]);

    m.insert("TE2", vec![(3, 8)]);
    m.insert("TCC2", vec![(3, 9)]);

    m.insert("TA2", vec![(4, 7)]);
    m.insert("TF2", vec![(4, 8)]);
    m.insert("TDD2", vec![(4, 9)]);
    m
}

const DAYS: [&str; 7] = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

pub fn generate_weekly_schedule(courses: &[TimetableCourse]) -> WeeklySchedule {
    let mut schedule = WeeklySchedule::default();
    let theory_map = get_theory_slot_map();

    for course in courses {
        if course.slot.is_empty() || course.slot == "NIL" {
            continue;
        }

        let sub_slots: Vec<&str> = course.slot.split('+').collect();
        for slot in sub_slots {
            let slot = slot.trim();
            let is_lab = slot.starts_with('L') && slot[1..].chars().all(|c| c.is_digit(10));

            if is_lab {
                if let Ok(lab_num) = slot[1..].parse::<usize>() {
                    let mut day_index = None;
                    let mut time_index = None;

                    if lab_num >= 1 && lab_num <= 30 {
                        day_index = Some((lab_num - 1) / 6);
                        time_index = Some((lab_num - 1) % 6);
                    } else if lab_num >= 31 && lab_num <= 60 {
                        day_index = Some((lab_num - 31) / 6);
                        time_index = Some(6 + ((lab_num - 31) % 6));
                    }

                    if let (Some(d_idx), Some(t_idx)) = (day_index, time_index) {
                        if d_idx < 7 && t_idx < LAB_TIMES.len() {
                            let entry = ScheduleEntry {
                                day: DAYS[d_idx].to_string(),
                                start_time: LAB_TIMES[t_idx].start.to_string(),
                                end_time: LAB_TIMES[t_idx].end.to_string(),
                                course_code: course.code.clone(),
                                course_title: course.title.clone(),
                                course_type: "Lab".to_string(),
                                slot: slot.to_string(),
                                venue: course.venue.clone(),
                                faculty: course.faculty.name.clone(),
                            };
                            add_to_schedule(&mut schedule, d_idx, entry);
                        }
                    }
                }
            } else {
                if let Some(mappings) = theory_map.get(slot) {
                    for &(d_idx, t_idx) in mappings {
                        if d_idx < 7 && t_idx < THEORY_TIMES.len() {
                            let entry = ScheduleEntry {
                                day: DAYS[d_idx].to_string(),
                                start_time: THEORY_TIMES[t_idx].start.to_string(),
                                end_time: THEORY_TIMES[t_idx].end.to_string(),
                                course_code: course.code.clone(),
                                course_title: course.title.clone(),
                                course_type: "Theory".to_string(),
                                slot: slot.to_string(),
                                venue: course.venue.clone(),
                                faculty: course.faculty.name.clone(),
                            };
                            add_to_schedule(&mut schedule, d_idx, entry);
                        }
                    }
                }
            }
        }
    }

    sort_schedule(&mut schedule);
    schedule
}

fn add_to_schedule(schedule: &mut WeeklySchedule, day_idx: usize, entry: ScheduleEntry) {
    match day_idx {
        0 => schedule.monday.push(entry),
        1 => schedule.tuesday.push(entry),
        2 => schedule.wednesday.push(entry),
        3 => schedule.thursday.push(entry),
        4 => schedule.friday.push(entry),
        5 => schedule.saturday.push(entry),
        6 => schedule.sunday.push(entry),
        _ => {}
    }
}

fn sort_schedule(schedule: &mut WeeklySchedule) {
    let sort_fn = |a: &ScheduleEntry, b: &ScheduleEntry| {
        get_minutes(&a.start_time).cmp(&get_minutes(&b.start_time))
    };

    schedule.monday.sort_by(sort_fn);
    schedule.tuesday.sort_by(sort_fn);
    schedule.wednesday.sort_by(sort_fn);
    schedule.thursday.sort_by(sort_fn);
    schedule.friday.sort_by(sort_fn);
    schedule.saturday.sort_by(sort_fn);
    schedule.sunday.sort_by(sort_fn);
}

fn get_minutes(t: &str) -> i32 {
    let parts: Vec<&str> = t.split_whitespace().collect();
    if parts.len() < 2 { return 0; }
    let time_parts: Vec<&str> = parts[0].split(':').collect();
    if time_parts.len() < 2 { return 0; }
    
    let mut h = time_parts[0].parse::<i32>().unwrap_or(0);
    let m = time_parts[1].parse::<i32>().unwrap_or(0);
    let period = parts[1];

    if period == "PM" && h != 12 { h += 12; }
    if period == "AM" && h == 12 { h = 0; }
    h * 60 + m
}
