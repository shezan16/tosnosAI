import { NextRequest, NextResponse } from "next/server";

let initialConversations = [
  { id: "conv-1", title: "Java project help", updatedAt: "2 min ago", pinned: true, category: "recent" },
  { id: "conv-2", title: "আজকের দিনটা খুব ভালো 🥴", updatedAt: "25 min ago", pinned: false, category: "recent" },
  { id: "conv-3", title: "Data Structure notes", updatedAt: "1 hour ago", pinned: false, category: "recent" },
  { id: "conv-4", title: "Travel plan for Cox's Bazar", updatedAt: "3 hours ago", pinned: false, category: "recent" },
  { id: "conv-5", title: "My presentation practice", updatedAt: "5 hours ago", pinned: false, category: "recent" },
  { id: "conv-6", title: "Python error fix", updatedAt: "1 day ago", pinned: false, category: "recent" },
  { id: "conv-7", title: "English to Bangla translation", updatedAt: "1 day ago", pinned: false, category: "recent" }
];

export async function GET() {
  return NextResponse.json({ conversations: initialConversations });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const newConv = {
      id: `conv-${Date.now()}`,
      title: body.title || "New Conversation",
      updatedAt: "Just now",
      pinned: false,
      category: "recent"
    };

    initialConversations.unshift(newConv);
    return NextResponse.json({ success: true, conversation: newConv });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
