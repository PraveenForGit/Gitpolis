"use client";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";

interface LanguageSlice {
  language: string;
  repoCount: number;
}

const COLORS = ["#FF6B35", "#2ECC71", "#7C6CF6", "#F5C542", "#3AB0FF", "#E85D75"];

export default function LanguageChart({ data }: { data: LanguageSlice[] }) {
  if (data.length === 0) {
    return <div className="text-muted text-sm">No language data available</div>;
  }

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      <ResponsiveContainer width={180} height={180}>
        <PieChart>
          <Pie
            data={data}
            dataKey="repoCount"
            nameKey="language"
            innerRadius={50}
            outerRadius={80}
            paddingAngle={2}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={COLORS[i % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip contentStyle={{ background: "#17191D", border: "1px solid #24262B", borderRadius: 8 }} />
        </PieChart>
      </ResponsiveContainer>

      <div className="flex flex-col gap-2 flex-1 w-full">
        {data.slice(0, 6).map((slice, i) => (
          <div key={slice.language} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: COLORS[i % COLORS.length] }} />
              {slice.language}
            </span>
            <span className="text-muted">{slice.repoCount} repos</span>
          </div>
        ))}
      </div>
    </div>
  );
}