//! Bridge to SimpleClaw, the desktop agent that operates real GUIs.
//!
//! SimpleClaw exposes a control API on 127.0.0.1 and publishes its port and a fresh
//! bearer token to a discovery file in its own userData directory on every launch.
//! That token is remote control of this machine — `POST /v1/runs` runs an arbitrary
//! natural-language task against whatever application the agent is sealed to. So it
//! stays in this process: the webview gets a narrow set of commands and never sees the
//! credential. That is also why we do not reach for tauri-plugin-http or -fs, either of
//! which would hand the renderer a general capability where a specific one will do.
//!
//! Everything here is transport: discovery, auth, SSE relay, error classification. No
//! business meaning, no plan state — that all lives in the frontend orchestrator.

use std::collections::HashMap;
use std::path::PathBuf;
use std::sync::Mutex;

use futures_util::StreamExt;
use serde::{Deserialize, Serialize};
use serde_json::{json, Value};
use tauri::{AppHandle, Emitter, Manager, State};

/// Event name the webview listens on. Every run event is relayed under this one name
/// with the run id in the payload, so a subscriber can filter without opening a channel
/// per run.
const RUN_EVENT: &str = "simpleclaw://run";

/// Electron derives its userData directory name from `productName` when packaged and
/// from the package name in development, and SimpleClaw is mid-rename. Probing a list
/// beats hardcoding one: a wrong single guess surfaces as "not installed", which is the
/// least diagnosable of our error kinds.
const CANDIDATE_DIRS: &[&str] = &[
    "SimpleClaw",
    "Computer Autoplay",
    "computer-autoplay",
    "simpleclaw",
];

const DISCOVERY_FILE: &str = "autoplay-api.json";

// --- Errors ------------------------------------------------------------------------

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BridgeError {
    /// Discriminant the UI switches on. `notInstalled`, `notRunning` and `unauthorized`
    /// need visibly different wording — "install it", "start it", "it restarted, retry"
    /// are three different actions for the user.
    pub kind: String,
    pub message: String,
}

impl BridgeError {
    fn new(kind: &str, message: impl Into<String>) -> Self {
        Self { kind: kind.into(), message: message.into() }
    }

    fn not_installed() -> Self {
        Self::new(
            "notInstalled",
            "SimpleClaw is not installed on this machine, or has never been launched.",
        )
    }

    fn not_running() -> Self {
        Self::new(
            "notRunning",
            "SimpleClaw is not answering. Start it, then try again.",
        )
    }

    fn http(status: u16, body: &str) -> Self {
        // The API returns {"error": "..."} on every failure path; fall back to the raw
        // body so an unexpected shape still reaches the user instead of a bare code.
        let detail = serde_json::from_str::<Value>(body)
            .ok()
            .and_then(|v| v.get("error").and_then(|e| e.as_str()).map(str::to_owned))
            .unwrap_or_else(|| body.trim().to_owned());

        let kind = match status {
            401 => "unauthorized",
            403 => "forbidden",
            409 => "ambiguousAgent",
            404 => "notFound",
            _ => "http",
        };
        Self::new(kind, if detail.is_empty() { format!("HTTP {status}") } else { detail })
    }
}

impl From<reqwest::Error> for BridgeError {
    fn from(err: reqwest::Error) -> Self {
        if err.is_connect() {
            // A discovery file pointing at a dead port is what a hard-killed SimpleClaw
            // leaves behind — it is removed only on a clean quit.
            BridgeError::not_running()
        } else {
            BridgeError::new("http", err.to_string())
        }
    }
}

type BridgeResult<T> = Result<T, BridgeError>;

// --- Discovery ---------------------------------------------------------------------

#[derive(Debug, Clone, Deserialize)]
struct Discovery {
    port: u16,
    token: String,
}

