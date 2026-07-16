const Home = () => {
  return (
    <main className="min-h-screen p-8 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-2 text-lg font-semibold">
           <span className="w-8 h-8 rounded-full bg-code items-center justify-center">*</span>
           Gitpolis
        </div>
        <div className="flex gap-2 bg-surface rounded-full p-1 border border-border">
          <button className="px-4 py-1.5 rounded-full bg-white text-black text-sm font-medium">Search</button>
          <button className="px-4 py-1.5 rounded-full text-sm text-muted">About</button>
        </div>
      </div>

      <h1 className="text-2xl font-semibold mb-1">Enter the github profile</h1>
      <p className="text-muted mb-6 font-mono text-sm">$git stats &lt;username&gt;</p>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">

        <div className="bg-surface border border-border rounded-3xl p-6">
          <h2 className="font-semibold mb-4">Top Repositories</h2>
          <div className="flex items-end gap-3 h-40">
             {[80, 140, 110, 60, 95].map((h, i) => (
              <div key={i} className="flex-1 bg-code rounded-t" style={{ height: `${h}px` }} />
             ))}
          </div>
        </div>

        <div className="bg-surface border border-border rounded-3xl p-6 flex flex-col items-center justify-center">
          <h2 className="font-semibold mb-4 self-start">Commit Mix</h2>
          <div 
            className="relative w-40 h-40 rounded-full"
            style={{background: `conic-gradient(#FF6B35 0% 72%, #2ECC71 72% 100%)`}}
          >
            <div className="absolute inset-4 rounded-full bg-surface flex items-center justify-center text-xl font-semibold">
              72%
            </div>
          </div>
          <div className="flex gap-4 mt-4 text-sm">
            <span className="text-code">● Code</span>
            <span className="text-docs">● Docs</span>
          </div>
        </div>

        <div className="md:col-span-2 bg-surface border border-border rounded-3xl p-6">
          <h2 className="font-semibold mb-4">Languages</h2>
          <div className="flex gap-3">
              {["TypeScript", "Python", "CSS"].map((lang, i) => (
                <div key={lang} className="flex-1 bg-background rounded-2xl p-4 border border-border">
                  <div>{lang}</div>
                  <div>{[6, 3, 2][i]} repos</div>
                </div>
              ))}
          </div>
        </div>
      </div>
    </main>
  );
};

export default Home;