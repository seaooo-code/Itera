use portable_pty::{native_pty_system, ChildKiller, CommandBuilder, MasterPty, PtySize};
use serde::Serialize;
use std::{
    collections::HashMap,
    io::{Read, Write},
    path::PathBuf,
    sync::{Arc, Mutex},
    thread,
};
use tauri::{ipc::Channel, State};

const DEFAULT_COLS: u16 = 80;
const DEFAULT_ROWS: u16 = 24;
const MAX_DIMENSION: u16 = 1_000;

struct TerminalProcess {
    master: Box<dyn MasterPty + Send>,
    writer: Box<dyn Write + Send>,
    killer: Box<dyn ChildKiller + Send + Sync>,
}

#[derive(Default)]
pub struct TerminalProcesses(Arc<Mutex<HashMap<String, TerminalProcess>>>);

#[derive(Clone, Serialize)]
#[serde(tag = "type", rename_all = "camelCase")]
pub enum TerminalEvent {
    Output { data: Vec<u8> },
    Exit { code: u32, signal: Option<String> },
    Error { message: String },
}

fn validate_session_id(session_id: &str) -> Result<(), String> {
    if session_id.is_empty() || session_id.len() > 160 {
        return Err("终端会话标识无效".to_string());
    }
    Ok(())
}

fn validate_cwd(cwd: &str) -> Result<PathBuf, String> {
    let path = PathBuf::from(cwd)
        .canonicalize()
        .map_err(|error| format!("无法访问终端工作目录 {cwd}: {error}"))?;
    if !path.is_dir() {
        return Err(format!("终端工作目录不是文件夹: {}", path.display()));
    }
    Ok(path)
}

fn validate_size(cols: u16, rows: u16) -> Result<PtySize, String> {
    if !(1..=MAX_DIMENSION).contains(&cols) || !(1..=MAX_DIMENSION).contains(&rows) {
        return Err("终端尺寸无效".to_string());
    }
    Ok(PtySize {
        rows,
        cols,
        pixel_width: 0,
        pixel_height: 0,
    })
}

fn shell_command(cwd: &PathBuf) -> CommandBuilder {
    #[cfg(windows)]
    let shell = std::env::var("COMSPEC").unwrap_or_else(|_| "cmd.exe".to_string());
    #[cfg(not(windows))]
    let shell = std::env::var("SHELL").unwrap_or_else(|_| "/bin/zsh".to_string());

    let mut command = CommandBuilder::new(shell);
    command.cwd(cwd);
    command.env("TERM", "xterm-256color");
    command.env("COLORTERM", "truecolor");
    command.env_remove("NO_COLOR");
    command.env_remove("CLICOLOR");
    command
}

fn stream_output(
    mut reader: Box<dyn Read + Send>,
    on_event: Channel<TerminalEvent>,
) -> thread::JoinHandle<()> {
    thread::spawn(move || {
        let mut receiver_available = true;
        let mut buffer = [0_u8; 8192];
        loop {
            match reader.read(&mut buffer) {
                Ok(0) => break,
                Ok(read) if receiver_available => {
                    receiver_available = on_event
                        .send(TerminalEvent::Output {
                            data: buffer[..read].to_vec(),
                        })
                        .is_ok();
                }
                Ok(_) => {}
                Err(error) => {
                    if receiver_available {
                        let _ = on_event.send(TerminalEvent::Error {
                            message: format!("读取终端输出失败: {error}"),
                        });
                    }
                    break;
                }
            }
        }
    })
}

