import { NextRequest, NextResponse } from "next/server";

// In-memory memory store with persistent schema structure
let memoryStore: Array<{ id: string; key: string; value: string; category: string; isEnabled: boolean; createdAt: string }> = [
  {
    id: "mem-1",
    key: "Language Preference",
    value: "Prefers simple English explanations and natural Bengali in voice",
    category: "preference",
    isEnabled: true,
    createdAt: new Date().toISOString()
  },
  {
    id: "mem-2",
    key: "User Profile",
    value: "Computer Science student working on AI and Web applications",
    category: "detail",
    isEnabled: true,
    createdAt: new Date().toISOString()
  }
];

export async function GET() {
  return NextResponse.json({ memories: memoryStore });
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { key, value, category } = body;

    if (!key || !value) {
      return NextResponse.json({ error: "Key and value are required" }, { status: 400 });
    }

    const newMemory = {
      id: `mem-${Date.now()}`,
      key,
      value,
      category: category || "preference",
      isEnabled: true,
      createdAt: new Date().toISOString()
    };

    memoryStore.push(newMemory);
    return NextResponse.json({ success: true, memory: newMemory });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Memory ID required" }, { status: 400 });
    }

    memoryStore = memoryStore.filter(m => m.id !== id);
    return NextResponse.json({ success: true, remaining: memoryStore.length });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
