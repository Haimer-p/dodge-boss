# Chat Realtime với Giao Diện Giả Dạng

> Spec approved. Ready for implementation planning.

## Tổng Quan

Website chat realtime cho phép 2 người chat trong giờ làm với giao diện giả dạng tài liệu/code/terminal để đánh lạc hướng cấp trên. Sử dụng hoàn toàn free tier: Vercel + Upstash Redis.

## Công Nghệ

- **Next.js 14+** (App Router) - deploy lên Vercel
- **Upstash Redis** - lưu trữ messages + realtime Pub/Sub qua SSE
- **Tailwind CSS** - giao diện
- **TipTap** - chế độ Document
- **CodeMirror** - chế độ Code Editor
- **xterm.js** (hoặc terminal giả lập CSS) - chế độ Terminal

## Tính Năng

### Authentication / Room
- Tạo phòng chat với tên phòng + mật khẩu
- Join phòng bằng tên + mật khẩu
- Share link phòng cho người kia
- Phân biệt user bằng nickname nhập khi vào phòng

### Chat
- Gửi tin nhắn text
- Timestamp + tên người gửi
- Emoji, Markdown cơ bản
- Gửi ảnh (base64 hoặc URL)
- Lưu trữ lịch sử tin nhắn trong Redis
- Realtime qua SSE (Server-Sent Events) từ Upstash Redis Pub/Sub
- Cuộn xuống tin nhắn mới tự động
- Âm thanh thông báo tin nhắn mới (tuỳ chọn)

### Chế Độ Giả Dạng (3 modes, động)

#### 1. Document Mode
- Giao diện Google Docs với toolbar, ruler, page
- Nội dung văn bản mẫu tự động gõ từng chữ (hiệu ứng typing) - chủ đề lập trình
- Cursor nhấp nháy
- Chat hiển thị như comment/review bên phải
- Tự động scroll văn bản khi có nội dung mới

#### 2. Code Editor Mode
- Giao diện VS Code với sidebar, file tree giả, tab, status bar
- Code mẫu tự động chạy (gõ từng dòng) - code TypeScript/JavaScript
- Highlight syntax bằng CodeMirror
- Chat hiển thị như code review comments ở dưới
- Tự động scroll code

#### 3. Terminal Mode
- Giao diện terminal với green-on-black theme
- Log hệ thống tự động chạy
- Chat hiển thị như dòng lệnh chat
- Prompt giả $, >, #...

#### Chế độ hoạt động động
- Mỗi chế độ tự động có hoạt động nền (auto-typing, auto-scroll, auto-command)
- Random interval cho hành động giả
- Có thể bật/tắt hoặc reset chế độ

### Kiến Trúc Dữ Liệu Redis

```
room:{roomId}                    -> Hash: {name, password, created_at}
room:{roomId}:messages           -> List: [message1, message2, ...]
room:{roomId}:subscribers        -> Set: {user1, user2}
```

Mỗi message:
```json
{
  "id": "uuid",
  "userId": "user-id",
  "username": "Nickname",
  "content": "Nội dung tin nhắn",
  "timestamp": 1234567890,
  "type": "text" | "image" | "system"
}
```

### API Routes

| Route | Method | Chức năng |
|-------|--------|-----------|
| `/api/room/create` | POST | Tạo phòng mới |
| `/api/room/join` | POST | Kiểm tra và join phòng |
| `/api/chat/send` | POST | Gửi tin nhắn |
| `/api/chat/messages?roomId=X` | GET | Lấy lịch sử tin nhắn |
| `/api/chat/subscribe?roomId=X` | GET | SSE subscription |

### Luồng Realtime (SSE)

1. Client mở kết nối SSE đến `/api/chat/subscribe`
2. Server API route subscribe vào Redis Pub/Sub channel `room:{roomId}:channel`
3. Khi có message mới được publish, server push xuống client qua SSE
4. Client nhận và append message vào UI

### File Structure

```
d:\chat-real-time\
├── app/
│   ├── page.tsx                    # Landing page
│   ├── layout.tsx                  # Root layout
│   ├── globals.css                 # Global styles
│   ├── room/
│   │   ├── page.tsx                # Room list / join
│   │   └── [id]/
│   │       ├── page.tsx            # Room chat page
│   │       └── settings/page.tsx   # Room settings
│   ├── api/
│   │   ├── room/
│   │   │   ├── create/route.ts
│   │   │   └── join/route.ts
│   │   └── chat/
│   │       ├── send/route.ts
│   │       ├── messages/route.ts
│   │       └── subscribe/route.ts
│   └── create/
│       └── page.tsx                # Create room page
├── components/
│   ├── chat/
│   │   ├── ChatPanel.tsx
│   │   ├── MessageBubble.tsx
│   │   └── MessageInput.tsx
│   ├── modes/
│   │   ├── ModeSelector.tsx
│   │   ├── DocumentMode.tsx
│   │   ├── CodeEditorMode.tsx
│   │   └── TerminalMode.tsx
│   └── ui/
│       └── ... (shadcn/ui components nếu cần)
├── lib/
│   ├── redis.ts                    # Upstash Redis client
│   ├── types.ts                    # TypeScript types
│   └── utils.ts                    # Utility functions
├── public/
│   └── sound/
│       └── notification.mp3
├── middleware.ts                   # Redirect không có room
├── .env.local                      # UPSTASH_REDIS_URL, UPSTASH_REDIS_TOKEN
├── .gitignore
├── next.config.js
├── package.json
├── postcss.config.js
├── tailwind.config.ts
└── tsconfig.json
```

### Deploy lên Vercel

1. Push code lên GitHub
2. Import vào Vercel
3. Add environment variables: `UPSTASH_REDIS_URL`, `UPSTASH_REDIS_TOKEN`
4. Deploy - không cần config gì thêm
5. Lấy link Upstash Redis từ console.upstash.com (free tier)

## Constraints & Lưu ý

- Upstash Redis free: 10MB storage, 1000 commands/day (đủ cho chat text, ước tính ~5000 messages)
- Vercel free: 100h serverless compute/tháng, 100GB bandwidth
- Edge Functions: không dùng được Redis Pub/Sub subscribe trên Edge, nên dùng Serverless Functions
- SSE connection cần keep-alive, Vercel có timeout 60s cho Serverless Functions - cần handle reconnect
