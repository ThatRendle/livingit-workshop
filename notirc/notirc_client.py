from __future__ import annotations

import asyncio
import json
import sys
import argparse
from datetime import datetime

import websockets
from websockets.exceptions import ConnectionClosed
from textual.app import App, ComposeResult
from textual.widgets import Header, Input, RichLog, Static
from textual.containers import Horizontal
from textual import on, work
from rich.markup import escape


RECONNECT_DELAYS = [1, 2, 4, 8, 16, 30]


class _NickTaken(Exception):
    pass


class NotIRCApp(App):
    CSS = """
    Screen {
        layout: vertical;
    }

    #main {
        layout: horizontal;
        height: 1fr;
    }

    #messages {
        width: 4fr;
        border: solid $accent;
        padding: 0 1;
    }

    #sidebar {
        width: 22;
        border: solid $accent;
        padding: 0 1;
    }

    Input {
        height: 3;
        dock: bottom;
        border: solid $accent;
    }
    """

    def __init__(self, url: str, nick: str) -> None:
        super().__init__()
        self._url = url
        self._nick = nick
        self._ws: websockets.WebSocketClientProtocol | None = None
        self._users: list[str] = []
        self._joined = False

    def compose(self) -> ComposeResult:
        yield Header(show_clock=True)
        with Horizontal(id="main"):
            yield RichLog(id="messages", wrap=True, markup=True)
            yield Static("", id="sidebar")
        yield Input(placeholder="Type a message and press Enter…", id="input")

    def on_mount(self) -> None:
        self.title = f"notIRC — {self._nick}"
        self._run_connection()

    def _refresh_sidebar(self) -> None:
        lines = ["[bold]Users[/bold]", ""]
        for u in sorted(self._users):
            prefix = "[bold cyan]»[/bold cyan] " if u == self._nick else "  "
            lines.append(f"{prefix}{escape(u)}")
        self.query_one("#sidebar", Static).update("\n".join(lines))

    def _log(self, text: str) -> None:
        self.query_one("#messages", RichLog).write(text)

    @work(exclusive=True)
    async def _run_connection(self) -> None:
        attempt = 0
        while True:
            self._ws = None
            self._joined = False
            nick_taken = False
            try:
                self._log("[dim]Connecting…[/dim]")
                async with websockets.connect(self._url) as ws:
                    self._ws = ws
                    attempt = 0
                    await ws.send(json.dumps({"type": "join", "nick": self._nick}))
                    async for raw in ws:
                        await self._dispatch(json.loads(raw))
                self._log("[yellow]Connection closed by server.[/yellow]")
            except _NickTaken:
                nick_taken = True
            except ConnectionClosed as exc:
                self._log(f"[red]Disconnected: {exc}[/red]")
            except OSError as exc:
                self._log(f"[red]Connection failed: {exc}[/red]")
            except Exception as exc:
                self._log(f"[red]Unexpected error: {exc}[/red]")

            self._ws = None
            self._joined = False
            self._users = []
            self._refresh_sidebar()

            if nick_taken:
                return

            delay = RECONNECT_DELAYS[min(attempt, len(RECONNECT_DELAYS) - 1)]
            attempt += 1
            self._log(f"[dim]Reconnecting in {delay}s…[/dim]")
            await asyncio.sleep(delay)

    async def _dispatch(self, data: dict) -> None:
        kind = data.get("type")

        if kind == "join_ok":
            self._joined = True
            self._users = list(data.get("users", [])) + [self._nick]
            self._refresh_sidebar()
            others = len(self._users) - 1
            noun = "user" if others == 1 else "users"
            self._log(
                f"[green]Joined as [bold]{escape(self._nick)}[/bold]. "
                f"{others} {noun} already connected.[/green]"
            )

        elif kind == "join_error":
            self._log(
                f"[bold red]Nickname [bold]{escape(self._nick)}[/bold] is already taken. Exiting.[/bold red]"
            )
            self.exit()
            raise _NickTaken()

        elif kind == "message":
            nick = data.get("nick", "?")
            text = data.get("text", "")
            ts = datetime.now().strftime("%H:%M")
            if nick == self._nick:
                nick_fmt = f"[bold cyan]{escape(nick)}[/bold cyan]"
            else:
                nick_fmt = f"[bold]{escape(nick)}[/bold]"
            self._log(f"[dim]{ts}[/dim] {nick_fmt}: {escape(text)}")

        elif kind == "user_joined":
            nick = data.get("nick", "")
            if nick not in self._users:
                self._users.append(nick)
            self._refresh_sidebar()
            self._log(f"[dim italic]→ {escape(nick)} joined[/dim italic]")

        elif kind == "user_left":
            nick = data.get("nick", "")
            self._users = [u for u in self._users if u != nick]
            self._refresh_sidebar()
            self._log(f"[dim italic]← {escape(nick)} left[/dim italic]")

        elif kind == "message_error":
            reason = data.get("reason", "unknown")
            self._log(f"[red]Message not sent: {reason}[/red]")

    @on(Input.Submitted)
    async def send_message(self, event: Input.Submitted) -> None:
        text = event.value.strip()
        event.input.clear()
        if not text or not self._joined or self._ws is None:
            return
        await self._ws.send(json.dumps({"type": "message", "text": text}))


def main() -> None:
    parser = argparse.ArgumentParser(description="notIRC TUI client")
    parser.add_argument("--host", required=True, help="Server hostname (e.g. chat.example.com or localhost:8080)")
    parser.add_argument("--token", required=True, help="API token")
    parser.add_argument("--nick", required=True, help="Nickname")
    parser.add_argument("--no-tls", action="store_true", help="Use ws:// instead of wss:// (for local dev)")
    args = parser.parse_args()

    scheme = "ws" if args.no_tls else "wss"
    url = f"{scheme}://{args.host}/ws?token={args.token}"

    NotIRCApp(url=url, nick=args.nick).run()


if __name__ == "__main__":
    main()
