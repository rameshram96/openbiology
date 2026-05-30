/**
 * BlogPage.jsx  –  Route: /blog
 * Search · Sort · Tag filter · Recent articles · Responsive card grid
 * Articles are auto-discovered via useArticles — no registry needed.
 */

import { useState, useMemo }     from "react";
import { useNavigate }           from "react-router-dom";
import { getAllArticles, getAllTags } from "./useArticles";
import BlogCard                  from "./components/BlogCard";

const GREEN_GRAD = "linear-gradient(135deg, #1a3a1a, #2d6a2d)";

const SORT_OPTIONS = [
  { value:"newest", label:"Most Recent"  },
  { value:"oldest", label:"Oldest First" },
  { value:"az",     label:"A – Z"        },
  { value:"za",     label:"Z – A"        },
];

function sortArticles(articles, mode) {
  const copy = [...articles];
  switch (mode) {
    case "oldest": return copy.sort((a,b)=>new Date(a.metadata.date)-new Date(b.metadata.date));
    case "az":     return copy.sort((a,b)=>a.metadata.title.localeCompare(b.metadata.title));
    case "za":     return copy.sort((a,b)=>b.metadata.title.localeCompare(a.metadata.title));
    default:       return copy.sort((a,b)=>new Date(b.metadata.date)-new Date(a.metadata.date));
  }
}

function matchesSearch(metadata, query) {
  if (!query.trim()) return true;
  const q = query.toLowerCase();
  return (
    metadata.title?.toLowerCase().includes(q) ||
    metadata.description?.toLowerCase().includes(q) ||
    (metadata.tags||[]).some(t=>t.toLowerCase().includes(q)) ||
    metadata.author?.name?.toLowerCase().includes(q)
  );
}

function TagPill({ label, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      padding:"0.28rem 0.75rem", borderRadius:999,
      border:`1.5px solid ${active?"#2d6a2d":"#E5E5E5"}`,
      background:active?"#2d6a2d":"#fff",
      color:active?"#fff":"#666",
      fontSize:"0.68rem", fontWeight:active?700:500,
      cursor:"pointer", transition:"all 0.15s",
      whiteSpace:"nowrap", fontFamily:"'DM Sans',sans-serif",
    }}>
      {label}
    </button>
  );
}

function RecentItem({ metadata }) {
  const navigate = useNavigate();
  return (
    <div onClick={() => navigate(`/blog/${metadata.slug}`)}
      style={{ cursor:"pointer", paddingBottom:"0.65rem",
               borderBottom:"1px solid #F5F5F5" }}>
      <p style={{ margin:"0 0 0.15rem", fontSize:"0.75rem", fontWeight:600,
                  color:"#1C1C1C", lineHeight:1.3 }}
         onMouseEnter={e=>e.currentTarget.style.color="#2d6a2d"}
         onMouseLeave={e=>e.currentTarget.style.color="#1C1C1C"}>
        {metadata.title}
      </p>
      <p style={{ margin:0, fontSize:"0.62rem", color:"#AAAAAA",
                  fontFamily:"'DM Mono'" }}>
        {new Date(metadata.date).toLocaleDateString("en-IN",
          {day:"numeric",month:"short",year:"numeric"})}
      </p>
    </div>
  );
}

