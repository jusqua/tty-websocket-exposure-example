const WebSocket = require("ws");
const pty = require("node-pty");

const PORT = 8080;
const wss = new WebSocket.Server({ port: PORT });

wss.on("connection", (ws) => {
  const shell = process.platform === "win32" ? "powershell.exe" : "bash";
  process.env.COLORTERM = "truecolor";

  const ptyProcess = pty.spawn(shell, [], {
    name: "xterm-256color",
    cols: 80,
    rows: 24,
    cwd: process.env.HOME,
    env: process.env,
  });

  // Send pty data to the client
  ptyProcess.on("data", (data) => {
    ws.send(data);
  });

  ws.on("message", (message) => {
    try {
      const msg = JSON.parse(message);
      if (msg.type === "resize") {
        // Handle resize requests
        ptyProcess.resize(msg.cols, msg.rows);
      } else {
        // Non-resize messages fallback to writing raw data
        ptyProcess.write(message);
      }
    } catch (e) {
      // If parsing fails, assume it's raw data
      ptyProcess.write(message);
    }
  });

  ws.on("close", () => {
    ptyProcess.kill();
  });
});

console.log(`WebSocket server started on ws://localhost:${PORT}`);