#[tauri::command]
pub fn terminal_create(
    session_id: String,
    cwd: String,
    cols: Option<u16>,
    rows: Option<u16>,
    on_event: Channel<TerminalEvent>,
    processes: State<'_, TerminalProcesses>,
) -> Result<(), String> {
    validate_session_id(&session_id)?;
    let cwd = validate_cwd(&cwd)?;
    let size = validate_size(cols.unwrap_or(DEFAULT_COLS), rows.unwrap_or(DEFAULT_ROWS))?;

    let mut sessions = processes
        .0
        .lock()
        .map_err(|_| "终端进程状态不可用".to_string())?;
    if sessions.contains_key(&session_id) {
        return Err("终端会话已存在".to_string());
    }

    let pair = native_pty_system()
        .openpty(size)
        .map_err(|error| format!("无法创建终端 PTY: {error}"))?;
    let mut child = pair
        .slave
        .spawn_command(shell_command(&cwd))
        .map_err(|error| format!("无法在 {} 启动 Shell: {error}", cwd.display()))?;
    drop(pair.slave);

    let reader = pair
        .master
        .try_clone_reader()
        .map_err(|error| format!("无法读取终端输出: {error}"))?;
    let writer = pair
        .master
        .take_writer()
        .map_err(|error| format!("无法写入终端: {error}"))?;
    let killer = child.clone_killer();
    sessions.insert(
        session_id.clone(),
        TerminalProcess {
            master: pair.master,
            writer,
            killer,
        },
    );
    drop(sessions);

    let output_thread = stream_output(reader, on_event.clone());
    let process_map = Arc::clone(&processes.0);
    thread::spawn(move || {
        let status = child.wait();
        if let Ok(mut sessions) = process_map.lock() {
            sessions.remove(&session_id);
        }
        let _ = output_thread.join();

        match status {
            Ok(status) => {
                let _ = on_event.send(TerminalEvent::Exit {
                    code: status.exit_code(),
                    signal: status.signal().map(str::to_string),
                });
            }
            Err(error) => {
                let _ = on_event.send(TerminalEvent::Error {
                    message: format!("等待终端 Shell 结束失败: {error}"),
                });
                let _ = on_event.send(TerminalEvent::Exit {
                    code: 1,
                    signal: None,
                });
            }
        }
    });

    Ok(())
}

#[tauri::command]
pub fn terminal_write(
    session_id: String,
    data: Vec<u8>,
    processes: State<'_, TerminalProcesses>,
) -> Result<(), String> {
    validate_session_id(&session_id)?;
    let mut sessions = processes
        .0
        .lock()
        .map_err(|_| "终端进程状态不可用".to_string())?;
    let session = sessions
        .get_mut(&session_id)
        .ok_or_else(|| "终端会话不存在".to_string())?;
    session
        .writer
        .write_all(&data)
        .and_then(|_| session.writer.flush())
        .map_err(|error| format!("写入终端失败: {error}"))
}

#[tauri::command]
pub fn terminal_resize(
    session_id: String,
    cols: u16,
    rows: u16,
    processes: State<'_, TerminalProcesses>,
) -> Result<(), String> {
    validate_session_id(&session_id)?;
    let size = validate_size(cols, rows)?;
    let sessions = processes
        .0
        .lock()
        .map_err(|_| "终端进程状态不可用".to_string())?;
    let session = sessions
        .get(&session_id)
        .ok_or_else(|| "终端会话不存在".to_string())?;
    session
        .master
        .resize(size)
        .map_err(|error| format!("调整终端尺寸失败: {error}"))
}

#[tauri::command]
pub fn terminal_close(
    session_id: String,
    processes: State<'_, TerminalProcesses>,
) -> Result<bool, String> {
    validate_session_id(&session_id)?;
    let mut sessions = processes
        .0
        .lock()
        .map_err(|_| "终端进程状态不可用".to_string())?;
    let Some(session) = sessions.get_mut(&session_id) else {
        return Ok(false);
    };
    session
        .killer
        .kill()
        .map_err(|error| format!("关闭终端会话失败: {error}"))?;
    Ok(true)
}

impl Drop for TerminalProcesses {
    fn drop(&mut self) {
        if let Ok(mut sessions) = self.0.lock() {
            for (_, mut session) in sessions.drain() {
                let _ = session.killer.kill();
            }
        }
    }
}
