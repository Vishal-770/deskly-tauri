use base64::Engine;
use once_cell::sync::Lazy;
use serde::Deserialize;

use super::constants::LABEL_TEXT;

#[derive(Debug, Clone, Deserialize)]
struct CaptchaModel {
    weights: Vec<Vec<f32>>,
    biases: Vec<f32>,
}

static CAPTCHA_MODEL: Lazy<CaptchaModel> = Lazy::new(|| {
    serde_json::from_str(include_str!("captcha_model.json"))
        .expect("captcha model file is invalid")
});

pub fn decode_data_url_bytes(data_url: &str) -> Result<Vec<u8>, String> {
    let base64_part = data_url
        .split(",")
        .nth(1)
        .ok_or_else(|| "invalid data url for captcha".to_string())?;

    base64::engine::general_purpose::STANDARD
        .decode(base64_part)
        .map_err(|e| format!("failed to decode captcha data url: {e}"))
}

fn get_image_blocks(saturate: &[f32], width: usize, height: usize) -> Result<Vec<Vec<f32>>, String> {
    let expected = 200usize * 40usize;
    if width * height < expected {
        return Err(format!(
            "captcha image too small: got {}x{}, expected at least 200x40",
            width, height
        ));
    }

    let mut img = vec![vec![0.0f32; 200]; 40];
    for i in 0..40 {
        for j in 0..200 {
            img[i][j] = saturate[i * 200 + j];
        }
    }

    let mut blocks = Vec::with_capacity(6);
    for i in 0..6usize {
        let x1 = (i + 1) * 25 + 2;
        let y1 = 7 + 5 * (i % 2) + 1;
        let x2 = (i + 2) * 25 + 1;
        let y2 = 35 - 5 * ((i + 1) % 2);

        let mut block = Vec::new();
        for row in img.iter().take(y2).skip(y1) {
            for value in row.iter().take(x2).skip(x1) {
                block.push(*value);
            }
        }
        blocks.push(block);
    }

    Ok(blocks)
}

fn binarize(block: &[f32]) -> Vec<f32> {
    let avg = block.iter().copied().sum::<f32>() / block.len() as f32;
    block
        .iter()
        .map(|p| if *p > avg { 1.0 } else { 0.0 })
        .collect()
}

pub fn solve_captcha_from_image_bytes(bytes: &[u8]) -> Result<String, String> {
    let image = image::load_from_memory(bytes)
        .map_err(|e| format!("failed to decode captcha image: {e}"))?
        .to_rgb8();

    let (width_u32, height_u32) = image.dimensions();
    let width = width_u32 as usize;
    let height = height_u32 as usize;

    let mut saturate = Vec::with_capacity(width * height);
    for pixel in image.pixels() {
        let [r, g, b] = pixel.0;
        let r = r as f32;
        let g = g as f32;
        let b = b as f32;
        let min = r.min(g.min(b));
        let max = r.max(g.max(b));
        let value = if max == 0.0 { 0.0 } else { ((max - min) * 255.0 / max).round() };
        saturate.push(value);
    }

    let blocks = get_image_blocks(&saturate, width, height)?;
    let label_chars: Vec<char> = LABEL_TEXT.chars().collect();

    let mut result = String::new();
    for block in blocks {
        let input = binarize(&block);
        if input.len() != CAPTCHA_MODEL.weights.len() {
            return Err(format!(
                "captcha model/input mismatch: input={}, weights={}",
                input.len(),
                CAPTCHA_MODEL.weights.len()
            ));
        }

        let mut best_index = 0usize;
        let mut best_score = f32::MIN;

        for out_idx in 0..CAPTCHA_MODEL.biases.len() {
            let mut score = CAPTCHA_MODEL.biases[out_idx];
            for (in_idx, in_value) in input.iter().enumerate() {
                score += in_value * CAPTCHA_MODEL.weights[in_idx][out_idx];
            }

            if score > best_score {
                best_score = score;
                best_index = out_idx;
            }
        }

        let predicted = label_chars
            .get(best_index)
            .ok_or_else(|| "captcha prediction index out of bounds".to_string())?;
        result.push(*predicted);
    }

    Ok(result)
}
