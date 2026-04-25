# notIRC Client

A terminal chat client for the notIRC server, built with [Textual](https://textual.textualize.io/) and WebSockets.

## Requirements

- Python 3.14+
- [uv](https://docs.astral.sh/uv/)

## Setup

Install dependencies:

```bash
uv sync
```

## Running

```bash
uv run notirc --host <host> --token <token> --nick <nickname>
```

For a local server without TLS:

```bash
uv run notirc --host localhost:8080 --token <token> --nick <nickname> --no-tls
```

### Arguments

| Argument | Required | Description |
|---|---|---|
| `--host` | Yes | Server hostname, e.g. `chat.example.com` or `localhost:8080` |
| `--token` | Yes | API token for authentication |
| `--nick` | Yes | Your nickname in the chat |
| `--no-tls` | No | Use `ws://` instead of `wss://` (for local development) |

## Controls

- Type a message and press **Enter** to send
- **Ctrl+C** to quit
