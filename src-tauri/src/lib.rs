mod simpleclaw;

use tauri::{App, LogicalSize, Manager, Size};

/// Shrink the configured window if it would not fit the screen it opens on.
///
/// The configured size is a preference, not a promise: it is one number for every
/// machine, and a window wider than the display opens with its right edge — and the
/// close button, on Windows — off-screen. Only ever shrinks, so a large monitor still
/// gets the full configured size.
///
/// The margins are for the taskbar and title bar. Tauri exposes the monitor's full
/// bounds, not its work area, so there is no exact figure to subtract.
fn fit_to_screen(app: &App) {
  let Some(window) = app.get_webview_window("main") else {
    return;
  };
  let Ok(Some(monitor)) = window.current_monitor() else {
    return;
  };

  let scale = monitor.scale_factor();
  let screen = monitor.size().to_logical::<f64>(scale);
  let Ok(outer) = window.outer_size() else {
    return;
  };
  let current = outer.to_logical::<f64>(scale);

  let width = current.width.min(screen.width * 0.92);
  let height = current.height.min(screen.height * 0.90);

  if width < current.width || height < current.height {
    let _ = window.set_size(Size::Logical(LogicalSize::new(width, height)));
    // `center: true` in the config ran against the old size.
    let _ = window.center();
  }
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
  tauri::Builder::default()
    .manage(simpleclaw::Bridge::default())
    .invoke_handler(tauri::generate_handler![
      simpleclaw::simpleclaw_status,
      simpleclaw::simpleclaw_capabilities,
      simpleclaw::simpleclaw_start_run,
      simpleclaw::simpleclaw_get_run,
      simpleclaw::simpleclaw_follow_run,
      simpleclaw::simpleclaw_unfollow_run,
      simpleclaw::simpleclaw_answer_run,
      simpleclaw::simpleclaw_stop_run,
      simpleclaw::simpleclaw_show_window,
    ])
    .setup(|app| {
      if cfg!(debug_assertions) {
        app.handle().plugin(
          tauri_plugin_log::Builder::default()
            .level(log::LevelFilter::Info)
            .build(),
        )?;
      }
      fit_to_screen(app);
      Ok(())
    })
    .run(tauri::generate_context!())
    .expect("error while running tauri application");
}