fn discovery_paths() -> Vec<PathBuf> {
    // dirs::config_dir() resolves to the same place Electron calls `appData`:
    // %APPDATA% on Windows, ~/Library/Application Support on macOS, ~/.config on Linux.
    let Some(base) = dirs::config_dir() else {
        return Vec::new();
    };
    CANDIDATE_DIRS
        .iter()
        .map(|dir| base.join(dir).join(DISCOVERY_FILE))
        .collect()
}

fn read_discovery() -> BridgeResult<Discovery> {
    let mut last_parse_error: Option<String> = None;

    for path in discovery_paths() {
        let Ok(raw) = std::fs::read_to_string(&path) else {
            continue;
        };
        match serde_json::from_str::<Discovery>(&raw) {
            Ok(info) if info.port != 0 && !info.token.is_empty() => return Ok(info),
            Ok(_) => last_parse_error = Some(format!("{} is incomplete", path.display())),
            Err(e) => last_parse_error = Some(format!("{}: {e}", path.display())),
        }
    }

    // A file that exists but cannot be used is a different problem from no file at all,
    // and telling someone to install what they already have wastes their time.
    match last_parse_error {
        Some(detail) => Err(BridgeError::new("notInstalled", format!(
            "Found a SimpleClaw discovery file but could not read it — {detail}"
        ))),
        None => Err(BridgeError::not_installed()),
    }
}

// --- Shared state --------------------------------------------------------------------

#[derive(Default)]
pub struct Bridge {
    /// Cached so a burst of calls does not re-read the file, but never persisted: the
    /// token is regenerated on every SimpleClaw launch and must not outlive the process.
    discovery: Mutex<Option<Discovery>>,
    /// Runs we are currently relaying, so `follow` is idempotent and `unfollow` works.
    followed: Mutex<HashMap<String, ()>>,
}

impl Bridge {
    fn cached(&self) -> Option<Discovery> {
        self.discovery.lock().ok().and_then(|g| g.clone())
    }

    fn resolve(&self) -> BridgeResult<Discovery> {
        if let Some(info) = self.cached() {
            return Ok(info);
        }
        self.refresh()
    }

    fn refresh(&self) -> BridgeResult<Discovery> {
        let info = read_discovery()?;
        if let Ok(mut guard) = self.discovery.lock() {
            *guard = Some(info.clone());
        }
        Ok(info)
    }

    fn invalidate(&self) {
        if let Ok(mut guard) = self.discovery.lock() {
            *guard = None;
        }
    }
}

// --- HTTP ----------------------------------------------------------------------------

async fn send(info: &Discovery, method: reqwest::Method, path: &str, body: Option<Value>) -> BridgeResult<(u16, String)> {
    let client = reqwest::Client::new();
    let mut req = client
        .request(method, format!("http://127.0.0.1:{}{path}", info.port))
        .bearer_auth(&info.token);
    if let Some(payload) = body {
        req = req.json(&payload);
    }
    let res = req.send().await?;
    let status = res.status().as_u16();
    let text = res.text().await.unwrap_or_default();
    Ok((status, text))
}

/// Perform a request, and on 401 re-read the discovery file once before giving up.
///
/// SimpleClaw mints a new token on every launch, so a token that worked a minute ago is
/// stale the moment it restarts. Retrying once turns "you have to restart OneBrain too"
/// into something the user never notices.
async fn request(bridge: &Bridge, method: reqwest::Method, path: &str, body: Option<Value>) -> BridgeResult<Value> {
    let info = bridge.resolve()?;
    let (status, text) = send(&info, method.clone(), path, body.clone()).await?;

    let (status, text) = if status == 401 {
        bridge.invalidate();
        let info = bridge.refresh()?;
        send(&info, method, path, body).await?
    } else {
        (status, text)
    };

    if !(200..300).contains(&status) {
        return Err(BridgeError::http(status, &text));
    }
    Ok(serde_json::from_str(&text).unwrap_or(Value::Null))
}

// --- Commands ------------------------------------------------------------------------

#[derive(Debug, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct BridgeStatus {
    pub connected: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub version: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub organization: Option<String>,
    pub busy: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub active_run_id: Option<String>,
    pub queued: u32,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<BridgeError>,
}

