import Link from "next/link";

export default function Home() {
  return (
    <main style={{ display: "flex", flexDirection: "column", gap: 24, alignItems: "center", marginTop: 80 }}>
      <h1 style={{ fontSize: 32, fontWeight: "bold" }}>AI Minutes 主导航</h1>
      <Link href="/meeting">
        <button style={{ padding: "12px 32px", borderRadius: 8, background: "#2563eb", color: "#fff", fontWeight: 600, fontSize: 18, marginBottom: 12 }}>
          进入会议实时转录
        </button>
      </Link>
      <Link href="/analytics">
        <button style={{ padding: "12px 32px", borderRadius: 8, background: "#16a34a", color: "#fff", fontWeight: 600, fontSize: 18 }}>
          查看会议分析报告
        </button>
      </Link>
    </main>
  );
}
