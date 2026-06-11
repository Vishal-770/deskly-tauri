// Prevents additional console window on Windows in release, DO NOT REMOVE!!
#![cfg_attr(not(debug_assertions), windows_subsystem = "windows")]

fn main() {
    #[cfg(target_os = "linux")]
    {
        // Disable DMA-BUF renderer and accelerated compositing on Linux
        // to prevent EGL_BAD_PARAMETER crashes on NVIDIA/Wayland systems (e.g. Fedora)
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
        std::env::set_var("WEBKIT_DISABLE_COMPOSITING_MODE", "1");
    }

    deskly_tauri_lib::run()
}
