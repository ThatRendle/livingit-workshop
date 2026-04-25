# Building a notIRC Client

notIRC is a WebSocket-based group chat server. All connected clients share a single channel. This document contains everything needed to build a working client in any language or on any platform.

---

## Connection

Open a WebSocket connection to:

```
wss://<host>/ws?token=<token>
```

- Replace `<host>` with the server hostname.
- Replace `<token>` with the shared API token (provided separately).
- The token is passed as a query parameter. Custom headers are not supported and are not required.

If the token is missing or incorrect, the server responds with **HTTP 401** and the connection is closed. No WebSocket upgrade occurs.

For local development, use `ws://` instead of `wss://`.

## Running the server locally

If you need to run the server yourself for development and testing, the quickest option is the published Docker image:

```
docker run -e NOTIRC_TOKEN=<token> -p 8080:8080 ghcr.io/thatrendle/notirc:latest
```

Then connect your client to `ws://localhost:8080/ws?token=<token>`.

You can use any token value you like when running locally — just use the same value in both the server command and your client's connection URL.

---

## Message format

All messages in both directions are **JSON objects** sent as WebSocket **text frames**. Every message has a `type` string field that identifies its kind. Additional fields depend on the type.

Pseudocode for a generic message:

```
{ "type": "<message-type>", ...other fields }
```

---

## Connection lifecycle

```
Client                            Server
  |                                 |
  |-- WebSocket upgrade ----------> |
  |   ?token=<token>                | HTTP 401 if token wrong/missing
  |                                 |
  |<-- upgrade accepted ----------- |
  |                                 |
  |-- { type: "join",               |
  |     nick: "<nickname>" } -----> | nick taken → join_error
  |                                 | nick free  → join_ok + user_joined to others
  |<-- { type: "join_ok",           |
  |      users: [...] } ----------- |
  |                                 |
  |-- { type: "message",            |
  |     text: "..." } ------------> | too long → message_error to sender
  |                                 | ok        → message broadcast to all
  |<-- { type: "message",           |
  |      nick: "...",               |
  |      text: "..." } ------------ |
  |                                 |
  |-- (disconnect) ---------------> | nick freed, user_left broadcast to others
```

---

## Messages sent by the client

### `join`

Must be the first message sent after the WebSocket connection is established. Registers the client's chosen nickname.

```
{
  "type": "join",
  "nick": "<chosen nickname>"
}
```

- Send this immediately after the upgrade succeeds.
- Wait for a `join_ok` or `join_error` response before doing anything else.
- If you receive `join_error`, you may send another `join` with a different nickname. The connection remains open.
- You cannot send `message` until you have received `join_ok`.

---

### `message`

Sends a message to the channel. Broadcast to all connected clients including the sender.

```
{
  "type": "message",
  "text": "<message text>"
}
```

- Only valid after a successful join.
- Maximum length: **1024 UTF-8 bytes**. This is a byte limit, not a character limit — multibyte characters (emoji, accented letters, CJK) count as 2–4 bytes each.
- If the message exceeds the limit, the server sends a `message_error` to the sender only. The connection stays open.

---

## Messages received from the server

### `join_ok`

Sent to the client when their nickname is accepted. Contains the list of all currently connected nicknames at the moment of joining (does not include the joining client's own nickname).

```
{
  "type": "join_ok",
  "users": ["<nick1>", "<nick2>", ...]
}
```

- `users` is an array of strings. It may be empty if no one else is connected.
- After receiving this, the client is fully joined and may send `message`.

---

### `join_error`

Sent to the client when their nickname is rejected.

```
{
  "type": "join_error",
  "reason": "nick_taken"
}
```

- `reason` is always `"nick_taken"` in the current implementation.
- The connection remains open. Send another `join` with a different nickname to retry.

---

### `user_joined`

Broadcast to all already-connected clients when a new client's nickname is accepted.

```
{
  "type": "user_joined",
  "nick": "<nickname>"
}
```

- Use this to maintain a local list of who is in the channel.
- The joining client does not receive this for themselves; they receive `join_ok` instead.

---

### `user_left`

Broadcast to all remaining clients when a client disconnects for any reason.

```
{
  "type": "user_left",
  "nick": "<nickname>"
}
```

- Use this to remove the nickname from your local user list.
- Sent regardless of whether the disconnect was clean or due to a network drop.

---

### `message`

Broadcast to all connected clients (including the sender) when a message is accepted.

```
{
  "type": "message",
  "nick": "<sender nickname>",
  "text": "<message text>"
}
```

- The server attaches the sender's nickname. Clients do not need to track who sent what — it is always present in the message.

---

### `message_error`

Sent only to the sending client when their message is rejected.

```
{
  "type": "message_error",
  "reason": "too_long"
}
```

- `reason` is always `"too_long"` in the current implementation.
- The connection remains open. The client may send further messages.

---

## Maintaining presence state

Maintain a local list of connected nicknames using these events:

- On `join_ok`: initialise the list from the `users` array.
- On `user_joined`: add the `nick` to the list.
- On `user_left`: remove the `nick` from the list.

The server is authoritative. Do not attempt to infer presence from messages.

---

## Handling unknown message types

The server may send message types not listed in this document in future versions. Clients should ignore any message with an unrecognised `type` rather than treating it as an error.

---

## Disconnect and reconnect

The server frees a nickname immediately when its client disconnects. If a client reconnects, it must send a new `join` message to re-register. There is no session resumption.

There is no ping/keepalive mechanism at the application layer. WebSocket-level ping/pong is handled by the underlying connection; clients do not need to implement it explicitly.

---

## Checklist for a minimal working client

```
1. Open WebSocket to wss://<host>/ws?token=<token>
2. On connection open:
     send { type: "join", nick: <chosen nick> }
3. On message received:
     parse JSON
     if type == "join_ok":
         store users list, mark as joined
     if type == "join_error":
         prompt user for a different nick, send another join
     if type == "message":
         display nick + text
     if type == "user_joined":
         add nick to user list
     if type == "user_left":
         remove nick from user list
     if type == "message_error":
         show error to user (message was too long)
     otherwise:
         ignore
4. To send a message:
     send { type: "message", text: <user input> }
5. On connection closed:
     handle reconnect if desired
```