/// Liveness probe. Returns a status object rather than an error so the UI can render a
/// disconnected state without treating it as an exception — SimpleClaw being closed is
/// an ordinary condition, not a fault.
#[tauri::command]
pub async fn simpleclaw_status(bridge: State<'_, Bridge>) -> Result<BridgeStatus, ()> {
    let disconnected = |error: BridgeError| BridgeStatus {
        connected: false,
        version: None,
        organization: None,
        busy: false,
        active_run_id: None,
        queued: 0,
        error: Some(error),
    };

    let health = match request(&bridge, reqwest::Method::GET, "/v1/health", None).await {
        Ok(v) => v,
        Err(e) => return Ok(disconnected(e)),
    };

    // Organization is only in /v1/capabilities; a failure there should not read as
    // "disconnected", so it degrades to None.
    let organization = request(&bridge, reqwest::Method::GET, "/v1/capabilities", None)
        .await
        .ok()
        .and_then(|v| v.get("organization").and_then(|o| o.as_str()).map(str::to_owned));

    Ok(BridgeStatus {
        connected: true,
        version: health.get("version").and_then(|v| v.as_str()).map(str::to_owned),
        organization,
        busy: health.get("busy").and_then(|v| v.as_bool()).unwrap_or(false),
        active_run_id: health.get("activeRunId").and_then(|v| v.as_str()).map(str::to_owned),
        queued: health.get("queued").and_then(|v| v.as_u64()).unwrap_or(0) as u32,
        error: None,
    })
}