export default function BlogPage() {
  const [query,     setQuery]     = useState("");
  const [sortMode,  setSortMode]  = useState("newest");
  const [activeTag, setActiveTag] = useState("All");

  const allArticles = useMemo(() => getAllArticles(), []);
  const allTags     = useMemo(() => getAllTags(),     []);

  const filtered = useMemo(() => {
    let list = allArticles;
    if (activeTag !== "All")
      list = list.filter(a=>(a.metadata.tags||[]).includes(activeTag));
    list = list.filter(a=>matchesSearch(a.metadata, query));
    return sortArticles(list, sortMode);
  }, [allArticles, activeTag, query, sortMode]);

  const recentArticles = useMemo(() => allArticles.slice(0,3), [allArticles]);

  const inp = {
    border:"1.5px solid #E8E8E8", borderRadius:9,
    padding:"0.45rem 0.85rem", fontSize:"0.8rem",
    color:"#1C1C1C", background:"#FAFAFA",
    outline:"none", fontFamily:"'DM Sans',sans-serif",
    width:"100%", boxSizing:"border-box",
  };

  return (
    <div style={{ minHeight:"100vh", background:"#f0f4f0",
                  fontFamily:"'DM Sans','Segoe UI',sans-serif" }}>
      <link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&family=DM+Mono:wght@400;500&display=swap" rel="stylesheet"/>

      {/* Page header */}
      <div style={{ background:GREEN_GRAD, padding:"2rem 2rem 1.75rem",
                    boxShadow:"0 2px 12px rgba(0,0,0,0.15)" }}>
        <div style={{ maxWidth:1100, margin:"0 auto" }}>
          <div style={{ display:"flex", alignItems:"center",
                        gap:"0.7rem", marginBottom:"0.35rem" }}>
            <span style={{ fontSize:22 }}>📝</span>
            <h1 style={{ margin:0, color:"#fff", fontSize:"1.4rem",
                         fontWeight:700, letterSpacing:"-0.02em" }}>Blog</h1>
          </div>
          <p style={{ margin:0, color:"rgba(255,255,255,0.6)",
                      fontSize:"0.82rem", fontWeight:300 }}>
            Methods, tutorials, and research notes for plant scientists
          </p>
        </div>
      </div>

      <div style={{ maxWidth:1100, margin:"0 auto", padding:"1.75rem 1.5rem 3rem" }}>

        {/* Search + sort */}
        <div style={{ display:"flex", gap:"0.75rem",
                      marginBottom:"1rem", flexWrap:"wrap" }}>
          <div style={{ flex:1, minWidth:220, position:"relative" }}>
            <span style={{ position:"absolute", left:"0.75rem",
                           top:"50%", transform:"translateY(-50%)",
                           color:"#BBBBBB", fontSize:"0.8rem",
                           pointerEvents:"none" }}>🔍</span>
            <input value={query} onChange={e=>setQuery(e.target.value)}
                   placeholder="Search by title, tag, author…"
                   style={{ ...inp, paddingLeft:"2.1rem" }}/>
          </div>
          <select value={sortMode} onChange={e=>setSortMode(e.target.value)}
                  style={{ ...inp, width:"auto", cursor:"pointer" }}>
            {SORT_OPTIONS.map(o=><option key={o.value} value={o.value}>{o.label}</option>)}
          </select>
        </div>

        {/* Tag filter */}
        <div style={{ display:"flex", gap:"0.4rem", flexWrap:"wrap",
                      marginBottom:"1.5rem" }}>
          {["All",...allTags].map(tag=>(
            <TagPill key={tag} label={tag} active={activeTag===tag}
                     onClick={()=>setActiveTag(tag)}/>
          ))}
        </div>

        {/* Grid + sidebar */}
        <div style={{ display:"grid",
                      gridTemplateColumns:"1fr minmax(0,260px)",
                      gap:"1.5rem", alignItems:"start" }}>

          {/* Article grid */}
          <div>
            {filtered.length === 0 ? (
              <div style={{ background:"#fff", borderRadius:14,
                border:"1.5px dashed #E5E5E5", padding:"4rem 2rem",
                textAlign:"center" }}>
                <p style={{ margin:0, fontSize:"0.9rem", color:"#CCCCCC",
                            fontWeight:600 }}>No articles found</p>
                <p style={{ margin:"0.4rem 0 0", fontSize:"0.75rem",
                            color:"#DDDDDD" }}>Try a different search or tag</p>
              </div>
            ) : (
              <div style={{ display:"grid",
                gridTemplateColumns:"repeat(auto-fill,minmax(280px,1fr))",
                gap:"0.9rem" }}>
                {filtered.map(a=>(
                  <BlogCard key={a.metadata.slug} metadata={a.metadata}/>
                ))}
              </div>
            )}
            {filtered.length > 0 && (
              <p style={{ margin:"1rem 0 0", fontSize:"0.65rem",
                          color:"#BBBBBB", fontFamily:"'DM Mono'" }}>
                Showing {filtered.length} of {allArticles.length} article
                {allArticles.length!==1?"s":""}
                {activeTag!=="All"?` tagged "${activeTag}"`:""}
              </p>
            )}
          </div>

          {/* Sidebar */}
          <div style={{ display:"flex", flexDirection:"column",
                        gap:"0.75rem", position:"sticky", top:"1.5rem" }}>
            <div style={{ background:"#fff", borderRadius:13,
                          border:"1.5px solid #EBEBEB", padding:"1rem 1.1rem" }}>
              <p style={{ margin:"0 0 0.75rem", fontSize:"0.62rem", fontWeight:700,
                          color:"#AAAAAA", textTransform:"uppercase",
                          letterSpacing:1.2, fontFamily:"'DM Mono'" }}>
                Recent Articles
              </p>
              {recentArticles.length === 0
                ? <p style={{ margin:0, fontSize:"0.72rem", color:"#CCCCCC" }}>No articles yet</p>
                : <div style={{ display:"flex", flexDirection:"column", gap:"0.65rem" }}>
                    {recentArticles.map(a=>(
                      <RecentItem key={a.metadata.slug} metadata={a.metadata}/>
                    ))}
                  </div>
              }
            </div>
            <div style={{ background:"#fff", borderRadius:13,
                          border:"1.5px solid #EBEBEB", padding:"1rem 1.1rem" }}>
              <p style={{ margin:"0 0 0.65rem", fontSize:"0.62rem", fontWeight:700,
                          color:"#AAAAAA", textTransform:"uppercase",
                          letterSpacing:1.2, fontFamily:"'DM Mono'" }}>
                Browse by Tag
              </p>
              <div style={{ display:"flex", flexWrap:"wrap", gap:"0.35rem" }}>
                {allTags.map(tag=>(
                  <TagPill key={tag} label={tag} active={activeTag===tag}
                           onClick={()=>setActiveTag(activeTag===tag?"All":tag)}/>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
