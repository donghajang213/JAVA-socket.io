import React, { useEffect, useState } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const App = () => {
  const [nickname, setNickname] = useState("");
  const [roomId, setRoomId] = useState("");
  const [connected, setConnected] = useState(false);
  const [client, setClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [users, setUsers] = useState([]);
  const [receiver, setReceiver] = useState(""); // 1:1 전송 대상


  const connect = () => {
    const socket = new SockJS(`http://localhost:8080/ws-chat?nickname=${nickname}`);
    const stompClient = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        stompClient.subscribe(`/topic/${roomId}`, (msg) => {
          const message = JSON.parse(msg.body);
          setMessages((prev) => [...prev, message]);
        });

        // 사용자 목록 수신
        stompClient.subscribe(`/topic/${roomId}/users`, (msg) => {
          const userList = JSON.parse(msg.body);
          setUsers(userList.filter((name) => name !== nickname));
        });

        // ✅ 사용자 목록 강제 요청
        setTimeout(() => {
          stompClient.publish({
            destination: "/app/chat.users",
            body: JSON.stringify({ roomId }),
          });
        }, 300);


        // 본인에게 온 1:1 쪽지 수신
        stompClient.subscribe(`/user/queue/messages`, (msg) => {
          const m = JSON.parse(msg.body);
          console.log("💌 DM 수신:", m);
          setMessages((prev) => [...prev, { ...m, type: "DM" }]);
        });

        stompClient.publish({
          destination: "/app/chat.join",
          body: JSON.stringify({ sender: nickname, roomId, type: "JOIN" }),
        });

        setConnected(true);
      },
    });
    stompClient.activate();
    setClient(stompClient);
  };

  const sendMessage = () => {
    if (client && input) {
      const message = {
        sender: nickname,
        content: input,
        roomId,
        receiver: receiver || null,
        type: "CHAT",
      };
      client.publish({
        destination: "/app/chat.send",
        body: JSON.stringify(message),
      });
      setInput("");
    }
  };

  if (!connected) {
    return (
      <div style={{ padding: "30px" }}>
        <h2>채팅방 입장</h2>
        <input
          placeholder="닉네임"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
        />
        <input
          placeholder="방 이름"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
        />
        <button onClick={connect}>입장</button>
      </div>
    );
  }

  return (
      <div style={{ padding: "30px" }}>
        <h3>채팅방: {roomId}</h3>

        <div style={{ marginBottom: "10px" }}>
          <label>쪽지 대상: </label>
          <select
            onChange={(e) => setReceiver(e.target.value)}
            value={receiver}
          >
            <option value="">전체</option>
            {users.map((u, i) => (
              <option key={i} value={u}>{u}</option>
            ))}
          </select>
        </div>

        <ul style={{ minHeight: "200px" }}>
          {messages.map((m, i) => (
            <li key={i}>
              {m.type === "DM"
                ? `[DM ${m.sender === nickname ? "to" : "from"} ${m.sender === nickname ? m.receiver : m.sender}]: ${m.content}`
                : m.type === "JOIN"
                ? `💡 ${m.content}`
                : `${m.sender}: ${m.content}`}
            </li>
          ))}
        </ul>

        <input
          placeholder="메시지 입력"
          value={input}
          onChange={(e) => setInput(e.target.value)}
        />
        <button onClick={sendMessage}>전송</button>
      </div>
    );
  };

  export default App;