#[tauri::command]
pub async fn simpleclaw_capabilities(bridge: State<'_, Bridge>) -> BridgeResult<Value> {
    request(&bridge, reqwest::Method::GET, "/v1/capabilities", None).await
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StartRunRequest {
    pub goal: String,
    pub agent_id: Option<String>,
    pub expect: Option<String>,
    pub outline: Option<Vec<String>>,
}

#[tauri::command]
pub async fn simpleclaw_start_run(bridge: State<'_, Bridge>, req: StartRunRequest) -> BridgeResult<Value> {
    let mut body = json!({ "goal": req.goal });
    if let Some(agent_id) = req.agent_id {
        body["agentId"] = json!(agent_id);
    }
    if let Some(expect) = req.expect {
        body["expect"] = json!(expect);
    }
    if let Some(outline) = req.outline {
        body["outline"] = json!(outline);
    }
    request(&bridge, reqwest::Method::POST, "/v1/runs", Some(body)).await
}

#[tauri::command]
pub async fn simpleclaw_get_run(bridge: State<'_, Bridge>, run_id: String) -> BridgeResult<Value> {
    request(&bridge, reqwest::Method::GET, &format!("/v1/runs/{run_id}"), None).await
}

#[tauri::command]
pub async fn simpleclaw_answer_run(bridge: State<'_, Bridge>, run_id: String, text: String) -> BridgeResult<Value> {
    request(
        &bridge,
        reqwest::Method::POST,
        &format!("/v1/runs/{run_id}/answer"),
        Some(json!({ "text": text })),
    )
    .await
}

#[tauri::command]
pub async fn simpleclaw_stop_run(bridge: State<'_, Bridge>, run_id: String) -> BridgeResult<Value> {
    request(&bridge, reqwest::Method::POST, &format!("/v1/runs/{run_id}/stop"), None).await
}

#[tauri::command]
pub async fn simpleclaw_show_window(bridge: State<'_, Bridge>) -> BridgeResult<Value> {
    request(&bridge, reqwest::Method::POST, "/v1/window/show", None).await
}

// --- SSE relay -------------------------------------------------------------------------

fn emit_run_event(app: &AppHandle, run_id: &str, event: &str, data: Value) {
    let _ = app.emit(RUN_EVENT, json!({ "runId": run_id, "event": event, "data": data }));
}

/// Start relaying a run's event stream to the webview. Idempotent: subscribing twice
/// would double every event, and the page re-subscribes on mount after a reload.
///
/// The stream is owned by this process rather than the renderer, so a webview reload
/// does not drop it and the run keeps being observed.
#[tauri::command]
pub async fn simpleclaw_follow_run(app: AppHandle, bridge: State<'_, Bridge>, run_id: String) -> BridgeResult<()> {
    {
        let mut followed = bridge.followed.lock().map_err(|_| BridgeError::new("http", "bridge state poisoned"))?;
        if followed.contains_key(&run_id) {
            return Ok(());
        }
        followed.insert(run_id.clone(), ());
    }

    let info = bridge.resolve()?;
    let url = format!(
        "http://127.0.0.1:{}/v1/runs/{}/events?token={}",
        info.port,
        run_id,
        urlencoding_encode(&info.token)
    );

    tauri::async_runtime::spawn(async move {
        let outcome = relay(&app, &run_id, &url).await;

        if let Err(err) = outcome {
            emit_run_event(&app, &run_id, "error", serde_json::to_value(&err).unwrap_or(Value::Null));
        }
        // Always tell the frontend the relay is over, however it ended, so a run can
        // never sit in the UI as "running" with nothing behind it.
        emit_run_event(&app, &run_id, "closed", Value::Null);

        if let Some(state) = app.try_state::<Bridge>() {
            if let Ok(mut followed) = state.followed.lock() {
                followed.remove(&run_id);
            }
        }
    });

    Ok(())
}

async fn relay(app: &AppHandle, run_id: &str, url: &str) -> BridgeResult<()> {
    let res = reqwest::Client::new().get(url).header("Accept", "text/event-stream").send().await?;

    let status = res.status().as_u16();
    if !(200..300).contains(&status) {
        let body = res.text().await.unwrap_or_default();
        return Err(BridgeError::http(status, &body));
    }

    let mut stream = res.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk) = stream.next().await {
        let chunk = chunk?;
        buffer.push_str(&String::from_utf8_lossy(&chunk));

        // SSE frames are separated by a blank line. Anything after the last separator is
        // a partial frame and stays in the buffer for the next chunk.
        while let Some(idx) = buffer.find("\n\n") {
            let frame: String = buffer.drain(..idx + 2).collect();
            let Some((event, data)) = parse_frame(&frame) else {
                continue;
            };
            let terminal = event == "result";
            emit_run_event(app, run_id, &event, data);
            if terminal {
                // The server closes the stream after `result`; returning here means the
                // ordinary end of a run never looks like a dropped connection.
                return Ok(());
            }
        }
    }

    Ok(())
}

fn parse_frame(frame: &str) -> Option<(String, Value)> {
    let mut event = String::from("message");
    let mut data_lines: Vec<&str> = Vec::new();

    for line in frame.lines() {
        if let Some(rest) = line.strip_prefix("event:") {
            event = rest.trim().to_owned();
        } else if let Some(rest) = line.strip_prefix("data:") {
            data_lines.push(rest.strip_prefix(' ').unwrap_or(rest));
        }
        // `: ping` keep-alive comments and anything else are ignored.
    }

    if data_lines.is_empty() {
        return None;
    }
    let joined = data_lines.join("\n");
    serde_json::from_str(&joined).ok().map(|data| (event, data))
}

#[tauri::command]
pub async fn simpleclaw_unfollow_run(bridge: State<'_, Bridge>, run_id: String) -> BridgeResult<()> {
    if let Ok(mut followed) = bridge.followed.lock() {
        followed.remove(&run_id);
    }
    Ok(())
}

/// Percent-encode the token for the SSE query parameter. It is hex from `randomBytes`,
/// so nothing needs escaping today — this exists so a future token format cannot
/// silently produce a malformed URL.
fn urlencoding_encode(value: &str) -> String {
    value
        .bytes()
        .map(|b| match b {
            b'A'..=b'Z' | b'a'..=b'z' | b'0'..=b'9' | b'-' | b'_' | b'.' | b'~' => (b as char).to_string(),
            _ => format!("%{b:02X}"),
        })
        .collect()
}
